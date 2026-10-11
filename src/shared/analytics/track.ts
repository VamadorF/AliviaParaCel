/** CAL-04 · Eventos de producto. En mock solo consola, sin datos clínicos ni identificadores. */

export type ProductEvent =
  | 'checkin_start'
  | 'checkin_step'
  | 'checkin_saved'
  | 'checkin_abandon'
  | 'checkin_draft_resume';

type TrackProps = Record<string, string | number | boolean | null | undefined>;

const FORBIDDEN = /rut|dolor|pain|zona|med|email|phone|nombre|name/i;

function scrubProps(props: TrackProps): TrackProps {
  const out: TrackProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN.test(key)) continue;
    out[key] = value;
  }
  return out;
}

export function track(event: ProductEvent, props: TrackProps = {}) {
  const dev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (dev) {
    console.info('[alivia-track]', event, scrubProps(props));
  }
}
