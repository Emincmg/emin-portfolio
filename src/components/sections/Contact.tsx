import { contact, site } from '@/content/site';
import { BgStage } from '../BgStage';

export function Contact() {
  return (
    <section className="contact wrap" id="contact" aria-labelledby="contact-title">
      <div className="contact-grid">
        <div>
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2 className="big" id="contact-title">{contact.headline}</h2>
          <div className="actions">
            <a className="btn primary" href={`mailto:${site.email}`}>{site.email}</a>
            <a className="btn" href="/resume.pdf">Download resume (PDF)</a>
            <a className="btn" href={site.github} target="_blank" rel="noopener me">GitHub ↗</a>
            <a className="btn" href={site.linkedin} target="_blank" rel="noopener me">LinkedIn ↗</a>
          </div>
        </div>
        <BgStage mode="protection" />
      </div>
      <footer>
        <span>© {site.copyrightYear} {site.name}</span>
        <span>{site.location.city}, {site.location.country} · press ` for a shell</span>
      </footer>
    </section>
  );
}
