// Pre-render del markdown de respuestas del banco de /interview (ADR-0046).
// Corre en el build (frontmatter de `src/pages/interview.astro`): `marked` para
// prosa (párrafos, `###`, tablas, listas, links, negritas) y Shiki para los
// fences, envueltos en el shell de código (header de lenguaje + «N líneas»,
// gutter numerado como hermano del HTML de Shiki, `role="group"` + aria-label y
// `tabindex=0` en el pre para scroll con teclado). La isla recibe HTML y solo
// elige idioma: este módulo no viaja al bundle del cliente.
import { marked } from 'marked';
import { codeToHtml } from 'shiki';
import type { RenderedCodeShell } from './interview-prep';

// Convención de caption en el info string del fence:
// ```js caption="Output: A, D, B, C"
const FENCE_PATTERN = /```([^\n`]*)\r?\n([\s\S]*?)\r?\n```/g;
const CAPTION_PATTERN = /(?:^|\s)caption="([^"]*)"/;

const SHIKI_LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  text: 'text'
};

interface ParsedFence {
  language: string;
  caption: string;
  code: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function parseFenceInfo(info: string): { language: string; caption: string } {
  const caption = info.match(CAPTION_PATTERN)?.[1] ?? '';
  const language = info.replace(CAPTION_PATTERN, '').trim().split(/\s+/)[0] ?? '';
  return { language: language || 'text', caption };
}

const highlightedHtmlCache = new Map<string, string>();

async function highlight(code: string, language: string): Promise<string> {
  const key = `${language}\u0000${code}`;
  const cached = highlightedHtmlCache.get(key);
  if (cached) return cached;

  try {
    const html = await codeToHtml(code, {
      lang: SHIKI_LANGUAGE_ALIASES[language] ?? language,
      theme: 'github-dark'
    });
    highlightedHtmlCache.set(key, html);
    return html;
  } catch {
    const fallback = `<pre tabindex="0"><code>${escapeHtml(code)}</code></pre>`;
    highlightedHtmlCache.set(key, fallback);
    return fallback;
  }
}

// Shell de código (mismo para cualquier bloque: fences del markdown y código de
// escenarios). El gutter es un <pre> hermano del HTML de Shiki: no se parte el
// HTML de Shiki por línea porque los tokens de Shiki cruzan líneas.
export async function renderCodeShell(
  language: string,
  caption: string,
  code: string
): Promise<RenderedCodeShell> {
  const normalized = code.replace(/\n+$/, '');
  const lineCount = normalized.split('\n').length;
  const linesLabel = lineCount === 1 ? '1 línea' : `${lineCount} líneas`;
  const highlighted = await highlight(normalized, language);
  const focusable = highlighted.replace(/^<pre/, '<pre tabindex="0"');
  const gutter = Array.from({ length: lineCount }, (_, index) => String(index + 1)).join('\n');

  const html = [
    '<figure class="interview-code">',
    `<div class="code-label"><span>${escapeHtml(language)}</span><span>${escapeHtml(linesLabel)}</span></div>`,
    `<div class="code-shell" role="group" aria-label="Bloque de código en ${escapeHtml(language)}, ${escapeHtml(linesLabel)}">`,
    `<pre class="code-gutter" aria-hidden="true">${gutter}</pre>`,
    `<div class="code-output">${focusable}</div>`,
    '</div>',
    caption ? `<figcaption class="code-caption">${escapeHtml(caption)}</figcaption>` : '',
    '</figure>'
  ].join('');

  return { language, caption, lines: lineCount, html };
}

// Markdown de respuesta → HTML con los shells de código embebidos. Los fences se
// reemplazan por placeholders antes de `marked` y se restauran como HTML.
export async function renderAnswerMarkdown(markdown: string): Promise<string> {
  const fences: ParsedFence[] = [];
  const prose = markdown.replace(FENCE_PATTERN, (_match, info, code) => {
    const { language, caption } = parseFenceInfo(String(info));
    fences.push({ language, caption, code: String(code) });
    return `\n\n@@INTERVIEWCODE${fences.length - 1}@@\n\n`;
  });

  const shells = await Promise.all(
    fences.map((fence) => renderCodeShell(fence.language, fence.caption, fence.code))
  );

  let html = await marked.parse(prose);
  html = html.replace(/<p>\s*@@INTERVIEWCODE(\d+)@@\s*<\/p>/g, (_match, index) => shells[Number(index)].html);
  html = html.replace(/@@INTERVIEWCODE(\d+)@@/g, (_match, index) => shells[Number(index)].html);
  return html;
}

// Markdown inline (títulos de pregunta, repreguntas de curiosidades).
export async function renderInlineMarkdown(markdown: string): Promise<string> {
  return await marked.parseInline(markdown.trim());
}
