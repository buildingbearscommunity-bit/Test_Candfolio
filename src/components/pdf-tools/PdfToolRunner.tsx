'use client';

import React, { DragEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfTool } from '@/lib/pdfTools';

type OutputFile = {
  name: string;
  mime: string;
  bytes: Uint8Array;
};

type PdfJsDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
};

type PdfJsPage = {
  getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
  getViewport(options: { scale: number }): { width: number; height: number };
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> };
};

type PdfToolRunnerProps = {
  tool: PdfTool;
};

const brand = rgb(0, 70 / 255, 67 / 255);

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

function isTextLike(file: File) {
  return file.type.startsWith('text/') || /\.(txt|md|html|rtf|csv)$/i.test(file.name);
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '') || 'document';
}

function toBlobPart(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function parsePageSelection(input: string, pageCount: number) {
  if (!input.trim()) return Array.from({ length: pageCount }, (_, index) => index);

  const pages = new Set<number>();
  input.split(',').forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const [startRaw, endRaw] = trimmed.split('-').map((value) => Number(value.trim()));
    const start = Math.max(1, Math.min(pageCount, startRaw || 1));
    const end = Math.max(1, Math.min(pageCount, endRaw || start));
    for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
      pages.add(page - 1);
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
}

function getDefaultPages(tool: PdfTool) {
  if (tool.slug.includes('delete')) return '1';
  if (tool.slug.includes('extract') || tool.slug.includes('split')) return '1';
  return '';
}

async function readFileBytes(file: File) {
  return new Uint8Array(await file.arrayBuffer());
}

function textFile(name: string, mime: string, content: string): OutputFile {
  return {
    name,
    mime,
    bytes: new TextEncoder().encode(content),
  };
}

async function savePdf(doc: PDFDocument, name: string): Promise<OutputFile> {
  return {
    name,
    mime: 'application/pdf',
    bytes: await doc.save({ useObjectStreams: true, addDefaultPage: false }),
  };
}

async function imageToPngBytes(file: File) {
  if (file.type === 'image/png') return new Uint8Array(await file.arrayBuffer());

  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare image canvas.');
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not convert image.');
  return new Uint8Array(await blob.arrayBuffer());
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = document.createElement('img');
    image.decoding = 'async';
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not load image file.'));
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertImagesToPdf(files: File[], title: string) {
  const doc = await PDFDocument.create();

  for (const file of files) {
    if (!isImage(file)) continue;
    const bytes = await imageToPngBytes(file);
    const image = await doc.embedPng(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  if (doc.getPageCount() === 0) throw new Error('Please upload at least one image file.');
  doc.setTitle(title);
  return savePdf(doc, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

async function textToPdf(files: File[], title: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const file of files) {
    if (!isTextLike(file)) continue;
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    let page = doc.addPage([595, 842]);
    let y = 790;
    for (const line of lines) {
      if (y < 50) {
        page = doc.addPage([595, 842]);
        y = 790;
      }
      page.drawText(line.slice(0, 95), { x: 48, y, size: 11, font, color: brand });
      y -= 17;
    }
  }

  if (doc.getPageCount() === 0) throw new Error('Please upload a text-like file.');
  doc.setTitle(title);
  return savePdf(doc, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

async function loadPdfJsDocument(file: File): Promise<PdfJsDocument> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
  const params = {
    data: await file.arrayBuffer(),
    disableWorker: true,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0];
  const task = pdfjs.getDocument(params);
  return task.promise as unknown as Promise<PdfJsDocument>;
}

async function extractPdfText(file: File) {
  const pdf = await loadPdfJsDocument(file);
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    content.items.forEach((item) => {
      const text = item.str?.trim();
      const transform = item.transform;
      if (!text || !transform) return;
      const x = Math.round(transform[4]);
      const y = Math.round(transform[5] / 4) * 4;
      rows.set(y, [...(rows.get(y) || []), { x, text }]);
    });

    const pageText = Array.from(rows.entries())
      .sort(([a], [b]) => b - a)
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
      .join('\n');

    pages.push(pageText);
  }

  return pages.join('\n\n');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function convertPdfToTextLike(file: File, tool: PdfTool): Promise<OutputFile> {
  const text = await extractPdfText(file);
  if (!text.trim()) {
    throw new Error('No selectable text was found in this PDF. Try OCR PDF for scanned documents.');
  }

  if (tool.slug.includes('markdown')) {
    return textFile(`${getBaseName(file.name)}.md`, 'text/markdown', text);
  }
  if (tool.slug.includes('html')) {
    return textFile(
      `${getBaseName(file.name)}.html`,
      'text/html',
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(getBaseName(file.name))}</title></head><body><pre>${escapeHtml(text)}</pre></body></html>`
    );
  }
  if (tool.slug.includes('excel') || tool.slug.includes('tables')) {
    return textFile(`${getBaseName(file.name)}.csv`, 'text/csv', text.split(/\r?\n/).map((line) => `"${line.replace(/"/g, '""')}"`).join('\n'));
  }
  if (tool.slug.includes('word')) {
    return textFile(`${getBaseName(file.name)}.doc`, 'application/msword', text);
  }
  if (tool.slug.includes('powerpoint')) {
    return textFile(`${getBaseName(file.name)}.txt`, 'text/plain', text);
  }
  return textFile(`${getBaseName(file.name)}.txt`, 'text/plain', text);
}

async function convertPdfToImages(file: File, tool: PdfTool): Promise<OutputFile> {
  const pdf = await loadPdfJsDocument(file);
  const zip = new JSZip();
  const wantsJpeg = tool.slug.includes('jpg');
  const wantsWebp = tool.slug.includes('webp');
  const mime = wantsJpeg ? 'image/jpeg' : wantsWebp ? 'image/webp' : 'image/png';
  const extension = wantsJpeg ? 'jpg' : wantsWebp ? 'webp' : 'png';

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, Math.max(1, 1400 / baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare preview canvas.');
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
    if (!blob) throw new Error('Could not render PDF page.');
    zip.file(`${getBaseName(file.name)}-page-${pageNumber}.${extension}`, blob);
  }

  return {
    name: `${getBaseName(file.name)}-${extension}-pages.zip`,
    mime: 'application/zip',
    bytes: new Uint8Array(await zip.generateAsync({ type: 'arraybuffer' })),
  };
}

function isPdfToTextTool(tool: PdfTool) {
  return /pdf-to-(txt|markdown|html|word|excel|powerpoint|epub)|extract-text|extract-tables/.test(tool.slug);
}

function isPdfToImageTool(tool: PdfTool) {
  return /pdf-to-(jpg|png|webp|tiff)|extract-images/.test(tool.slug);
}

async function mergePdf(files: File[]) {
  const output = await PDFDocument.create();
  for (const file of files) {
    if (!isPdf(file)) continue;
    let input: PDFDocument;
    try {
      input = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true, updateMetadata: false });
    } catch {
      throw new Error(`${file.name} could not be opened. It may be encrypted, password-protected, corrupt, or invalid.`);
    }
    const pages = await output.copyPages(input, input.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  if (output.getPageCount() === 0) throw new Error('Please upload at least one valid PDF.');
  output.setTitle('Merged PDF');
  return savePdf(output, 'merged.pdf');
}

async function splitPdf(file: File) {
  const input = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true });
  const zip = new JSZip();
  for (let index = 0; index < input.getPageCount(); index += 1) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(input, [index]);
    doc.addPage(page);
    zip.file(`${getBaseName(file.name)}-page-${index + 1}.pdf`, await doc.save({ useObjectStreams: true, addDefaultPage: false }));
  }
  return {
    name: `${getBaseName(file.name)}-split-pages.zip`,
    mime: 'application/zip',
    bytes: new Uint8Array(await zip.generateAsync({ type: 'arraybuffer' })),
  };
}

async function processPdf(file: File, tool: PdfTool, pagesInput: string, textInput: string) {
  let input: PDFDocument;
  try {
    input = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true, updateMetadata: false });
  } catch {
    throw new Error('This PDF could not be opened. It may be encrypted, password-protected, corrupt, or invalid.');
  }
  const output = await PDFDocument.create();
  const pageCount = input.getPageCount();
  const selection = parsePageSelection(pagesInput, pageCount);
  const font = await output.embedFont(StandardFonts.Helvetica);

  const copySelection = async (indices: number[]) => {
    const pages = await output.copyPages(input, indices);
    pages.forEach((page) => output.addPage(page));
  };

  if (tool.slug === 'split-pdf') return splitPdf(file);

  if (tool.slug.includes('delete-pages')) {
    const excluded = new Set(selection);
    await copySelection(input.getPageIndices().filter((index) => !excluded.has(index)));
  } else if (tool.slug.includes('extract-pages')) {
    await copySelection(selection);
  } else if (tool.slug.includes('duplicate-pages')) {
    await copySelection(input.getPageIndices());
    await copySelection(selection);
  } else if (tool.slug.includes('rotate')) {
    await copySelection(input.getPageIndices());
    output.getPages().forEach((page) => page.setRotation(degrees(90)));
  } else if (tool.slug.includes('add-blank-pages')) {
    await copySelection(input.getPageIndices());
    const firstPage = output.getPage(0);
    const { width, height } = firstPage.getSize();
    output.addPage([width, height]);
  } else if (tool.slug.includes('crop')) {
    await copySelection(input.getPageIndices());
    output.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      page.setCropBox(width * 0.05, height * 0.05, width * 0.9, height * 0.9);
    });
  } else if (tool.slug.includes('change-page-size')) {
    await copySelection(input.getPageIndices());
    output.getPages().forEach((page) => page.setSize(595, 842));
  } else {
    await copySelection(input.getPageIndices());
  }

  if (output.getPageCount() === 0) throw new Error('No pages remain after this operation.');

  const label = textInput.trim() || tool.name;
  const needsTextOverlay =
    /add-text|add-comments|sticky|annotate|highlight|underline|strike|shape|draw|watermark|header|footer|background|bates|stamp|sign|fill|page-numbers/.test(tool.slug);

  if (needsTextOverlay) {
    output.getPages().forEach((page, index) => {
      const { width, height } = page.getSize();
      if (tool.slug.includes('page-numbers') || tool.slug.includes('bates')) {
        page.drawText(`${index + 1}`, { x: width / 2 - 8, y: 24, size: 10, font, color: brand });
      } else if (tool.slug.includes('header')) {
        page.drawText(label, { x: 40, y: height - 36, size: 11, font, color: brand });
      } else if (tool.slug.includes('footer')) {
        page.drawText(label, { x: 40, y: 24, size: 11, font, color: brand });
      } else if (tool.slug.includes('watermark') || tool.slug.includes('background')) {
        page.drawText(label, { x: width * 0.18, y: height * 0.5, size: 42, font, color: rgb(0, 70 / 255, 67 / 255), rotate: degrees(30), opacity: 0.18 });
      } else {
        page.drawText(label, { x: 48, y: height - 72, size: 14, font, color: brand });
      }
    });
  }

  if (/remove-metadata|flatten|compress|optimize|reduce|repair/.test(tool.slug)) {
    output.setTitle('');
    output.setAuthor('');
    output.setSubject('');
    output.setKeywords([]);
    output.setProducer('Candfolio PDF Tools');
    output.setCreator('Candfolio PDF Tools');
  } else {
    output.setTitle(tool.name);
    output.setCreator('Candfolio PDF Tools');
  }

  return savePdf(output, `${tool.slug}.pdf`);
}

