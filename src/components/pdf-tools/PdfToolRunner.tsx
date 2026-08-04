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

type ExtractedDocument = {
  name: string;
  text: string;
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

const brand = rgb(135 / 255, 35 / 255, 65 / 255);
const gold = rgb(201 / 255, 162 / 255, 39 / 255);

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

function isTextLike(file: File) {
  return file.type.startsWith('text/') || /\.(txt|md|html|rtf|csv|json)$/i.test(file.name);
}

function isOfficeLike(file: File) {
  return /\.(docx|xlsx|pptx|odt|ods|odp|epub)$/i.test(file.name);
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
  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    throw new Error(`${file.name} could not be read by this browser. Try PNG, JPG, WEBP, SVG, or another supported image format.`);
  }
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
  if ('createImageBitmap' in window && !/svg/i.test(file.type) && !/\.svg$/i.test(file.name)) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall back to <img>; some browsers reject WEBP/TIFF/HEIC through createImageBitmap.
    }
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

async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const lower = file.name.toLowerCase();
  if (isTextLike(file)) {
    let text = await file.text();
    if (lower.endsWith('.html')) text = text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
    if (lower.endsWith('.rtf')) text = text.replace(/\\'[0-9a-f]{2}/gi, ' ').replace(/[{}]/g, ' ').replace(/\\[a-z]+\d* ?/gi, ' ');
    return { name: file.name, text };
  }

  if (!isOfficeLike(file)) throw new Error(`${file.name} is not a supported document format.`);
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const parts: string[] = [];
  const wanted = Object.keys(zip.files).filter((path) =>
    /word\/document\.xml|xl\/sharedStrings\.xml|ppt\/slides\/slide\d+\.xml|content\.xml|OPS\/.*\.xhtml|OEBPS\/.*\.xhtml/i.test(path)
  );
  for (const path of wanted) {
    const xml = await zip.files[path].async('text');
    parts.push(xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  const text = parts.filter(Boolean).join('\n\n');
  if (!text.trim()) throw new Error(`No readable text was found in ${file.name}.`);
  return { name: file.name, text };
}

async function documentsToPdf(files: File[], title: string) {
  const extracted: ExtractedDocument[] = [];
  for (const file of files) {
    if (isTextLike(file) || isOfficeLike(file)) extracted.push(await extractDocumentText(file));
  }
  if (extracted.length === 0) throw new Error('Please upload at least one supported office or text document.');

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const item of extracted) {
    const lines = item.text.split(/\r?\n/).flatMap((line) => wrapLine(line, 92));
    let page = doc.addPage([595, 842]);
    let y = 790;
    page.drawText(getBaseName(item.name), { x: 48, y, size: 16, font: bold, color: brand });
    y -= 30;
    for (const line of lines) {
      if (y < 50) {
        page = doc.addPage([595, 842]);
        y = 790;
      }
      page.drawText(line, { x: 48, y, size: 11, font, color: brand });
      y -= 17;
    }
  }

  doc.setTitle(title);
  return savePdf(doc, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

function wrapLine(line: string, max = 95) {
  const words = line.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (`${current} ${word}`.trim().length > max) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function loadPdfJsDocument(file: File): Promise<PdfJsDocument> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  const params = {
    data: await file.arrayBuffer(),
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

async function extractPdfMetadata(file: File) {
  const pdf = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true, updateMetadata: false });
  const report = [
    'Candfolio PDF Metadata Report',
    '',
    `File: ${file.name}`,
    `Pages: ${pdf.getPageCount()}`,
    `Title: ${pdf.getTitle() || 'Not set'}`,
    `Author: ${pdf.getAuthor() || 'Not set'}`,
    `Subject: ${pdf.getSubject() || 'Not set'}`,
    `Creator: ${pdf.getCreator() || 'Not set'}`,
    `Producer: ${pdf.getProducer() || 'Not set'}`,
    `Creation Date: ${pdf.getCreationDate()?.toISOString() || 'Not set'}`,
    `Modification Date: ${pdf.getModificationDate()?.toISOString() || 'Not set'}`,
  ].join('\n');
  return textFile(`${getBaseName(file.name)}-metadata.txt`, 'text/plain', report);
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

async function buildBooklet(file: File) {
  const input = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true, updateMetadata: false });
  const output = await PDFDocument.create();
  const indices = input.getPageIndices();
  const order: number[] = [];
  let left = 0;
  let right = indices.length - 1;
  while (left <= right) {
    order.push(right);
    if (left !== right) order.push(left);
    left += 1;
    right -= 1;
  }
  const pages = await output.copyPages(input, order);
  pages.forEach((page) => output.addPage(page));
  output.setTitle('Booklet PDF');
  return savePdf(output, `${getBaseName(file.name)}-booklet.pdf`);
}

async function pagesPerSheet(file: File) {
  const input = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true, updateMetadata: false });
  const output = await PDFDocument.create();
  const embedded = await output.embedPdf(await readFileBytes(file), input.getPageIndices());
  for (let index = 0; index < embedded.length; index += 2) {
    const page = output.addPage([842, 595]);
    const left = embedded[index];
    page.drawPage(left, { x: 28, y: 44, width: 380, height: 507 });
    if (embedded[index + 1]) page.drawPage(embedded[index + 1], { x: 434, y: 44, width: 380, height: 507 });
  }
  output.setTitle('Pages Per Sheet');
  return savePdf(output, `${getBaseName(file.name)}-2-up.pdf`);
}

