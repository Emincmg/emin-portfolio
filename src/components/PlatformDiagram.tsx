import { PLATFORM, productPosition } from '@/lib/diagrams';
import { platform } from '@/content/site';

function Node({ x, y, w, h, title, sub, cls, ...rest }: { x: number; y: number; w: number; h: number; title: string; sub: string; cls?: string; [k: `data-${string}`]: string | number | undefined }) {
  return (
    <g className={`node ${cls ?? ''}`} transform={`translate(${x},${y})`} {...rest}>
      <rect width={w} height={h} rx={4} />
      <text x={14} y={h / 2 - 2}>{title}</text>
      <text x={14} y={h / 2 + 15} className="sub">{sub}</text>
    </g>
  );
}

/** CI → registry → server pull, and DNS → gateway → every product. */
export function PlatformDiagram() {
  const { hubX, hubY, hubW, hubH } = PLATFORM;
  return (
    <div className="diagram" role="img" aria-label="Diagram: CI builds images that the server pulls; DNS sends 27 domains to one gateway, which routes to 13 isolated products.">
      <svg id="arch" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path className="wire ci" data-ci="0" d="M210 68 H250" />
          <path className="wire ci" data-ci="1" d="M420 68 H460" />
          <path className="wire ci" data-ci="2" d={`M545 96 C545 180 ${hubX + hubW / 2} 200 ${hubX + hubW / 2} ${hubY - hubH / 2}`} />
          <path className="wire" data-in="" d={`M210 ${hubY} H${hubX}`} />
          {platform.products.map((_, i) => {
            const { x, y } = productPosition(i);
            return <path key={i} className="wire" data-req={i} d={`M${hubX + hubW} ${hubY} C${hubX + hubW + 70} ${hubY} ${x - 70} ${y + 22} ${x} ${y + 22}`} />;
          })}
        </g>
        <Node x={40} y={40} w={170} h={56} title="CI build" sub="GitHub Actions" cls="ci" />
        <Node x={250} y={40} w={170} h={56} title="Image registry" sub="container images" cls="ci" />
        <Node x={460} y={40} w={170} h={56} title="Server pulls" sub="restart one service" cls="ci" />
        <Node x={40} y={hubY - 28} w={170} h={56} title="DNS & edge" sub="27 domains · TLS" />
        <g className="node hub" transform={`translate(${hubX},${hubY - hubH / 2})`} data-hub="">
          <rect width={hubW} height={hubH} rx={6} />
          <text x={18} y={34}>Gateway</text>
          <text x={18} y={54} className="sub">TLS · traffic · protection</text>
        </g>
        {platform.products.map(([title, sub], i) => {
          const { x, y } = productPosition(i);
          return <Node key={title} x={x} y={y} w={160} h={44} title={title} sub={sub} data-prod={i} />;
        })}
        <g className="pkts" />
      </svg>
    </div>
  );
}