function acceptsMultiple(tool: PdfTool) {
  return /merge|batch|zip|jpg-to-pdf|png-to-pdf|webp-to-pdf|image|pages-per-sheet/.test(tool.slug);
}

function requiresPages(tool: PdfTool) {
  return /extract-pages|delete-pages|duplicate-pages|split-pdf/.test(tool.slug);
}

function requiresText(tool: PdfTool) {
  return /add-text|comments|sticky|annotate|watermark|header|footer|background|bates|stamp|sign|fill|highlight|underline|strike|shape|draw/.test(tool.slug);
}

function isToPdfTool(tool: PdfTool) {
  return tool.slug.endsWith('to-pdf') || tool.slug.includes('-to-pdf');
}

async function runTool(tool: PdfTool, files: File[], pagesInput: string, textInput: string): Promise<OutputFile> {
  if (files.length === 0) throw new Error('Please upload a file to continue.');

  if (tool.slug === 'merge-pdf' || tool.slug === 'batch-processing') return mergePdf(files);
  if (tool.slug === 'zip-multiple-pdfs') {
    const pdfFiles = files.filter(isPdf);
    if (pdfFiles.length === 0) throw new Error('Please upload at least one PDF to create a zip.');
    const zip = new JSZip();
    pdfFiles.forEach((file) => zip.file(file.name, file));
    return {
      name: 'pdf-files.zip',
      mime: 'application/zip',
      bytes: new Uint8Array(await zip.generateAsync({ type: 'arraybuffer' })),
    };
  }
  if (isToPdfTool(tool) && files.some(isImage)) return convertImagesToPdf(files, tool.name);
  if (isToPdfTool(tool) && files.some(isTextLike)) return textToPdf(files, tool.name);

  const firstPdf = files.find(isPdf);
  if (!firstPdf) throw new Error('This tool currently needs a PDF, image, or text file that can be processed locally.');
  if (isPdfToTextTool(tool)) return convertPdfToTextLike(firstPdf, tool);
  if (isPdfToImageTool(tool)) return convertPdfToImages(firstPdf, tool);
  return processPdf(firstPdf, tool, pagesInput, textInput);
}

