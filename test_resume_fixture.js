const JSZip = require('jszip');
const PDFDocument = require('pdfkit');

async function makeDocxBuffer() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`);
  zip.folder('word').file('header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Portfolio: github.com/jordanrivera</w:t></w:r></w:p>
</w:hdr>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/></w:sectPr>
<w:p><w:r><w:t>Jordan Rivera</w:t></w:r></w:p>
<w:p><w:r><w:t>Data Analyst</w:t></w:r></w:p>
<w:p><w:r><w:t>jordan@example.com | +1 555 123 4567 | linkedin.com/in/jordanrivera</w:t></w:r></w:p>
<w:p><w:r><w:t>Professional Summary</w:t></w:r></w:p>
<w:p><w:r><w:t>Data analyst with 5 years of experience building dashboards and improving reporting automation.</w:t></w:r></w:p>
<w:p><w:r><w:t>Professional Experience</w:t></w:r></w:p>
<w:p><w:r><w:t>Senior Data Analyst at Northwind Analytics</w:t></w:r></w:p>
<w:p><w:r><w:t>Jan 2021 - Present</w:t></w:r></w:p>
<w:p><w:r><w:t>• Built Power BI dashboards used by leadership.</w:t></w:r></w:p>
<w:p><w:r><w:t>• Automated SQL reporting pipelines and reduced manual work.</w:t></w:r></w:p>
<w:p><w:r><w:t>Business Analyst - Contoso Retail</w:t></w:r></w:p>
<w:p><w:r><w:t>2018 - 2020</w:t></w:r></w:p>
<w:p><w:r><w:t>• Created Excel models and weekly KPI reporting.</w:t></w:r></w:p>
<w:p><w:r><w:t>Education</w:t></w:r></w:p>
<w:tbl>
<w:tr><w:tc><w:p><w:r><w:t>B.S. Computer Science</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>State University</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>2014 - 2018</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
<w:p><w:r><w:t>Technical Skills: SQL, Power BI, Excel, Python, DAX, Tableau, Data Modeling, ETL</w:t></w:r></w:p>
</w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

function makePdfBuffer() {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.fontSize(20).text('Avery Chen');
    doc.fontSize(10).text('Product Analyst | avery@example.com | +1 555 222 1000');
    doc.moveDown();
    doc.fontSize(12).text('Work History', 48, 120);
    doc.fontSize(10).text('Product Analyst at Fabrikam', 48, 145);
    doc.text('03/2020 - Present', 48, 160);
    doc.text('• Built metrics dashboards for product launches', 48, 178);
    doc.text('• Partnered with engineering to improve activation', 48, 194);
    doc.fontSize(12).text('Education', 330, 120);
    doc.fontSize(10).text('M.S. Analytics - Metro University', 330, 145);
    doc.text('2018 - 2020', 330, 160);
    doc.fontSize(12).text('Skills', 330, 210);
    doc.fontSize(10).text('SQL, Python, Power BI, A/B Testing, Excel', 330, 235);
    doc.end();
  });
}

async function postResume(buffer, filename, type) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), filename);
  const response = await fetch('http://localhost:3000/api/parse-resume', {
    method: 'POST',
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${filename}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  const docx = await postResume(
    await makeDocxBuffer(),
    'multi-section-table-resume.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  const pdf = await postResume(await makePdfBuffer(), 'two-column-resume.pdf', 'application/pdf');

  for (const [label, data] of [
    ['DOCX', docx],
    ['PDF', pdf],
  ]) {
    console.log(`\n=== ${label} ===`);
    console.log('name:', data.resume.personal_info.name);
    console.log('experience:', data.resume.experience.length);
    console.log('education:', data.resume.education.length);
    console.log('skills:', data.resume.skills.length, data.resume.skills.join(', '));
    console.log('raw length:', data.rawText.length);
    console.log('has preview html:', Boolean(data.previewHtml));
    if (
      (label === 'PDF' && (data.resume.experience.length === 0 || data.resume.education.length === 0)) ||
      (label === 'DOCX' && data.resume.personal_info.name !== 'Jordan Rivera')
    ) {
      console.log('raw text:\n' + data.rawText);
    }
  }
})();
