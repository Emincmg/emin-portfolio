import { projects } from '@/content/site';
import { ArchDiagram } from '../ArchDiagram';
import { BgStage } from '../BgStage';

export function Projects() {
  return (
    <section className="projects wrap" id="projects" aria-labelledby="proj-title">
      <p className="eyebrow">{projects.eyebrow}</p>
      <h2 className="title" id="proj-title">{projects.title}</h2>
      <div className="sidegrid left">
        <BgStage mode="health" variant="sticky" />
        <div className="projlist">
          {projects.items.map((p) => (
            <article className="proj" key={p.name}>
              <div className="ptext">
                <span className="tag">{p.tag}</span>
                <h3>{p.name}</h3>
                <p><span className="k">Product</span>{p.product}</p>
                <span className="k">Architecture</span>
                <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <ArchDiagram id={p.diagram} label={p.name} caption={p.caption} />
            </article>
          ))}
        </div>
      </div>
      <p className="also-arch">{projects.also}</p>
    </section>
  );
}
