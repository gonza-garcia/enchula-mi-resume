import { AlignmentType, Document, HeadingLevel, Paragraph, TextRun } from 'docx';
import type { ResumeLocale } from '../schemas/resume';
import { clientBlock } from '../lib/resume-sections';

/**
 * Builder del DOCX del CV (funcion pura, sin UI).
 * Recibe la proyeccion del perfil o el CV adaptado (misma forma que resumeSchema)
 * y arma un documento simple, sin estilos de marca.
 *
 * La app no exporta nada entre la H1 y la H3 (Fase H): el export con UI se retiro
 * entero y esta funcion se conserva para no perder el contrato ATS v4 del DOCX,
 * protegido por unit test contra el Packer (__tests__/ats-format.spec.ts). La capa
 * de descarga vuelve con el dialogo "Descargar" de la H3.
 */

function text(value: string): Paragraph {
  return new Paragraph({ children: [new TextRun(value)] });
}

function heading(value: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun(value)]
  });
}

function labelLine(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)]
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ children: [] });
}

/**
 * CV completo (proyeccion del perfil o CV adaptado) a documento DOCX.
 * Los marcadores de bullet son caracteres literales en el texto (ADR-0039 v4):
 * el numbering nativo de Word no vive en la capa de texto y los extractores
 * ATS que leen el XML lo pierden, igual que los markers de lista CSS en el PDF.
 */
export function buildResumeDocx(resume: ResumeLocale, locale: 'en' | 'es' = 'en'): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.name, bold: true, size: 32 })]
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.title, italics: true })]
    })
  );
  const contactParts = [
    resume.contact.phone,
    resume.contact.email,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github
  ].filter(Boolean);
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: contactParts.join('  |  '), size: 18 })]
    })
  );

  children.push(heading('Summary'));
  for (const para of resume.summary.split(/\n{2,}/)) {
    if (para.trim()) children.push(text(para.trim()));
  }

  children.push(heading('Skills'));
  for (const line of resume.skills) {
    children.push(labelLine(line.category, line.items));
  }

  children.push(heading('Experience'));
  for (const job of resume.experience) {
    children.push(new Paragraph({ children: [new TextRun({ text: job.role, bold: true })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: job.company, bold: true })] }));
    children.push(text(`${job.startDate} - ${job.endDate}`));
    for (const project of job.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `\u2022 ${clientBlock(project.name, project.startDate, project.endDate, locale)}`,
              bold: true
            })
          ]
        })
      );
      if (project.url) children.push(text(`- ${project.url}`));
      for (const bullet of project.bullets) {
        children.push(text(`- ${bullet}`));
      }
      children.push(emptyLine());
    }
  }

  children.push(heading('Education'));
  for (const item of resume.education) {
    children.push(labelLine(item.institution, `${item.degree} (${item.startDate} - ${item.endDate})`));
    if (item.note) children.push(text(item.note));
  }

  if (resume.certifications.length) {
    children.push(heading('Certifications'));
    for (const item of resume.certifications) {
      children.push(labelLine(item.name, item.note ?? ''));
    }
  }

  if (resume.projects.length) {
    children.push(heading('Personal Projects'));
    for (const item of resume.projects) {
      const tail = [item.date, item.url].filter(Boolean).join(' - ');
      children.push(labelLine(item.name, tail));
      children.push(text(item.description));
    }
  }

  return new Document({
    creator: resume.name,
    title: `${resume.name} - ${resume.title}`,
    sections: [{ children }]
  });
}
