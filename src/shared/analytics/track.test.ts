import { describe, expect, it, vi } from 'vitest';
import { track } from '@/shared/analytics/track';

describe('CAL-04 · track', () => {
  it('no envía props con datos clínicos ni identificadores', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    track('checkin_step', { step: 2, pain: 7, rut: '1-9' });
    expect(spy).toHaveBeenCalled();
    const props = spy.mock.calls[0][2] as Record<string, unknown>;
    expect(props.step).toBe(2);
    expect(props.pain).toBeUndefined();
    expect(props.rut).toBeUndefined();
    spy.mockRestore();
  });
});
