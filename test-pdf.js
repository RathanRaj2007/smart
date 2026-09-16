const fs = require('fs');
const pdfParse = require('pdf-parse');

async function run() {
  const files = fs.readdirSync('storage/knowledge-docs').filter(f => f.endsWith('.pdf'));
  if (files.length === 0) return console.log('no pdfs');
  const buf = fs.readFileSync('storage/knowledge-docs/' + files[0]);
  const parserResult = await pdfParse(buf);
  console.log('Success!', parserResult.text.substring(0, 50).replace(/\n/g, ' '));
}
run().catch(console.error);
