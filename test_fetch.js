const fetch = require('node-fetch');
async function test() {
  const url = "https://docs.google.com/spreadsheets/d/1yMl4DMQM8YTj-0DH27yO8y_LTRMI6Sz4/export?format=xlsx";
  const res = await fetch(url);
  console.log(res.status);
  console.log(res.headers.get('content-type'));
}
test();
