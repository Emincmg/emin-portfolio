import type { ModeFactory } from '../engine';
import { packets } from './packets';
import { traffic } from './traffic';
import { eventStream } from './events';
import { concurrency } from './concurrency';
import { delivery } from './delivery';
import { health } from './health';
import { protection } from './protection';

/** Order here is the order of the switcher buttons. */
export const MODES: Record<string, ModeFactory> = {
  packets, traffic, events: eventStream, concurrency, delivery, health, protection,
};
