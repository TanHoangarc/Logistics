import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /await addDoc\(collection\(db, 'cashTransactions'\), \{\n\s+\.\.\.t,\n\s+voucherNumber: vn\n\s+\}\);/,
  `await addDoc(collection(db, 'cashTransactions'), {
        ...t,
        voucherNumber: vn,
        createdAt: Date.now(),
      });`
);

code = code.replace(
  /const newDoc = \{ \.\.\.t, voucherNumber: vn \};\n\s+await addDoc\(collection\(db, 'cashTransactions'\), newDoc\);/,
  `const newDoc = { ...t, voucherNumber: vn, createdAt: Date.now() };
        await addDoc(collection(db, 'cashTransactions'), newDoc);`
);

code = code.replace(
  /await addDoc\(collection\(db, 'wcaTransactions'\), \{\n\s+\.\.\.t,\n\s+voucherNumber: vn\n\s+\}\);/,
  `await addDoc(collection(db, 'wcaTransactions'), {
        ...t,
        voucherNumber: vn,
        createdAt: Date.now(),
      });`
);

fs.writeFileSync('src/App.tsx', code);
