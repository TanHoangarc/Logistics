const https = require('https');
const url = "https://docs.google.com/spreadsheets/d/1yMl4DMQM8YTj-0DH27yO8y_LTRMI6Sz4/export?format=xlsx";

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
     console.log('Redirects to:', res.headers.location);
     https.get(res.headers.location, (redirRes) => {
        console.log('Redir Status Code:', redirRes.statusCode);
        console.log('Redir Content-Type:', redirRes.headers['content-type']);
     });
  }
}).on('error', (e) => {
  console.error(e);
});
