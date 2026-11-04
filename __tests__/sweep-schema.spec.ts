import { test, expect } from '@playwright/test';
import { SWEEP_VACANCY_STATES, sweepSchema } from '../src/schemas/sweep';
import { listSweeps, parseSweep } from '../src/lib/job-search';

process.env.OFFERS_SOURCE = 'local';

function demoSweep(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '2026-11-01-demo',
    fecha: '2026-11-01',
    fuentes: [{ sourceId: 'demo-job-board', resultados: 3, nuevas: 1 }],
    vacantes: [
      { idVacante: 'v-1', titulo: 'Frontend Dev', sourceId: 'demo-job-board', estado: 'nueva' }
    ],
    capturadas: [],
    particularidades: [],
    ...overrides
  };
}

test.describe('Contrato de barridos (Fase G)', () => {
  test('el barrido demo valida contra el schema', () => {
    const sweeps = listSweeps();
    expect(sweeps.length).toBeGreaterThanOrEqual(1);
    for (const sweep of sweeps) {
      expect(sweep.id.length).toBeGreaterThan(0);
      expect(sweep.fecha.length).toBeGreaterThan(0);
    }
    const demo = sweeps.find((sweep) => sweep.id === '2026-10-05-demo');
    expect(demo).toBeTruthy();
    expect(demo!.vacantes.length).toBeGreaterThanOrEqual(3);
    expect(demo!.capturadas).toContain('2026-10-05-aurora-labs-reactjs-frontend-developer');
    expect(demo!.particularidades.length).toBeGreaterThan(0);
  });

  test('los barridos se ordenan del mas reciente al mas viejo', () => {
    const sweeps = listSweeps();
    const fechas = sweeps.map((sweep) => sweep.fecha);
    expect([...fechas].sort().reverse()).toEqual(fechas);
  });

  test('los estados de vacante son solo los del contrato', () => {
    for (const estado of SWEEP_VACANCY_STATES) {
      const vacante =
        estado === 'descartada'
          ? { idVacante: 'v', titulo: 'T', sourceId: 's', estado, motivo: 'razon' }
          : { idVacante: 'v', titulo: 'T', sourceId: 's', estado };
      expect(sweepSchema.safeParse(demoSweep({ vacantes: [vacante] })).success).toBe(true);
    }
    expect(
      sweepSchema.safeParse(demoSweep({ vacantes: [{ idVacante: 'v', titulo: 'T', sourceId: 's', estado: 'fantasma' }] }))
        .success
    ).toBe(false);
  });

  test('una vacante descartada exige motivo', () => {
    const vacante = { idVacante: 'v', titulo: 'T', sourceId: 's', estado: 'descartada' };
    expect(sweepSchema.safeParse(demoSweep({ vacantes: [vacante] })).success).toBe(false);
    expect(
      sweepSchema.safeParse(demoSweep({ vacantes: [{ ...vacante, motivo: 'sin frontend' }] })).success
    ).toBe(true);
  });

  test('enRadarDesde registra la antiguedad de la vacante en el radar', () => {
    const vacante = { idVacante: 'v', titulo: 'T', sourceId: 's', estado: 'nueva', enRadarDesde: '2026-10-24-barrido' };
    const parsed = sweepSchema.safeParse(demoSweep({ vacantes: [vacante] }));
    expect(parsed.success).toBe(true);
    const demo = listSweeps().find((sweep) => sweep.id === '2026-10-05-demo');
    expect(demo).toBeTruthy();
  });

  test('un barrido invalido falla nombrando el archivo', () => {
    expect(() => parseSweep('{"id": "x"}', 'sweeps/roto.json')).toThrow(/sweeps\/roto\.json/);
    expect(() => parseSweep('{', 'sweeps/roto.json')).toThrow(/JSON mal formado/);
  });

  test('en build demo solo entran los barridos marcados con demo', () => {
    process.env.OFFERS_SOURCE = 'demo';
    const demo = listSweeps();
    expect(demo.length).toBeGreaterThanOrEqual(1);
    for (const sweep of demo) expect(sweep.demo).toBe(true);
    process.env.OFFERS_SOURCE = 'local';
  });
});
