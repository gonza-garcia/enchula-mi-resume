import { z } from 'astro/zod';

export const localeSchema = z.enum(['es', 'en']);
export type Locale = z.infer<typeof localeSchema>;

export const localizedTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1)
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

const idSchema = z.string().min(1);

const contactSchema = z.object({
  phone: z.string().min(1),
  email: z.email(),
  location: localizedTextSchema,
  linkedin: z.string().min(1),
  github: z.string().min(1)
});

const bulletSchema = z.object({
  id: idSchema,
  text: localizedTextSchema,
  /**
   * Version larga o anterior del bullet, conservada como respaldo en el perfil.
   * El CV renderiza `text`; `textExtended` queda "en el banco" para no perder
   * experiencia cuando se acorta el texto de una posicion.
   */
  textExtended: localizedTextSchema.optional(),
  skillIds: z.array(idSchema).optional()
});

const workProjectSchema = z.object({
  name: localizedTextSchema,
  url: z.string().optional(),
  startDate: localizedTextSchema,
  endDate: localizedTextSchema,
  bullets: z.array(bulletSchema).min(1)
});

const experienceSchema = z.object({
  company: localizedTextSchema,
  role: localizedTextSchema,
  startDate: localizedTextSchema,
  endDate: localizedTextSchema,
  location: localizedTextSchema.optional(),
  projects: z.array(workProjectSchema).min(1)
});

const educationSchema = z.object({
  institution: localizedTextSchema,
  degree: localizedTextSchema,
  startDate: localizedTextSchema,
  endDate: localizedTextSchema,
  note: localizedTextSchema.optional()
});

const certificationSchema = z.object({
  name: localizedTextSchema,
  note: localizedTextSchema.optional()
});

const languageSchema = z.object({
  name: localizedTextSchema,
  level: localizedTextSchema,
  evidence: localizedTextSchema.optional()
});

const personalProjectSchema = z.object({
  name: localizedTextSchema,
  url: z.string().optional(),
  date: localizedTextSchema.optional(),
  description: localizedTextSchema,
  skillIds: z.array(idSchema).optional()
});

const skillSchema = z.object({
  id: idSchema,
  name: localizedTextSchema,
  category: localizedTextSchema,
  level: localizedTextSchema,
  evidence: localizedTextSchema.optional()
});

const positioningSchema = z.object({
  id: idSchema,
  title: localizedTextSchema,
  summary: localizedTextSchema,
  /**
   * Version larga o anterior del summary, conservada como respaldo en el perfil.
   * El CV renderiza `summary`; `summaryExtended` guarda el texto completo que no
   * entra en el scan de 6-10 segundos, sin perderlo.
   */
  summaryExtended: localizedTextSchema.optional(),
  skillIds: z.array(idSchema).min(1),
  bulletIds: z.array(idSchema).min(1)
});

// Banco de experiencias en reserva (ADR-0031). Cada item es un fragmento listo para
// CV con su contrato de defensabilidad. Nunca se imprime en el CV mientras este en
// reserve: lo consume adapt-resume-to-offer al proponer ajustes, y quien lo promueve
// lo materializa en facts (o en skills[]) y lo selecciona con un posicionamiento.
export const backlogKindSchema = z.enum(['experience', 'skill', 'project']);
export type BacklogKind = z.infer<typeof backlogKindSchema>;

export const backlogStatusSchema = z.enum(['reserve', 'promoted']);
export type BacklogStatus = z.infer<typeof backlogStatusSchema>;

const backlogItemSchema = z.object({
  id: idSchema,
  kind: backlogKindSchema,
  origin: localizedTextSchema,
  text: localizedTextSchema,
  proof: localizedTextSchema.optional(),
  limits: localizedTextSchema.optional(),
  skillIds: z.array(idSchema).optional(),
  status: backlogStatusSchema.default('reserve')
});

