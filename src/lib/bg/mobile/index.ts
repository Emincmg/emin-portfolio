import type { ModeFactory } from '../engine';
import { trace } from './trace';
import { edge } from './edge';
import { stream } from './stream';
import { lanes } from './lanes';
import { ring } from './ring';
import { heartbeat } from './heartbeat';
import { shield } from './shield';

/** Touch-first, low-text versions for narrow screens. Keys match the desktop modes so stages work unchanged. */
export const MOBILE_MODES: Record<string, ModeFactory> = {
  packets: trace, traffic: edge, events: stream, concurrency: lanes, delivery: ring, health: heartbeat, protection: shield,
};
