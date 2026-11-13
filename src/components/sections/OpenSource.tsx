import { openSource } from '@/content/site';
import { BgStage } from '../BgStage';

export function OpenSource() {
  return (
    <section className="wrap" id="open-source" aria-labelledby="oss-title">
      <p className="eyebrow">{openSource.eyebrow}</p>
      <h2 className="title" id="oss-title">{openSource.title}</h2>
      <div className="split">
        <div className="oss">
          {openSource.repos.map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener">
              <b>{r.name}</b><span className="meta">{r.meta} ↗</span>
              <p>{r.body}</p>
            </a>
          ))}
        </div>
        <div className="facts">
          <div><h3>Education</h3><p>{openSource.education.school}<small>{openSource.education.degree} · {openSource.education.when}</small></p></div>
          <div><h3>Languages</h3><p>{openSource.languages.map((l, i) => <span key={l}>{i ? <br /> : null}{l}</span>)}</p></div>
        </div>
        <BgStage mode="protection" />
      </div>
    </section>
  );
}