export const profileSchema = z
  .object({
    identity: z.object({
      name: localizedTextSchema,
      contact: contactSchema
    }),
    facts: z.object({
      experience: z.array(experienceSchema),
      education: z.array(educationSchema),
      certifications: z.array(certificationSchema),
      languages: z.array(languageSchema),
      projects: z.array(personalProjectSchema)
    }),
    skills: z.array(skillSchema).min(1),
    positionings: z.array(positioningSchema).min(1),
    backlog: z.array(backlogItemSchema).default([])
  })
  .superRefine((profile, ctx) => {
    const skillIds = new Set<string>();
    profile.skills.forEach((skill, index) => {
      if (skillIds.has(skill.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills', index, 'id'],
          message: `Duplicate skill id "${skill.id}"`
        });
      }
      skillIds.add(skill.id);
    });

    const bulletIds = new Set<string>();
    profile.facts.experience.forEach((job, jobIndex) => {
      job.projects.forEach((project, projectIndex) => {
        project.bullets.forEach((bullet, bulletIndex) => {
          if (bulletIds.has(bullet.id)) {
            ctx.addIssue({
              code: 'custom',
              path: ['facts', 'experience', jobIndex, 'projects', projectIndex, 'bullets', bulletIndex, 'id'],
              message: `Duplicate bullet id "${bullet.id}"`
            });
          }
          bulletIds.add(bullet.id);
          bullet.skillIds?.forEach((skillId, skillIndex) => {
            if (!skillIds.has(skillId)) {
              ctx.addIssue({
                code: 'custom',
                path: [
                  'facts',
                  'experience',
                  jobIndex,
                  'projects',
                  projectIndex,
                  'bullets',
                  bulletIndex,
                  'skillIds',
                  skillIndex
                ],
                message: `Unknown skill id "${skillId}" in experience bullet "${bullet.id}"`
              });
            }
          });
        });
      });
    });

    profile.facts.projects.forEach((project, projectIndex) => {
      project.skillIds?.forEach((skillId, skillIndex) => {
        if (!skillIds.has(skillId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['facts', 'projects', projectIndex, 'skillIds', skillIndex],
            message: `Unknown skill id "${skillId}" in project "${project.name.en}"`
          });
        }
      });
    });

    const positioningIds = new Set<string>();
    profile.positionings.forEach((positioning, index) => {
      if (positioningIds.has(positioning.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['positionings', index, 'id'],
          message: `Duplicate positioning id "${positioning.id}"`
        });
      }
      positioningIds.add(positioning.id);

      positioning.skillIds.forEach((skillId, skillIndex) => {
        if (!skillIds.has(skillId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['positionings', index, 'skillIds', skillIndex],
            message: `Unknown skill id "${skillId}" in positioning "${positioning.id}"`
          });
        }
      });
      positioning.bulletIds.forEach((bulletId, bulletIndex) => {
        if (!bulletIds.has(bulletId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['positionings', index, 'bulletIds', bulletIndex],
            message: `Unknown bullet id "${bulletId}" in positioning "${positioning.id}"`
          });
        }
      });
    });

    // El backlog se valida contra los skills, pero no contra los bullets: un item
    // promovido se materializa en facts reusando su id, asi que la colision con un
    // bullet id es esperada y no es un error.
    const backlogIds = new Set<string>();
    profile.backlog.forEach((item, index) => {
      if (backlogIds.has(item.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['backlog', index, 'id'],
          message: `Duplicate backlog id "${item.id}"`
        });
      }
      backlogIds.add(item.id);

      item.skillIds?.forEach((skillId, skillIndex) => {
        if (!skillIds.has(skillId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['backlog', index, 'skillIds', skillIndex],
            message: `Unknown skill id "${skillId}" in backlog item "${item.id}"`
          });
        }
      });
    });
  });

export type Profile = z.infer<typeof profileSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Bullet = z.infer<typeof bulletSchema>;
export type WorkProject = z.infer<typeof workProjectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type PersonalProject = z.infer<typeof personalProjectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Positioning = z.infer<typeof positioningSchema>;
export type BacklogItem = z.infer<typeof backlogItemSchema>;
