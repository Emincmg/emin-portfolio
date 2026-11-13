import { experience } from '@/content/site';
import { BgStage } from '../BgStage';

export function Experience() {
  return (
    <section className="experience wrap" id="experience" aria-labelledby="exp-title">
      <p className="eyebrow">{experience.eyebrow}</p>
      <h2 className="title" id="exp-title">{experience.title}</h2>
      <div className="sidegrid">
        <div className="gitlog">
          <svg className="graph" aria-hidden="true" />
          <ol className="commits">
            {experience.commits.map((c) => (
              <li key={c.hash} className={'role' in c ? 'c role' : 'c'} data-lane={c.lane}>
                <span className="dot" />
                <code className="hash">{c.hash}</code>
                {c.ref ? <span className="refs"><b className={`ref ${c.ref.kind}`}>{c.ref.text}</b></span> : null}
                <span className="msg">{c.msg}</span>
                {'role' in c ? (
                  <article className="rolecard">
                    <h3>{c.role.title}</h3>
                    <div className="org">{c.role.org}</div>
                    <div className="when">{c.role.when}</div>
                    <p>{c.role.body}</p>
                  </article>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <BgStage mode="delivery" variant="sticky" />
      </div>
    </section>
  );
}
