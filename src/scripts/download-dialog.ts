import { Packer } from 'docx';
import { buildResumeDocx } from './docx-export';
import {
  DOWNLOAD_DOCS,
  downloadFileName,
  downloadJson,
  downloadPrintTitle,
  downloadText,
  type DownloadCtx,
  type DownloadFormat,
  type DownloadItem,
  type DownloadPayload
} from './download-export';

/**
 * Dialogo reutilizable "Descargar" (Fase H): una sola implementacion para
 * "Mis perfiles" y /ofertas. Se abre con el evento `download:open` y su payload
 * dice que documentos ofrece y con que datos; los nombres y payloads los decide
 * la capa pura de `download-export.ts`.
 *
 * PDF = impresion del navegador (ADR-0007, ADR-0032): se pone el titulo neutro
 * en document.title para que "Guardar como PDF" lo sugiera (ADR-0036) y se
 * marca body[data-print-doc] para que el @media print emita solo ese documento.
 */

const overlay = document.querySelector<HTMLElement>('[data-download-dialog]');
const docsEl = document.querySelector<HTMLElement>('[data-download-docs]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-download-close]');

let payload: DownloadPayload | null = null;
let lastFocus: HTMLElement | null = null;

function ctxOf(item: DownloadItem): DownloadCtx | null {
  if (!payload) return null;
  return { name: payload.name, locale: item.locale ?? payload.locale };
}

function orderOf(item: DownloadItem): number {
  return DOWNLOAD_DOCS.findIndex((def) => def.doc === item.doc);
}

function render(): void {
  if (!payload || !docsEl) return;
  const items = [...payload.docs].sort((a, b) => orderOf(a) - orderOf(b));
  docsEl.innerHTML = items
    .map((item) => {
      const def = DOWNLOAD_DOCS[orderOf(item)];
      if (!def) return '';
      const ctx = ctxOf(item);
      const buttons = def.formats
        .map((format) => {
          const filename = ctx ? downloadFileName(def.doc, format, ctx) : '';
          const disabled = item.enabled ? '' : ' disabled';
          return `<button type="button" class="download-format" data-doc="${def.doc}" data-format="${format}" title="${filename}"${disabled}>${format.toUpperCase()}</button>`;
        })
        .join('');
      const hint = !item.enabled && item.hint ? `<p class="download-hint">${item.hint}</p>` : '';
      const active = payload?.activeDoc === item.doc ? ' is-active' : '';
      return `<section class="download-doc${active}"><h4 class="download-doc-label">${def.label}</h4><div class="download-formats">${buttons}</div>${hint}</section>`;
    })
    .join('');
}

function open(next: DownloadPayload): void {
  if (!overlay) return;
  payload = next;
  render();
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay.hidden = false;
  closeBtn?.focus();
}

function close(): void {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  lastFocus?.focus();
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function printDoc(item: DownloadItem): void {
  const ctx = ctxOf(item);
  if (!ctx) return;
  const previousTitle = document.title;
  document.title = downloadPrintTitle(item.doc, ctx);
  document.body.dataset.printDoc = item.doc;
  window.addEventListener(
    'afterprint',
    () => {
      document.title = previousTitle;
      delete document.body.dataset.printDoc;
    },
    { once: true }
  );
  window.print();
}

async function exportDocx(item: DownloadItem): Promise<void> {
  const ctx = ctxOf(item);
  if (!ctx || !item.cv) return;
  const blob = await Packer.toBlob(buildResumeDocx(item.cv, ctx.locale));
  saveBlob(blob, downloadFileName(item.doc, 'docx', ctx));
}

function onFormat(item: DownloadItem, format: DownloadFormat): void {
  const ctx = ctxOf(item);
  if (!ctx) return;
  if (format === 'pdf') return printDoc(item);
  if (format === 'docx') {
    void exportDocx(item);
    return;
  }
  if (format === 'json') {
    if (!item.cv) return;
    saveBlob(
      new Blob([downloadJson(item.cv)], { type: 'application/json;charset=utf-8' }),
      downloadFileName(item.doc, format, ctx)
    );
    return;
  }
  if (!item.raw) return;
  const mime = format === 'md' ? 'text/markdown' : 'text/plain';
  saveBlob(
    new Blob([downloadText(format, item.raw)], { type: `${mime};charset=utf-8` }),
    downloadFileName(item.doc, format, ctx)
  );
}

window.addEventListener('download:open', (event) => {
  open((event as CustomEvent<DownloadPayload>).detail);
});

closeBtn?.addEventListener('click', close);

overlay?.addEventListener('click', (event) => {
  if (event.target === overlay) close();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') close();
});

docsEl?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.download-format');
  if (!button || button.disabled) return;
  const item = payload?.docs.find((entry) => entry.doc === button.dataset.doc);
  if (!item || !button.dataset.format) return;
  onFormat(item, button.dataset.format as DownloadFormat);
});
