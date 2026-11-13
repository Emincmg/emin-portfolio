import { DIAGRAMS, NODE_H, NODE_W, edgePath } from '@/lib/diagrams';

/** Server-rendered architecture drawing; the client animates nodes, edges and packets. */
export function ArchDiagram({ id, label, caption }: { id: string; label: string; caption: string }) {
  const d = DIAGRAMS[id];
  if (!d) return null;
  const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  return (
    <figure className="pdiag" data-diagram={id}>
      <svg viewBox="0 0 430 330" role="img" aria-label={`${label} architecture`}>
        <g>
          {d.edges.map((e) => (
            <path key={`${e.from}-${e.to}`} className={`e${e.dashed ? ' d' : ''}`} d={edgePath(byId[e.from], byId[e.to])} pathLength={1} data-to={e.to} />
          ))}
        </g>
        <g>
          {d.nodes.map((n) => (
            <g key={n.id} className={`n ${n.style ?? ''}`} transform={`translate(${n.x},${n.y})`} data-id={n.id}>
              <rect width={NODE_W} height={NODE_H} rx={5} />
              <text x={10} y={n.sub ? 18 : 26}>{n.label}</text>
              {n.sub ? <text x={10} y={32} className="s">{n.sub}</text> : null}
            </g>
          ))}
        </g>
        <g className="pkts" />
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
