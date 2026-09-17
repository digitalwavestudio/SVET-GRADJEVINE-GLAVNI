import { describe, expect, it } from 'vitest';
import { applyBoldRules } from './aiFormat';

describe('applyBoldRules', () => {
  it('ističe naslov u podrazumevanom režimu', () => {
    expect(applyBoldRules('**Zidar**')).toBe(
      '<strong class="font-bold text-white tracking-wide">Zidar</strong>',
    );
  });

  it('ističe raspon satnice zlatnom bojom', () => {
    expect(applyBoldRules('Satnica 10-12 eur')).toContain('text-secondary');
  });

  it('ističe lokaciju belom bojom', () => {
    expect(applyBoldRules('Posao u Beogradu')).toContain('Beograd');
  });

  it('ističe benefit belom bojom', () => {
    expect(applyBoldRules('Obezbeđen smeštaj')).toContain('smeštaj');
  });

  it('u detaljnom režimu ističe pojedinačnu cenu', () => {
    expect(applyBoldRules('Satnica 15 eur', { detailed: true })).toContain('text-secondary');
  });

  it('u detaljnom režimu ističe profesiju velikim slovima', () => {
    const output = applyBoldRules('Oglas za posao tesara', { detailed: true });
    expect(output).toContain('tesara');
    expect(output).toContain('uppercase');
  });
});
