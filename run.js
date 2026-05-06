const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace(/Người nhận\/Nộp|người nhận\/nộp|Người nhận \/ Nộp|Người nhận Nộp/g, 'Agent');
fs.writeFileSync('src/App.tsx', c);
