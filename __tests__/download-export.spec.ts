import { test, expect } from '@playwright/test';
import { fileAsName, exportFileName } from '../src/lib/file-name';
import {
  DOWNLOAD_DOCS,
  downloadFileName,
  downloadJson,
  downloadPrintTitle,
  downloadText
} from '../src/scripts/download-export';

/**
 * Capa de export del dialogo "Descargar" (Fase H), sin UI: nombres de archivo
 * (ADR-0036), payloads por documento/formato y el titulo de impresion que
 * sugiere el nombre del PDF. La UI del dialogo llega en los cambios siguientes
 * de la tanda; estas specs cubren el "que se escribe y con que nombre".
 */

const ctxEn = { name: 'Ariana Montiel', locale: 'en' as const };
const ctxEs = { name: 'Ariana Montiel', locale: 'es' as const };

test.describe('Nombres neutros (ADR-0036) — file-name', () => {
  test('el nombre va apellidos primero y sin acentos', () => {
    expect(fileAsName('Ariana Montiel')).toBe('Montiel Ariana');
    expect(fileAsName('José Pérez López')).toBe('Perez Lopez Jose');
    expect(fileAsName('Ana')).toBe('Ana');
  });

  test('sin caracteres invalidos para nombre de archivo y sin espacios dobles', () => {
    expect(fileAsName('A/B:C*D?E"F<G>H|I')).toBe('ABCDEFGHI');
    expect(fileAsName('  Ariana   Montiel  ')).toBe('Montiel Ariana');
  });

  test('exportFileName arma "<apellidos> <nombres> - <documento> - <LOCALE>.<ext>"', () => {
    expect(exportFileName('Ariana Montiel', 'CV', 'en', 'pdf')).toBe('Montiel Ariana - CV - EN.pdf');
    expect(exportFileName('Ariana Montiel', 'Cover Letter', 'es', 'docx')).toBe(
      'Montiel Ariana - Cover Letter - ES.docx'
    );
  });
});

test.describe('downloadFileName', () => {
  test('CV y cover salen con nombre neutro, en los tres idiomas de extesion', () => {
    expect(downloadFileName('cv', 'pdf', ctxEn)).toBe('Montiel Ariana - CV - EN.pdf');
    expect(downloadFileName('cv', 'docx', ctxEn)).toBe('Montiel Ariana - CV - EN.docx');
    expect(downloadFileName('cv', 'json', ctxEn)).toBe('Montiel Ariana - CV - EN.json');
    expect(downloadFileName('cover', 'pdf', ctxEs)).toBe('Montiel Ariana - Cover Letter - ES.pdf');
    expect(downloadFileName('cover', 'md', ctxEs)).toBe('Montiel Ariana - Cover Letter - ES.md');
  });

  test('oferta, match report y postulacion salen con el nombre literal del archivo', () => {
    expect(downloadFileName('oferta', 'pdf')).toBe('offer.pdf');
    expect(downloadFileName('oferta', 'txt')).toBe('offer.txt');
    expect(downloadFileName('report', 'md')).toBe('match-report.md');
    expect(downloadFileName('postulacion', 'md')).toBe('application.md');
    expect(downloadFileName('postulacion', 'txt')).toBe('application.txt');
  });

  test('los documentos con nombre neutro exigen nombre del perfil e idioma', () => {
    expect(() => downloadFileName('cv', 'pdf')).toThrow();
    expect(() => downloadFileName('cover', 'pdf')).toThrow();
  });
});

test.describe('downloadPrintTitle', () => {
  test('el titulo del CV y la cover es el nombre neutro, sin extension', () => {
    expect(downloadPrintTitle('cv', ctxEn)).toBe('Montiel Ariana - CV - EN');
    expect(downloadPrintTitle('cover', ctxEs)).toBe('Montiel Ariana - Cover Letter - ES');
  });

  test('el titulo de la oferta es el nombre literal del archivo', () => {
    expect(downloadPrintTitle('oferta')).toBe('offer');
    expect(downloadPrintTitle('postulacion')).toBe('application');
  });
});

test.describe('downloadText', () => {
  const RAW = '---\ntitulo: Oferta\nempresa: Nimbus\n---\n# Oferta\n\nCuerpo con acentos: función, médula.\n';

  test('md es el archivo verbatim, con su frontmatter', () => {
    expect(downloadText('md', RAW)).toBe(RAW);
  });

  test('txt es el cuerpo sin frontmatter, verbatim (sin resumir ni parafrasear)', () => {
    expect(downloadText('txt', RAW)).toBe('# Oferta\n\nCuerpo con acentos: función, médula.\n');
    expect(downloadText('txt', 'Sin frontmatter, solo cuerpo.\n')).toBe('Sin frontmatter, solo cuerpo.\n');
  });
});

test.describe('downloadJson', () => {
  test('pretty-print con dos espacios y salto final', () => {
    expect(downloadJson({ a: 1, b: { c: 'ñ' } })).toBe('{\n  "a": 1,\n  "b": {\n    "c": "ñ"\n  }\n}\n');
  });
});

test.describe('DOWNLOAD_DOCS', () => {
  test('el set del dialogo es el del diseno, en el orden del visor', () => {
    expect(DOWNLOAD_DOCS.map((def) => [def.doc, def.formats])).toEqual([
      ['oferta', ['pdf', 'txt']],
      ['report', ['md']],
      ['cv', ['pdf', 'docx', 'json']],
      ['cover', ['pdf', 'md']],
      ['postulacion', ['md', 'txt']]
    ]);
  });

  test('solo lo que viaja a un portal o un email lleva nombre neutro', () => {
    const neutros = DOWNLOAD_DOCS.filter((def) => def.neutralDoc).map((def) => def.doc);
    expect(neutros).toEqual(['cv', 'cover']);
  });
});
