import type { Resume } from '../../schemas/resume';
import { SECTION_TITLES, clientBlock } from '../../lib/resume-sections';

/**
 * Vista "CV adaptado" del visor de "Ofertas": el adapted-resume.json de la
 * carpeta, renderizado con el MISMO markup ATS v4 que el CV base
 * (Resume.astro): empleo en tres lineas, subproyectos con bullets literales
 * (`•`, `-`), linea de cliente rotulada con anos compactos, sin rangos de
 * fecha sueltos y contacto en texto plano. La tipografia se acota al panel del
 * visor con la reglas `.of-cv` de ofertas.astro ("un poco mas fina", sin
 * perder ningun atributo ATS). Lo que se ve aca es lo que la H3 va a exportar.
 */
export default function AdaptedCvView({ data }: { data: Resume }) {
  const locale = data.en ? 'en' : 'es';
  const cv = data.en ?? data.es;
  const sectionTitles = SECTION_TITLES[locale];
  const contactParts = [
    cv.contact.phone,
    cv.contact.email,
    cv.contact.location,
    cv.contact.linkedin,
    cv.contact.github
  ].filter(Boolean);

  return (
    <div className="of-cv">
      <header>
        <h1>{cv.name}</h1>
        <p className="titleline">{cv.title}</p>
        <p className="contactline">
          {contactParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="sep"> • </span>}
              {part}
            </span>
          ))}
        </p>
      </header>

      <section className="summary" aria-label={sectionTitles.summary}>
        <h2>{sectionTitles.summary}</h2>
        {cv.summary.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      <section className="skills" aria-label={sectionTitles.skills}>
        <h2>{sectionTitles.skills}</h2>
        {cv.skills.map((skill, i) => (
          <div key={i} className="skill-line">
            <span className="skill-cat">{skill.category}</span>
            <span className="skill-items">{skill.items}</span>
          </div>
        ))}
      </section>

      <section aria-label={sectionTitles.experience}>
        <h2>{sectionTitles.experience}</h2>
        {cv.experience.map((job, i) => (
          <div key={i} className="job">
            <div className="job-head">
              <div className="job-role">{job.role}</div>
              <div className="job-company">{job.company}</div>
              <div className="job-dates">{job.startDate} - {job.endDate}</div>
            </div>
            {job.projects.map((project, j) => (
              <div key={j} className="subproject">
                <ul className="bullets">
                  <li className="proj-line">
                    <span aria-hidden="true">{'\u2022 '}</span>
                    {clientBlock(project.name, project.startDate, project.endDate, locale)}
                  </li>
                  {project.url && (
                    <li className="proj-url">
                      <span aria-hidden="true">{'- '}</span>
                      {project.url}
                    </li>
                  )}
                  {project.bullets.map((bullet, k) => (
                    <li key={k} className="bullet-item">
                      <span aria-hidden="true">{'- '}</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section aria-label={sectionTitles.education}>
        <h2>{sectionTitles.education}</h2>
        {cv.education.map((edu, i) => (
          <div key={i} className="edu-entry">
            <div className="edu-head">
              <span className="edu-name">{edu.institution} - {edu.degree}</span>
              <span className="edu-dates">{edu.startDate} - {edu.endDate}</span>
            </div>
            {edu.note && <div className="edu-note">{edu.note}</div>}
          </div>
        ))}
      </section>

      {cv.certifications.length > 0 && (
        <section aria-label={sectionTitles.certifications}>
          <h2>{sectionTitles.certifications}</h2>
          {cv.certifications.map((cert, i) => (
            <div key={i} className="cert-entry">
              <div className="cert-head">
                <span className="cert-name">{cert.name}</span>
              </div>
              {cert.note && <div className="cert-note">{cert.note}</div>}
            </div>
          ))}
        </section>
      )}

      {cv.projects.length > 0 && (
        <section aria-label={sectionTitles.projects}>
          <h2>{sectionTitles.projects}</h2>
          {cv.projects.map((project, i) => (
            <div key={i} className="proj-entry">
              <div className="proj-head">
                <span className="proj-name">{project.name}</span>
                <span className="proj-meta">{[project.url, project.date].filter(Boolean).join(' | ')}</span>
              </div>
              <div className="proj-desc">{project.description}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
