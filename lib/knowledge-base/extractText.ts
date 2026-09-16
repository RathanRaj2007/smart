import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (buf: Uint8Array) => {
    getText: () => Promise<string>
    destroy: () => Promise<void>
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeText(input: any): string {
  if (!input) return ''
  if (typeof input !== 'string') {
    if (typeof input === 'object') {
      throw new Error(`Extraction failed: expected string but received ${Array.isArray(input) ? 'Array' : 'Object'}`);
    }
    input = String(input);
  }
  // Normalize line endings
  let t = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // Replace tabs with space
  t = t.replace(/\t+/g, ' ')
  // Collapse multiple spaces
  t = t.replace(/ {2,}/g, ' ')
  // Trim trailing spaces on each line
  t = t.split('\n').map((l: string) => l.trimEnd()).join('\n')
  // Collapse excessive blank lines to maximum two (preserve paragraph separation)
  t = t.replace(/\n{3,}/g, '\n\n')
  // Trim overall
  t = t.trim()
  return t
}

export async function extractTextFromFile(storagePath: string): Promise<string> {
  if (!storagePath) throw new Error('Missing storage path')

  const ext = path.extname(storagePath).toLowerCase()

  const buf = await fs.promises.readFile(storagePath)

  let rawText = ''

  try {
    if (ext === '.pdf') {
      // pdf-parse v2+ requires instantiating PDFParse and calling getText
      // Strict Uint8Array is required by pdf.js underlying the library
      const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
      const parser = new PDFParse(uint8)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parserResult: any = await parser.getText()
        if (typeof parserResult === 'string') {
          rawText = parserResult
        } else if (parserResult && typeof parserResult === 'object') {
          if (typeof parserResult.text === 'string') {
            rawText = parserResult.text
          } else if (Array.isArray(parserResult)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rawText = parserResult.map((p: any) => p.text || '').join('\n')
          } else if (Array.isArray(parserResult.pages)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rawText = parserResult.pages.map((p: any) => p.text || '').join('\n')
          } else {
            rawText = String(parserResult)
          }
        }
        console.log(`[extractText] PDF extracted characters: ${rawText.length}`)
      } finally {
        await parser.destroy()
      }
    } else if (ext === '.docx') {
      // mammoth converts buffer or file
      const result = await mammoth.extractRawText({ buffer: buf })
      rawText = result && result.value ? String(result.value) : ''
      console.log(`[extractText] DOCX extracted characters: ${rawText.length}`)
    } else if (ext === '.txt' || ext === '.md') {
      rawText = buf.toString('utf8')
      console.log(`[extractText] TXT extracted characters: ${rawText.length}`)
    } else if (ext === '.doc') {
      // .doc old binary format not supported here - reject
      throw new Error('DOC (binary) format is not supported. Convert to DOCX or PDF.')
    } else {
      // Fallback: try to treat as text
      rawText = buf.toString('utf8')
    }
  } catch (err) {
    // Re-throw to be handled by caller
    throw err
  }

  const normalized = normalizeText(rawText)

  // Consider a document meaningful if it has at least 20 non-whitespace chars
  if (!normalized || normalized.replace(/\s+/g, '').length < 20) {
    throw new Error('No meaningful text could be extracted from the document')
  }

  return normalized
}

export default extractTextFromFile
