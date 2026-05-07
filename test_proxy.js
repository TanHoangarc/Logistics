const fetch = require('node-fetch');
async function test() {
  const url = "https://docs.google.com/spreadsheets/d/1yMl4DMQM8YTj-0DH27yO8y_LTRMI6Sz4/export?format=xlsx";
  const proxy1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const proxy2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  try {
     const r1 = await fetch(proxy1);
     console.log("allorigins", r1.status);
  } catch(e) { console.log("allorigins error", e.message); }
  
  try {
     const r2 = await fetch(proxy2);
     console.log("corsproxy.io", r2.status);
  } catch(e) { console.log("corsproxy.io error", e.message); }
}
test();