export default function PdfToolRunner({ tool }: PdfToolRunnerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pagesInput, setPagesInput] = useState(getDefaultPages(tool));
  const [textInput, setTextInput] = useState(tool.name);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [output, setOutput] = useState<OutputFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [inputPreviewUrl, setInputPreviewUrl] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    if (inputPreviewUrl) URL.revokeObjectURL(inputPreviewUrl);
  }, [inputPreviewUrl]);

  const setSelectedFiles = (nextFiles: FileList | File[]) => {
    setError('');
    setSuccess('');
    setOutput(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    const picked = Array.from(nextFiles);
    const selected = acceptsMultiple(tool) ? picked : picked.slice(0, 1);
    if (inputPreviewUrl) URL.revokeObjectURL(inputPreviewUrl);
    setInputPreviewUrl(selected[0] && isPdf(selected[0]) ? URL.createObjectURL(selected[0]) : '');
    setFiles(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSelectedFiles(event.dataTransfer.files);
  };

  const reset = () => {
    setFiles([]);
    setPagesInput(getDefaultPages(tool));
    setTextInput(tool.name);
    setProgress(0);
    setIsProcessing(false);
    setError('');
    setSuccess('');
    setOutput(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (inputPreviewUrl) URL.revokeObjectURL(inputPreviewUrl);
    setInputPreviewUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const process = async () => {
    setError('');
    setSuccess('');
    setOutput(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setIsProcessing(true);
    setProgress(15);

    try {
      const result = await runTool(tool, files, pagesInput, textInput);
      setProgress(90);
      setOutput(result);
      setPreviewUrl(URL.createObjectURL(new Blob([toBlobPart(result.bytes)], { type: result.mime })));
      setSuccess(`${tool.name} completed successfully.`);
      setProgress(100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not process this file.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([toBlobPart(output.bytes)], { type: output.mime }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = output.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[28px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-5 shadow-2xl shadow-[#872341]/10">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#872341]/20 bg-[#872341]/5 p-6 text-center transition hover:bg-[#872341]/10"
        >
          <Upload className="h-10 w-10" />
          <h2 className="mt-4 text-xl font-bold">Upload files</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#872341]/65">
            Drag and drop files here, or choose from your device. Multiple uploads are enabled when the tool supports them.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple={acceptsMultiple(tool)}
            onChange={(event) => event.target.files && setSelectedFiles(event.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-2xl bg-[#872341] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#872341]/90"
          >
            Choose files
          </button>
        </div>

        {files.length > 0 && (
          <div className="mt-5 space-y-2">
            {files.map((file) => (
              <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-2xl border border-[#872341]/10 bg-[#F0EDE5] p-3 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </span>
                <span className="text-[#872341]/60">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
        )}

        {(requiresPages(tool) || requiresText(tool)) && (
          <div className="mt-5 grid gap-4">
            {requiresPages(tool) && (
              <label className="text-sm font-semibold">
                Page selection
                <input
                  value={pagesInput}
                  onChange={(event) => setPagesInput(event.target.value)}
                  placeholder="Example: 1,3-5"
                  className="mt-2 w-full rounded-2xl border border-[#872341]/10 bg-[#F0EDE5] px-4 py-3 text-sm outline-none focus:border-[#872341]"
                />
              </label>
            )}
            {requiresText(tool) && (
              <label className="text-sm font-semibold">
                Text, stamp or note
                <textarea
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#872341]/10 bg-[#F0EDE5] px-4 py-3 text-sm outline-none focus:border-[#872341]"
                />
              </label>
            )}
          </div>
        )}

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#872341]/10">
          <div className="h-full rounded-full bg-[#872341] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {error && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#872341]/10 bg-[#872341]/10 p-4 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#872341]/10 bg-[#872341]/10 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={process}
            disabled={isProcessing || files.length === 0}
            className="inline-flex items-center justify-center rounded-2xl bg-[#872341] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#872341]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Process
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!output}
            className="inline-flex items-center justify-center rounded-2xl border border-[#872341]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#872341]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-2xl border border-[#872341]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#872341]/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-5 shadow-2xl shadow-[#872341]/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#872341]/60">Preview</p>
            <h2 className="mt-1 text-xl font-bold">Input and output preview</h2>
          </div>
        </div>
        <div className="mt-5 h-[560px] overflow-hidden rounded-[24px] border border-[#872341]/10 bg-[#872341]/5">
          {previewUrl && output?.mime === 'application/pdf' ? (
            <iframe src={previewUrl} title="Processed PDF preview" className="h-full w-full" />
          ) : inputPreviewUrl ? (
            <iframe src={inputPreviewUrl} title="Input PDF preview" className="h-full w-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#872341]/65">
              <FileText className="h-12 w-12" />
              <p className="mt-4 text-sm leading-6">Upload a PDF to preview it here. Processed PDFs will replace the input preview.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
