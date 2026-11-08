import fs from 'node:fs';
import zlib from 'node:zlib';

/**
 * Capa de texto de un .docx generado (Office Open XML = zip).
 *
 * Las specs del formato ATS (ADR-0039) afirman lo que ve un extractor: el
 * texto que vive en word/document.xml. Se parsea el central directory del zip
 * y se descomprime la entrada con node:zlib, sin dependencias extra (el repo
 * no declara un unzip; jszip solo llega como dependencia transitiva de docx).
 */

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

function readEntries(buffer: Buffer): ZipEntry[] {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('docx: no se encontro el final del zip');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new Error('docx: central directory corrupto');
    }
    const nameLength = buffer.readUInt16LE(offset + 28);
    entries.push({
      name: buffer.toString('utf8', offset + 46, offset + 46 + nameLength),
      method: buffer.readUInt16LE(offset + 10),
      compressedSize: buffer.readUInt32LE(offset + 20),
      localHeaderOffset: buffer.readUInt32LE(offset + 42)
    });
    offset += 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  return entries;
}

function readEntry(buffer: Buffer, entry: ZipEntry): Buffer {
  const start = entry.localHeaderOffset;
  if (buffer.readUInt32LE(start) !== LOCAL_SIGNATURE) {
    throw new Error('docx: entrada zip invalida');
  }
  const dataStart = start + 30 + buffer.readUInt16LE(start + 26) + buffer.readUInt16LE(start + 28);
  const data = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  return entry.method === 8 ? zlib.inflateRawSync(data) : data;
}

/** word/document.xml del archivo o buffer, como texto XML. */
export function docxDocumentXml(source: string | Buffer): string {
  const buffer = typeof source === 'string' ? fs.readFileSync(source) : source;
  const entry = readEntries(buffer).find((item) => item.name === 'word/document.xml');
  if (!entry) throw new Error('docx: falta word/document.xml');
  return readEntry(buffer, entry).toString('utf8');
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&amp;/g, '&');
}

/** Texto del documento, un renglon por parrafo: lo que lee un extractor ATS. */
export function docxText(source: string | Buffer): string {
  return docxDocumentXml(source)
    .split('</w:p>')
    .map((paragraph) =>
      decodeEntities(
        Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g), (match) => match[1]).join('')
      )
    )
    .join('\n');
}
