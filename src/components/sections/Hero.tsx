import { hero } from '@/content/site';
import { BgStage } from '../BgStage';

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-text">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>
            <span className="l1 scr">{hero.first}</span> <span className="l2 scr">{hero.last}</span>
          </h1>
          <p className="role" id="role" data-roles={JSON.stringify(hero.roles)}>{hero.roles[0]}</p>
          <div className="lead">
            <p>{hero.lead}</p>
            <dl className="stats">
              {hero.stats.map((s) => (
                <div className="stat" key={s.label}><dt><b>{s.value}</b></dt><dd>{s.label}</dd></div>
              ))}
            </dl>
          </div>
        </div>
        <BgStage mode="packets" />
      </div>
    </header>
  );
}