async function createTemplatePdf(tool: PdfTool, textInput: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: brand });
  page.drawText(tool.name, { x: 44, y: 804, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Candfolio professional document starter', { x: 44, y: 764, size: 10, font, color: brand });
  const sections = getTemplateSections(tool.slug);
  let y = 718;
  for (const section of sections) {
    page.drawText(section, { x: 44, y, size: 13, font: bold, color: brand });
    page.drawRectangle({ x: 44, y: y - 54, width: 507, height: 42, borderColor: rgb(0.82, 0.72, 0.76), borderWidth: 1 });
    y -= 82;
  }
  const note = textInput.trim();
  if (note && note !== tool.name) page.drawText(`Note: ${note.slice(0, 92)}`, { x: 44, y: 50, size: 10, font, color: brand });
  return savePdf(doc, `${tool.slug}.pdf`);
}

function getTemplateSections(slug: string) {
  if (slug.includes('invoice')) return ['Client Details', 'Invoice Items', 'Taxes & Discounts', 'Payment Terms', 'Authorized Signature'];
  if (slug.includes('resume')) return ['Professional Summary', 'Experience', 'Education', 'Skills', 'Certifications'];
  if (slug.includes('agreement') || slug.includes('legal')) return ['Parties', 'Scope', 'Terms', 'Confidentiality', 'Signatures'];
  if (slug.includes('tax')) return ['Taxpayer Details', 'Income Summary', 'Deductions', 'Declaration'];
  if (slug.includes('hr')) return ['Employee Details', 'Policy / Request', 'Approvals', 'Remarks'];
  if (slug.includes('government')) return ['Applicant Details', 'Identity Information', 'Request Details', 'Declaration'];
  return ['Overview', 'Details', 'Checklist', 'Approvals', 'Notes'];
}

async function createUtilityOutput(tool: PdfTool, files: File[], textInput: string) {
  if (tool.slug === 'download-pdf' || tool.slug === 'pdf-viewer' || tool.slug === 'document-preview' || tool.slug === 'print-pdf' || tool.slug === 'share-pdf') {
    const file = files.find(isPdf);
    if (!file) throw new Error('Please upload a PDF for this utility.');
    return { name: `${getBaseName(file.name)}-${tool.slug}.pdf`, mime: 'application/pdf', bytes: await readFileBytes(file) };
  }
  if (tool.slug === 'create-pdf' || tool.slug === 'scan-to-pdf') {
    if (files.some(isImage)) return convertImagesToPdf(files, tool.name);
    if (files.some((file) => isTextLike(file) || isOfficeLike(file))) return documentsToPdf(files, tool.name);
    return createTemplatePdf(tool, textInput);
  }
  const report = [
    `Candfolio ${tool.name}`,
    '',
    'This utility is ready for production API integration.',
    `Files selected: ${files.map((file) => file.name).join(', ') || 'None'}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    textInput.trim() && textInput !== tool.name ? `Notes: ${textInput.trim()}` : 'Use this workflow to track recent files, cloud actions, and document history.',
  ].join('\n');
  return textFile(`${tool.slug}-workflow.txt`, 'text/plain', report);
}

async function processImageTool(tool: PdfTool, files: File[], textInput: string): Promise<OutputFile> {
  const imageFile = files.find(isImage);
  if (!imageFile) throw new Error('Please upload an image for this tool.');
  const image = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const contextScale = tool.slug === 'resize-image' ? 0.5 : 1;
  const rotated = tool.slug === 'rotate-image';
  canvas.width = rotated ? sourceHeight : Math.max(1, Math.round(sourceWidth * contextScale));
  canvas.height = rotated ? sourceWidth : Math.max(1, Math.round(sourceHeight * contextScale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare image canvas.');
  if (tool.slug === 'rotate-image') {
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(Math.PI / 2);
    context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2);
  } else if (tool.slug === 'flip-image') {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else if (tool.slug === 'crop-image') {
    const size = Math.min(sourceWidth, sourceHeight);
    context.drawImage(image, (sourceWidth - size) / 2, (sourceHeight - size) / 2, size, size, 0, 0, canvas.width, canvas.height);
  } else {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  if (tool.slug === 'watermark-image') {
    context.globalAlpha = 0.72;
    context.fillStyle = '#872341';
    context.font = `${Math.max(18, canvas.width / 18)}px sans-serif`;
    context.fillText(textInput.trim() || 'Candfolio', 24, Math.max(42, canvas.height - 32));
  }
  if (tool.slug === 'enhance-image') {
    context.globalCompositeOperation = 'soft-light';
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
  }
  if (tool.slug === 'remove-background') {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < data.data.length; index += 4) {
      if (data.data[index] > 235 && data.data[index + 1] > 235 && data.data[index + 2] > 235) data.data[index + 3] = 0;
    }
    context.putImageData(data, 0, 0);
  }

  const wantsJpeg = tool.slug.includes('compress') || tool.slug.includes('format');
  const mime = wantsJpeg ? 'image/jpeg' : 'image/png';
  const extension = wantsJpeg ? 'jpg' : 'png';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, tool.slug.includes('compress') ? 0.68 : 0.92));
  if (!blob) throw new Error('Could not export image.');
  return { name: `${getBaseName(imageFile.name)}-${tool.slug}.${extension}`, mime, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

async function ocrImage(file: File) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(file);
    return textFile(`${getBaseName(file.name)}-ocr.txt`, 'text/plain', result.data.text || 'No text recognized.');
  } finally {
    await worker.terminate();
  }
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
  if (tool.slug === 'booklet-pdf') return buildBooklet(file);
  if (tool.slug === 'pages-per-sheet') return pagesPerSheet(file);

  if (/organize-pages|reorder-pages|rearrange-pages/.test(tool.slug)) {
    await copySelection(selection.length ? selection : input.getPageIndices());
  } else if (tool.slug.includes('delete-pages')) {
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
    const firstPage = output.getPages()[0] || input.getPage(0);
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
    /edit-pdf-text|edit-images|add-images|add-text|add-comments|sticky|annotate|highlight|underline|strike|shape|draw|watermark|header|footer|background|bates|stamp|sign|fill|request-signatures|create-fillable|page-numbers/.test(tool.slug);

  if (needsTextOverlay) {
    output.getPages().forEach((page, index) => {
      const { width, height } = page.getSize();
      if (tool.slug.includes('page-numbers') || tool.slug.includes('bates')) {
        const prefix = tool.slug.includes('bates') ? 'BATES-' : '';
        page.drawText(`${prefix}${String(index + 1).padStart(4, '0')}`, { x: width / 2 - 28, y: 24, size: 10, font, color: brand });
      } else if (tool.slug.includes('header')) {
        page.drawText(label, { x: 40, y: height - 36, size: 11, font, color: brand });
      } else if (tool.slug.includes('footer')) {
        page.drawText(label, { x: 40, y: 24, size: 11, font, color: brand });
      } else if (tool.slug.includes('watermark') || tool.slug.includes('background')) {
        page.drawText(label, { x: width * 0.18, y: height * 0.5, size: 42, font, color: brand, rotate: degrees(30), opacity: 0.18 });
      } else if (tool.slug.includes('highlight')) {
        page.drawRectangle({ x: 44, y: height - 92, width: Math.min(280, width - 88), height: 24, color: gold, opacity: 0.35 });
        page.drawText(label, { x: 48, y: height - 86, size: 12, font, color: brand });
      } else if (tool.slug.includes('underline')) {
        page.drawText(label, { x: 48, y: height - 72, size: 14, font, color: brand });
        page.drawLine({ start: { x: 48, y: height - 78 }, end: { x: 48 + Math.min(260, label.length * 7), y: height - 78 }, thickness: 1.5, color: brand });
      } else if (tool.slug.includes('strike')) {
        page.drawText(label, { x: 48, y: height - 72, size: 14, font, color: brand });
        page.drawLine({ start: { x: 48, y: height - 67 }, end: { x: 48 + Math.min(260, label.length * 7), y: height - 67 }, thickness: 1.5, color: brand });
      } else if (tool.slug.includes('shape') || tool.slug.includes('draw')) {
        page.drawRectangle({ x: 42, y: height - 112, width: 180, height: 58, borderColor: brand, borderWidth: 2, opacity: 0.9 });
        page.drawText(label, { x: 54, y: height - 82, size: 12, font, color: brand });
      } else if (tool.slug.includes('sign') || tool.slug.includes('signature')) {
        page.drawText(label, { x: width - 220, y: 72, size: 16, font, color: brand });
        page.drawLine({ start: { x: width - 230, y: 62 }, end: { x: width - 48, y: 62 }, thickness: 1, color: brand });
        page.drawText('Signature', { x: width - 230, y: 44, size: 8, font, color: brand });
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
  return /merge|batch|zip|jpg-to-pdf|png-to-pdf|webp-to-pdf|tiff-to-pdf|heic-to-pdf|svg-to-pdf|image|pages-per-sheet|scan-to-pdf|create-pdf|add-images|edit-images/.test(tool.slug);
}

function requiresPages(tool: PdfTool) {
  return /organize-pages|reorder-pages|rearrange-pages|extract-pages|delete-pages|duplicate-pages|split-pdf/.test(tool.slug);
}

function requiresText(tool: PdfTool) {
  return /edit-pdf-text|edit-images|add-images|add-text|comments|sticky|annotate|watermark|header|footer|background|bates|stamp|sign|fill|request-signatures|create-fillable|highlight|underline|strike|shape|draw|watermark-image/.test(tool.slug);
}

function canGenerateWithoutUpload(tool: PdfTool) {
  return /templates|forms|cloud-storage-integration|recent-files|file-history|create-pdf/.test(tool.slug);
}

function isToPdfTool(tool: PdfTool) {
  return tool.slug.endsWith('to-pdf') || tool.slug.includes('-to-pdf');
}

async function runTool(tool: PdfTool, files: File[], pagesInput: string, textInput: string): Promise<OutputFile> {
  if (files.length === 0 && !canGenerateWithoutUpload(tool)) throw new Error('Please upload a file to continue.');

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
  if (/templates|forms/.test(tool.slug)) return createTemplatePdf(tool, textInput);
  if (/cloud-storage-integration|recent-files|file-history|pdf-viewer|document-preview|print-pdf|download-pdf|share-pdf|scan-to-pdf|create-pdf/.test(tool.slug)) return createUtilityOutput(tool, files, textInput);
  if (/word-tools|excel-tools|powerpoint-tools|html-tools|text-tools|markdown-tools/.test(tool.slug)) return documentsToPdf(files, tool.name);
  if (/compress-image|resize-image|crop-image|rotate-image|flip-image|convert-image-format|remove-background|enhance-image|watermark-image/.test(tool.slug)) return processImageTool(tool, files, textInput);
  if (tool.slug === 'image-ocr' || tool.slug === 'ocr-images') {
    const image = files.find(isImage);
    if (!image) throw new Error('Please upload an image for OCR.');
    return ocrImage(image);
  }
  if (isToPdfTool(tool) && files.some(isImage)) return convertImagesToPdf(files, tool.name);
  if (isToPdfTool(tool) && files.some((file) => isTextLike(file) || isOfficeLike(file))) return documentsToPdf(files, tool.name);

  const firstPdf = files.find(isPdf);
  if (!firstPdf) throw new Error('Please upload a PDF, image, office document, or text file supported by this tool.');
  if (tool.slug === 'extract-metadata' || tool.slug === 'verify-digital-signature') return extractPdfMetadata(firstPdf);
  if (tool.slug === 'ocr-pdf' || tool.slug === 'searchable-pdf') {
    const text = await extractPdfText(firstPdf);
    if (text.trim()) return convertPdfToTextLike(firstPdf, { ...tool, slug: 'pdf-to-txt' });
    return textFile(`${getBaseName(firstPdf.name)}-ocr-needed.txt`, 'text/plain', 'This appears to be a scanned PDF. Browser OCR for full PDF pages is ready for server/API integration; use PDF to PNG and Image OCR for page-level OCR today.');
  }
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
            accept=".pdf,.txt,.md,.html,.csv,.rtf,.json,.docx,.xlsx,.pptx,.odt,.ods,.odp,.epub,.png,.jpg,.jpeg,.webp,.svg,.tif,.tiff,.heic,application/pdf,image/*,text/*"
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
            disabled={isProcessing || (files.length === 0 && !canGenerateWithoutUpload(tool))}
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
