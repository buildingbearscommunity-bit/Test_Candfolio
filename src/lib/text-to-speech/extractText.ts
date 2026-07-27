export type ExtractedDocument = {
  text: string;
  pages?: number;
};

export type ExtractionProgress = {
  stage: string;
  progress: number;
};

type PdfJsDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
  }>;
};

type MammothBrowser = {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
};

function fileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

async function extractPdf(file: File, onProgress?: (progress: ExtractionProgress) => void): Promise<ExtractedDocument> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
  const params = {
    data: await file.arrayBuffer(),
    disableWorker: true,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0];
  const pdf = (await pdfjs.getDocument(params).promise) as unknown as PdfJsDocument;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.({
      stage: `Reading PDF page ${pageNumber} of ${pdf.numPages}`,
      progress: Math.round((pageNumber / pdf.numPages) * 90),
    });
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

    pages.push(
      Array.from(rows.entries())
        .sort(([a], [b]) => b - a)
        .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
        .join('\n')
    );
  }

  return { text: normalizeExtractedText(pages.join('\n\n')), pages: pdf.numPages };
}

async function extractDocx(file: File, onProgress?: (progress: ExtractionProgress) => void): Promise<ExtractedDocument> {
  onProgress?.({ stage: 'Reading Word document', progress: 45 });
  const mammoth = (await import('mammoth/mammoth.browser')) as MammothBrowser;
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: normalizeExtractedText(result.value) };
}

async function extractImage(file: File, onProgress?: (progress: ExtractionProgress) => void): Promise<ExtractedDocument> {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(file, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.({
          stage: 'Running image OCR',
          progress: Math.max(5, Math.round(message.progress * 95)),
        });
      }
    },
  });

  return { text: normalizeExtractedText(result.data.text) };
}

export function isSupportedSpeechDocument(file: File) {
  const extension = fileExtension(file);
  return ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'].includes(extension);
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedDocument> {
  const extension = fileExtension(file);
  onProgress?.({ stage: 'Preparing document', progress: 8 });

  if (extension === 'pdf' || file.type === 'application/pdf') return extractPdf(file, onProgress);
  if (extension === 'docx') return extractDocx(file, onProgress);
  if (extension === 'txt' || file.type.startsWith('text/')) {
    onProgress?.({ stage: 'Reading text file', progress: 75 });
    return { text: normalizeExtractedText(await file.text()) };
  }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension) || file.type.startsWith('image/')) {
    return extractImage(file, onProgress);
  }

  throw new Error('Please upload a PDF, DOCX, TXT, PNG, JPG, JPEG, or WEBP file.');
}
