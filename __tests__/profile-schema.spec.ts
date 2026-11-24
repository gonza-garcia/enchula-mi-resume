import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { profileSchema } from '../src/schemas/profile';

const exampleFile = path.resolve('src', 'content', 'profile.example.json');
const exampleProfile = JSON.parse(fs.readFileSync(exampleFile, 'utf8'));

function clone() {
  return JSON.parse(JSON.stringify(exampleProfile));
}

function issuesOf(result: ReturnType<typeof profileSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

test.describe('Profile schema', () => {
  test('the demo profile validates and carries the two v1 positionings', () => {
    const result = profileSchema.safeParse(exampleProfile);
    expect(issuesOf(result)).toEqual([]);
    if (!result.success) return;
    expect(result.data.identity.name.en).toBe('Ariana Montiel');
    expect(result.data.positionings.map((positioning) => positioning.id)).toEqual(['frontend', 'ai']);
    expect(result.data.skills.length).toBeGreaterThan(0);
  });

  test('facts carry optional skillIds on experience bullets and projects', () => {
    const result = profileSchema.safeParse(exampleProfile);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const bulletIds = result.data.facts.experience.flatMap((job) =>
      job.projects.flatMap((project) => project.bullets.map((bullet) => bullet.skillIds ?? []))
    );
    expect(bulletIds.some((skillIds) => skillIds.length > 0)).toBe(true);
    expect(result.data.facts.projects.some((project) => (project.skillIds ?? []).length > 0)).toBe(true);
  });

  test('a text field without both locales fails validation', () => {
    const broken = clone();
    broken.identity.name = { es: 'Ariana Montiel' };
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('identity.name');
  });

  test('a positioning pointing at an unknown skill id fails validation', () => {
    const broken = clone();
    broken.positionings[0].skillIds.push('not-a-skill');
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Unknown skill id "not-a-skill"');
  });

  test('a positioning pointing at an unknown bullet id fails validation', () => {
    const broken = clone();
    broken.positionings[1].bulletIds.push('not-a-bullet');
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Unknown bullet id "not-a-bullet"');
  });

  test('a duplicate skill id fails validation', () => {
    const broken = clone();
    broken.skills.push({ ...broken.skills[0] });
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Duplicate skill id');
  });

  test('a fact referencing an unknown skill id fails validation', () => {
    const broken = clone();
    broken.facts.experience[0].projects[0].bullets[0].skillIds = ['ghost-skill'];
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Unknown skill id "ghost-skill"');
  });

  test('malformed shape fails loudly instead of passing silently', () => {
    const broken = clone();
    broken.facts.experience = { nope: true };
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).length).toBeGreaterThan(0);
  });

  test('the demo profile carries a backlog covering experience, skill and project', () => {
    const result = profileSchema.safeParse(exampleProfile);
    expect(issuesOf(result)).toEqual([]);
    if (!result.success) return;
    expect(result.data.backlog.length).toBeGreaterThan(0);
    expect(new Set(result.data.backlog.map((item) => item.kind))).toEqual(
      new Set(['experience', 'skill', 'project'])
    );
    for (const item of result.data.backlog) {
      expect(item.status).toBe('reserve');
      expect(item.text.es.length).toBeGreaterThan(0);
      expect(item.text.en.length).toBeGreaterThan(0);
    }
  });

  test('a profile without a backlog still validates and defaults to an empty bank', () => {
    const broken = clone();
    delete broken.backlog;
    const result = profileSchema.safeParse(broken);
    expect(issuesOf(result)).toEqual([]);
    if (!result.success) return;
    expect(result.data.backlog).toEqual([]);
  });

  test('a backlog item referencing an unknown skill id fails validation', () => {
    const broken = clone();
    broken.backlog[0].skillIds = ['ghost-skill'];
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Unknown skill id "ghost-skill"');
  });

  test('a duplicate backlog id fails validation', () => {
    const broken = clone();
    broken.backlog.push({ ...broken.backlog[0] });
    const result = profileSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Duplicate backlog id');
  });

  test('summaryExtended and textExtended are accepted as backup fields', () => {
    const withBackups = clone();
    withBackups.positionings[0].summaryExtended = { en: 'Long summary', es: 'Summary largo' };
    withBackups.facts.experience[0].projects[0].bullets[0].textExtended = {
      en: 'Long bullet',
      es: 'Bullet largo'
    };
    const result = profileSchema.safeParse(withBackups);
    expect(issuesOf(result)).toEqual([]);
  });
});
