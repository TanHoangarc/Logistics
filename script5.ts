import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const sortedForExport = \[\.\.\.transactions\]\.sort\(\(a, b\) => \{\n\s+if \(a\.date !== b\.date\) return a\.date\.localeCompare\(b\.date\);\n\s+if \(a\.voucherNumber !== b\.voucherNumber\) return a\.voucherNumber\.localeCompare\(b\.voucherNumber\);\n\s+return a\.id\.localeCompare\(b\.id\);\n\s+\}\);/,
  `const sortedForExport = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
      const numA = parseInt((a.voucherNumber || '').replace(/\\D/g, '')) || 0;
      const numB = parseInt((b.voucherNumber || '').replace(/\\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.id.localeCompare(b.id);
    });`
);

code = code.replace(
  /const sortedAll = \[\.\.\.transactions\]\.sort\(\(a, b\) => \{\n\s+if \(a\.date !== b\.date\) return a\.date\.localeCompare\(b\.date\);\n\s+if \(a\.voucherNumber !== b\.voucherNumber\) return \(a\.voucherNumber \|\| ''\)\.localeCompare\(b\.voucherNumber \|\| ''\);\n\s+return a\.id\.localeCompare\(b\.id\);\n\s+\}\);/,
  `const sortedAll = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.createdAt !== undefined && b.createdAt !== undefined) return a.createdAt - b.createdAt;
    const numA = parseInt((a.voucherNumber || '').replace(/\\D/g, '')) || 0;
    const numB = parseInt((b.voucherNumber || '').replace(/\\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });`
);

fs.writeFileSync('src/App.tsx', code);
