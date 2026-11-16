import { site } from '@/content/site';

const LINKS = [['#platform', 'Platform'], ['#patterns', 'Patterns'], ['#capabilities', 'Capabilities'], ['#experience', 'Experience'], ['#projects', 'Projects']] as const;

export function Nav() {
  return (
    <>
      <div className="progress" aria-hidden="true"><i /></div>
      <nav className="top" aria-label="Main">
        <div className="wrap">
          <a href="#top" aria-label={`${site.name}, back to top`}>{site.shortName}</a>
          <div className="links">
            {LINKS.map(([href, label]) => <a key={href} href={href} data-nav={href.slice(1)}>{label}</a>)}
            <a className="cv" href="/resume.pdf">Resume ↓</a>
            <span className="nav-ind" aria-hidden="true" />
          </div>
        </div>
      </nav>
    </>
  );
}
