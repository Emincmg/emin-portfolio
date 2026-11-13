import { platform } from '@/content/site';
import { BgStage } from '../BgStage';
import { PlatformDiagram } from '../PlatformDiagram';

export function Platform() {
  return (
    <section className="platform wrap" id="platform" aria-labelledby="platform-title">
      <div className="intro">
        <div>
          <p className="eyebrow">{platform.eyebrow}</p>
          <h2 className="title" id="platform-title">{platform.title}</h2>
          <p>{platform.body}</p>
        </div>
        <BgStage mode="traffic" />
      </div>
      <PlatformDiagram />
      <div className="legend"><span><i />requests through the gateway</span><span><i className="ci" />image pipeline: CI → registry → pull</span></div>
      <div className="infra">
        {platform.infra.map((x) => (
          <article key={x.k}><h3 className="k">{x.k}</h3><p>{x.body}</p></article>
        ))}
      </div>
    </section>
  );
}
