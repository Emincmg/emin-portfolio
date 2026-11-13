import { patterns } from '@/content/site';
import { BgStage } from '../BgStage';

export function Patterns() {
  const total = String(patterns.items.length).padStart(2, '0');
  return (
    <section className="patterns wrap" id="patterns" aria-labelledby="patterns-title">
      <p className="eyebrow">{patterns.eyebrow}</p>
      <h2 className="title" id="patterns-title">{patterns.title}</h2>
      <div className="stage">
        <svg className="onion" viewBox="0 0 400 400" aria-hidden="true">
          <circle data-ring="web" cx="200" cy="200" r="190" />
          <circle data-ring="infra" cx="200" cy="200" r="145" />
          <circle data-ring="app" cx="200" cy="200" r="100" />
          <circle data-ring="domain" cx="200" cy="200" r="55" />
          <text data-ring="web" x="200" y="34" textAnchor="middle">Web / API</text>
          <text data-ring="infra" x="200" y="79" textAnchor="middle">Infrastructure</text>
          <text data-ring="app" x="200" y="124" textAnchor="middle">Application</text>
          <text data-ring="domain" x="200" y="204" textAnchor="middle">Domain</text>
        </svg>
        <div>
          <div className="plist">
            {patterns.items.map((p, i) => (
              <article key={p.title} data-rings={p.rings}>
                <span className="n">{String(i + 1).padStart(2, '0')} / {total}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
          <div className="pbar"><i /></div>
        </div>
      </div>
      <BgStage mode="events" variant="band" />
      <p className="also">{patterns.also}</p>
    </section>
  );
}
