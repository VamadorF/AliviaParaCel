import { describe, expect, it } from 'vitest';
import { consultaDeepLink, parseConsultaDeepLink } from '@/shared/navigation/deep-links';

describe('MOB-24 · deep links', () => {
  it('consulta/:id es reversible', () => {
    expect(parseConsultaDeepLink(consultaDeepLink('a1'))).toBe('a1');
  });
});
