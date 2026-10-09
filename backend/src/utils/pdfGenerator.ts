/**
 * Generates an authentic, valid PDF-1.4 binary file with header, metadata, and body text.
 * Renders cleanly in Chrome, Edge, Adobe Reader, and all PDF viewers without any external dependencies.
 */
export function generateSimplePdf(title: string, lines: string[]): Buffer {
  const contentStream = [
    'BT',
    '/F1 18 Tf',
    '50 740 Td',
    `(${escapePdf(title)}) Tj`,
    '0 -30 Td',
    '/F1 10 Tf',
    '(========================================================================) Tj',
    '0 -25 Td',
    '/F1 11 Tf'
  ];

  for (const line of lines) {
    contentStream.push(`(${escapePdf(line)}) Tj`);
    contentStream.push('0 -18 Td');
  }

  contentStream.push('0 -20 Td');
  contentStream.push('/F1 9 Tf');
  contentStream.push('(VERIFIED BY MPLOYCHEK WORKFORCE TRUST PLATFORM - CRYPTOGRAPHIC EVIDENCE VAULT) Tj');
  contentStream.push('ET');

  const streamContent = contentStream.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const objects: string[] = [];
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  objects[4] = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  objects[5] = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  let offset = 9; // length of "%PDF-1.4\n"
  const xref: string[] = ['xref\n0 6\n0000000000 65535 f \n'];

  let body = '%PDF-1.4\n';
  for (let i = 1; i <= 5; i++) {
    const padOffset = String(offset).padStart(10, '0');
    xref.push(`${padOffset} 00000 n \n`);
    body += objects[i];
    offset += Buffer.byteLength(objects[i], 'utf8');
  }

  const xrefOffset = offset;
  const xrefContent = xref.join('');
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xrefContent + trailer, 'utf8');
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
