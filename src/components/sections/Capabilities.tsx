import { capabilities } from '@/content/site';
import { BgStage } from '../BgStage';

export function Capabilities() {
  return (
    <section className="capabilities wrap" id="capabilities" aria-labelledby="cap-title">
      <p className="eyebrow">{capabilities.eyebrow}</p>
      <h2 className="title" id="cap-title">{capabilities.title}</h2>
      <div className="sidegrid">
        <div className="capgrid">
          {capabilities.groups.map((g) => (
            <article key={g.title}>
              <h3>{g.title}</h3>
              <ul>{g.items.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
          ))}
        </div>
        <BgStage mode="concurrency" variant="sticky" />
      </div>
    </section>
  );
}
