import { test, expect } from '@playwright/test';
import { sourceSchema } from '../src/schemas/search-source';
import { listSources, parseSearchSource } from '../src/lib/job-search';

process.env.OFFERS_SOURCE = 'local';

test.describe('Contrato de fuentes de busqueda (Fase G)', () => {
  test('las fuentes demo validan contra el schema', () => {
    const sources = listSources();
    expect(sources.length).toBeGreaterThanOrEqual(2);
    for (const source of sources) {
      expect(source.id.length).toBeGreaterThan(0);
      expect(source.nombre.length).toBeGreaterThan(0);
      expect(source.tipo.length).toBeGreaterThan(0);
      expect(source.playbook.buscar.length).toBeGreaterThan(0);
    }
  });

  test('el tipo es string libre: fuentes nuevas no chocan con el contrato', () => {
    const base = {
      id: 'x',
      nombre: 'X',
      tipo: 'whatever-nuevo',
      playbook: { buscar: 'b', herramientas: ['h'], quirks: ['q'] }
    };
    expect(sourceSchema.safeParse(base).success).toBe(true);
    expect(sourceSchema.safeParse({ ...base, tipo: '' }).success).toBe(false);
    expect(sourceSchema.safeParse({ ...base, tipo: undefined }).success).toBe(false);
  });

  test('el playbook exige como buscar y permite listas vacias de herramientas/quirks', () => {
    const base = { id: 'x', nombre: 'X', tipo: 'job-board' };
    expect(sourceSchema.safeParse({ ...base, playbook: { buscar: 'b', herramientas: [], quirks: [] } }).success).toBe(true);
    expect(sourceSchema.safeParse({ ...base, playbook: { buscar: '', herramientas: [], quirks: [] } }).success).toBe(false);
    expect(sourceSchema.safeParse({ ...base }).success).toBe(false);
  });

  test('una fuente invalida falla nombrando el archivo', () => {
    expect(() => parseSearchSource('{"id": "x"}', 'sources/rota.json')).toThrow(/sources\/rota\.json/);
    expect(() => parseSearchSource('no es json', 'sources/rota.json')).toThrow(/JSON mal formado/);
  });

  test('en build demo solo entran las fuentes marcadas con demo', () => {
    process.env.OFFERS_SOURCE = 'demo';
    const demo = listSources();
    expect(demo.length).toBeGreaterThanOrEqual(2);
    for (const source of demo) expect(source.demo).toBe(true);
    process.env.OFFERS_SOURCE = 'local';
  });
});
