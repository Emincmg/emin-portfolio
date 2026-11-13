import { site } from '@/content/site';

export function Nav() {
  return (
    <nav className="top" aria-label="Main">
      <div className="wrap">
        <a href="#top" aria-label={`${site.name}, back to top`}>{site.shortName}</a>
        <div className="links">
          <a href="#platform">Platform</a>
          <a href="#patterns">Patterns</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a className="cv" href="/resume.pdf">Resume ↓</a>
        </div>
      </div>
    </nav>
  );
}
