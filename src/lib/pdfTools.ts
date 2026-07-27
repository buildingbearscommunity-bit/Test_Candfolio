export type PdfToolCategory = {
  id: string;
  title: string;
  description: string;
  icon: PdfToolIcon;
  tools: PdfTool[];
};

export type PdfTool = {
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: PdfToolIcon;
  popular?: boolean;
};

export type PdfToolIcon =
  | 'badge'
  | 'book'
  | 'cloud'
  | 'compress'
  | 'convert'
  | 'crop'
  | 'download'
  | 'edit'
  | 'eye'
  | 'file'
  | 'files'
  | 'form'
  | 'image'
  | 'layers'
  | 'lock'
  | 'pen'
  | 'printer'
  | 'scan'
  | 'search'
  | 'signature'
  | 'sparkles'
  | 'stamp'
  | 'text'
  | 'upload'
  | 'wand';

const popularToolNames = new Set([
  'Merge PDF',
  'Split PDF',
  'Compress PDF',
  'PDF to Word',
  'Word to PDF',
  'OCR PDF',
  'Edit PDF Text',
  'Sign PDF',
]);

const categoryDefinitions: Array<{
  id: string;
  title: string;
  description: string;
  icon: PdfToolIcon;
  toolIcon: PdfToolIcon;
  tools: string[];
}> = [
  {
    id: 'organization',
    title: 'PDF Organization',
    description: 'Arrange, reorder, rotate and prepare documents for polished delivery.',
    icon: 'layers',
    toolIcon: 'files',
    tools: ['Merge PDF', 'Split PDF', 'Organize Pages', 'Reorder Pages', 'Extract Pages', 'Delete Pages', 'Duplicate Pages', 'Rotate PDF', 'Crop PDF', 'Rearrange Pages', 'Change Page Size', 'Add Blank Pages', 'Booklet PDF', 'Pages Per Sheet'],
  },
  {
    id: 'editing',
    title: 'PDF Editing',
    description: 'Add text, markups, comments and form fields without leaving the browser.',
    icon: 'edit',
    toolIcon: 'pen',
    tools: ['Edit PDF Text', 'Edit Images in PDF', 'Add Images', 'Add Text', 'Draw on PDF', 'Highlight Text', 'Underline Text', 'Strike Through Text', 'Add Shapes', 'Add Comments', 'Add Sticky Notes', 'Annotate PDF', 'Fill PDF Forms', 'Create Fillable PDF'],
  },
  {
    id: 'to-pdf',
    title: 'Convert To PDF',
    description: 'Turn office files, images and web content into clean PDF documents.',
    icon: 'convert',
    toolIcon: 'file',
    tools: ['Word to PDF', 'Excel to PDF', 'PowerPoint to PDF', 'JPG to PDF', 'PNG to PDF', 'WEBP to PDF', 'TIFF to PDF', 'HEIC to PDF', 'SVG to PDF', 'HTML to PDF', 'TXT to PDF', 'EPUB to PDF', 'RTF to PDF', 'ODT to PDF', 'ODS to PDF', 'ODP to PDF'],
  },
  {
    id: 'from-pdf',
    title: 'Convert From PDF',
    description: 'Export PDFs into editable documents, images and structured text.',
    icon: 'download',
    toolIcon: 'convert',
    tools: ['PDF to Word', 'PDF to Excel', 'PDF to PowerPoint', 'PDF to JPG', 'PDF to PNG', 'PDF to WEBP', 'PDF to TIFF', 'PDF to SVG', 'PDF to HTML', 'PDF to TXT', 'PDF to EPUB', 'PDF to Markdown', 'PDF to PDF/A'],
  },
  {
    id: 'compression',
    title: 'Compression & Optimization',
    description: 'Reduce file size, repair files and optimize PDFs for sharing.',
    icon: 'compress',
    toolIcon: 'sparkles',
    tools: ['Compress PDF', 'Compress Images in PDF', 'Repair PDF', 'Flatten PDF', 'Optimize PDF', 'Reduce PDF Size', 'Remove Metadata'],
  },
  {
    id: 'ocr',
    title: 'OCR & Text Extraction',
    description: 'Recognize text, extract tables and make scanned files searchable.',
    icon: 'search',
    toolIcon: 'text',
    tools: ['OCR PDF', 'OCR Images', 'Searchable PDF', 'Extract Text', 'Extract Tables', 'Extract Images', 'Extract Metadata'],
  },
  {
    id: 'signature',
    title: 'Digital Signature',
    description: 'Prepare signing workflows, stamps and signature verification tools.',
    icon: 'signature',
    toolIcon: 'signature',
    tools: ['Sign PDF', 'Fill & Sign', 'Request Signatures', 'Verify Digital Signature', 'Stamp PDF'],
  },
  {
    id: 'watermarks',
    title: 'Watermarks & Numbering',
    description: 'Brand, number and protect documents with page-level additions.',
    icon: 'stamp',
    toolIcon: 'stamp',
    tools: ['Add Watermark', 'Remove Watermark', 'Add Page Numbers', 'Add Header', 'Add Footer', 'Add Background', 'Add Bates Numbering'],
  },
  {
    id: 'forms',
    title: 'Forms & Templates',
    description: 'Start from useful document templates and guided form workflows.',
    icon: 'form',
    toolIcon: 'form',
    tools: ['Fill Government Forms', 'Tax Forms', 'Business Forms', 'HR Forms', 'Legal Forms', 'Resume Templates', 'Invoice Templates', 'Agreement Templates'],
  },
  {
    id: 'image-tools',
    title: 'Image Tools',
    description: 'Prepare images before converting, attaching or sharing documents.',
    icon: 'image',
    toolIcon: 'image',
    tools: ['Compress Image', 'Resize Image', 'Crop Image', 'Rotate Image', 'Flip Image', 'Convert Image Format', 'Remove Background', 'Enhance Image', 'Watermark Image', 'Image OCR'],
  },
  {
    id: 'office',
    title: 'Office Document Tools',
    description: 'Companion utilities for common office and text document formats.',
    icon: 'book',
    toolIcon: 'file',
    tools: ['Word Tools', 'Excel Tools', 'PowerPoint Tools', 'HTML Tools', 'Text Tools', 'Markdown Tools'],
  },
  {
    id: 'utilities',
    title: 'Viewing & Utilities',
    description: 'Preview, print, scan, share and manage everyday document workflows.',
    icon: 'eye',
    toolIcon: 'wand',
    tools: ['PDF Viewer', 'Document Preview', 'Print PDF', 'Download PDF', 'Share PDF', 'Scan to PDF', 'Create PDF', 'Batch Processing', 'Zip Multiple PDFs', 'Cloud Storage Integration', 'Recent Files', 'File History'],
  },
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/pdf\/a/g, 'pdf-a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDescription(name: string, category: string) {
  if (name.includes(' to PDF')) return `Convert ${name.replace(' to PDF', '')} files into polished PDFs.`;
  if (name.startsWith('PDF to ')) return `Export PDF content into ${name.replace('PDF to ', '')} format.`;
  if (name.includes('OCR')) return 'Recognize text from scans and image-based documents.';
  if (name.includes('Compress') || name.includes('Reduce')) return 'Shrink file size while keeping documents easy to share.';
  if (name.includes('Sign')) return 'Prepare signature-ready document workflows.';
  if (name.includes('Template') || name.includes('Forms')) return 'Start from structured documents for faster completion.';
  return `${name} tools for ${category.toLowerCase()} workflows.`;
}

export const pdfToolCategories: PdfToolCategory[] = categoryDefinitions.map((category) => ({
  id: category.id,
  title: category.title,
  description: category.description,
  icon: category.icon,
  tools: category.tools.map((toolName) => ({
    name: toolName,
    slug: toSlug(toolName),
    category: category.title,
    description: getDescription(toolName, category.title),
    icon: category.toolIcon,
    popular: popularToolNames.has(toolName),
  })),
}));

export const pdfTools = pdfToolCategories.flatMap((category) => category.tools);

export const popularPdfTools = pdfTools.filter((tool) => tool.popular);

export function getPdfToolBySlug(slug: string) {
  return pdfTools.find((tool) => tool.slug === slug);
}
