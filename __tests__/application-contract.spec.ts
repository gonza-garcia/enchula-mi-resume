import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applicationSchema, APPLICATION_STATES, LEGACY_APPLICATION_STATES } from '../src/schemas/application';
import { APPLICATION_FILE, listOffers, parseApplicationFile } from '../src/lib/job-offers';

process.env.OFFERS_SOURCE = 'demo';

const DEMO_SLUGS = [
  '2026-10-05-aurora-labs-reactjs-frontend-developer',
  '2026-10-05-nimbus-software-senior-frontend-engineer'
];

function readApplication(slug: string): string {
  return fs.readFileSync(path.resolve('docs', 'job-offers', slug, APPLICATION_FILE), 'utf8');
}

test.describe('Contrato de resultado application.md (Fase F)', () => {
  test('los application.md demo validan contra el schema', () => {
    for (const slug of DEMO_SLUGS) {
      const application = parseApplicationFile(readApplication(slug), slug);
      expect(application.empresa.length).toBeGreaterThan(0);
      expect(application.rol.length).toBeGreaterThan(0);
    }
  });

  test('la demo cubre estado confirmada y estado descartada con motivo', () => {
    expect(parseApplicationFile(readApplication(DEMO_SLUGS[0]), 'demo').estado).toBe('confirmada');
    const descartada = parseApplicationFile(readApplication(DEMO_SLUGS[1]), 'demo');
    expect(descartada.estado).toBe('descartada');
    expect((descartada.motivo ?? '').length).toBeGreaterThan(0);
  });

  test('el estado es obligatorio y solo admite valores del contrato', () => {
    const base = { empresa: 'X', rol: 'Y', fecha: '2026-10-26', estado: 'enviada', motivo: 'razon' };
    expect(applicationSchema.safeParse({ ...base, estado: 'fantasma' }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, estado: undefined }).success).toBe(false);
    for (const estado of APPLICATION_STATES) {
      expect(applicationSchema.safeParse({ ...base, estado }).success).toBe(true);
    }
  });

  test('los estados legacy de la migracion de la Fase H quedan rechazados', () => {
    for (const legacy of ['en preparacion', 'vetada']) {
      const parsed = applicationSchema.safeParse({ empresa: 'X', rol: 'Y', estado: legacy });
      expect(parsed.success).toBe(false);
      expect(LEGACY_APPLICATION_STATES[legacy as keyof typeof LEGACY_APPLICATION_STATES]).toBeTruthy();
    }
    expect(APPLICATION_STATES).toHaveLength(4);
    expect([...APPLICATION_STATES]).toEqual(['borrador', 'enviada', 'confirmada', 'descartada']);
  });

  test('descartada exige motivo; borrador, enviada y confirmada no', () => {
    expect(applicationSchema.safeParse({ empresa: 'X', rol: 'Y', estado: 'descartada' }).success).toBe(false);
    expect(
      applicationSchema.safeParse({
        empresa: 'X',
        rol: 'Y',
        estado: 'descartada',
        motivo: 'sin vacante frontend'
      }).success
    ).toBe(true);
    for (const estado of ['borrador', 'enviada', 'confirmada'] as const) {
      expect(applicationSchema.safeParse({ empresa: 'X', rol: 'Y', estado }).success).toBe(true);
    }
  });

  test('fecha_envio es alias legacy y "pendiente"/"N/A" se normalizan a null', () => {
    const alias = parseApplicationFile(
      '---\nempresa: X\nrol: Y\nfecha_envio: 2026-10-22\nestado: enviada\n---\n',
      'alias.md'
    );
    expect(alias.fecha).toBe('2026-10-22');
    const sinFecha = parseApplicationFile(
      '---\nempresa: X\nrol: Y\nfecha_envio: pendiente\nestado: borrador\n---\n',
      'pendiente.md'
    );
    expect(sinFecha.fecha).toBeNull();
  });

  test('un estado invalido falla nombrando el archivo', () => {
    expect(() =>
      parseApplicationFile(
        '---\nempresa: X\nrol: Y\nestado: enviada?\n---\n',
        'docs/job-offers/x/application.md'
      )
    ).toThrow(/application\.md invalido en docs\/job-offers\/x\/application\.md/);
  });

  test('listOffers expone hasApplication y la postulacion parseada', () => {
    const offers = listOffers();
    expect(offers.length).toBe(DEMO_SLUGS.length);
    for (const offer of offers) {
      expect(offer.hasApplication).toBe(true);
      expect(offer.application?.estado).toBeTruthy();
    }
    expect(offers.find((offer) => offer.slug === DEMO_SLUGS[0])?.application?.estado).toBe('confirmada');
  });

  test('una oferta sin application.md queda con application null', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-contract-'));
    const slug = '2026-01-01-oferta-demo-sin-postular';
    const dir = path.resolve(tmp, 'docs', 'job-offers', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'offer.md'),
      '---\nempresa: X\nrol: Y\nfecha: 2026-01-01\ndemo: true\n---\n# Oferta\n'
    );
    const offers = listOffers(tmp);
    expect(offers).toHaveLength(1);
    expect(offers[0].hasApplication).toBe(false);
    expect(offers[0].application).toBeNull();
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
