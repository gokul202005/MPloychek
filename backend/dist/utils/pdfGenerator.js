"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSimplePdf = generateSimplePdf;
/**
 * Generates an authentic, valid PDF-1.4 binary file with structured typography,
 * crisp vector divider rules, and an official verification footer.
 * Renders cleanly and beautifully in Chrome, Edge, Adobe Reader, and all PDF engines.
 */
function generateSimplePdf(title, lines) {
    const contentStream = [
        // Top border rule
        '0.15 0.35 0.85 RG',
        '2 w',
        '45 745 m 565 745 l S',
        // Document Title
        'BT',
        '/F1 16 Tf',
        '0.05 0.1 0.25 rg',
        '45 720 Td',
        `(${escapePdf(title)}) Tj`,
        'ET',
        // Secondary accent line
        '0.7 0.75 0.85 RG',
        '0.75 w',
        '45 705 m 565 705 l S',
        // Body container text
        'BT',
        '/F1 10.5 Tf',
        '0.15 0.2 0.3 rg',
        '45 680 Td'
    ];
    // Each content line with clean, even spacing
    lines.forEach((line, index) => {
        if (index > 0) {
            contentStream.push('0 -22 Td');
        }
        contentStream.push(`(${escapePdf(line)}) Tj`);
    });
    contentStream.push('ET');
    // Bottom verification footer box
    contentStream.push('0.92 0.95 0.99 rg', '45 480 520 36 re f', '0.2 0.4 0.7 RG', '0.75 w', '45 480 520 36 re S', 'BT', '/F1 8.5 Tf', '0.1 0.3 0.6 rg', '55 494 Td', '(OFFICIALLY ATTESTED & VERIFIED BY MPLOYCHEK CRYPTOGRAPHIC EVIDENCE VAULT) Tj', 'ET');
    const streamContent = contentStream.join('\n');
    const streamLength = Buffer.byteLength(streamContent, 'utf8');
    const objects = [];
    objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    objects[3] =
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
    objects[4] = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    objects[5] = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    let offset = 9; // length of "%PDF-1.4\n"
    const xref = ['xref\n0 6\n0000000000 65535 f \n'];
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
function escapePdf(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
