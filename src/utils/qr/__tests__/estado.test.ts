import { describe, it, expect } from 'vitest';
import { acompanharChamada, estadoVazio, type EstadoQr } from '../estado';
import { chamadaDoTipo } from '../conteudos';

const com = (parcial: Partial<EstadoQr>): EstadoQr => ({ ...estadoVazio(), ...parcial });

describe('acompanharChamada: a frase sugerida segue o tipo (RF-QR-35)', () => {
  it('frase igual à chamada do tipo antigo passa a ser a chamada do tipo novo', () => {
    const antes = com({ tipo: 'pix', frase: 'Pague com Pix' });
    const depois = { ...antes, tipo: 'whatsapp' as const };
    expect(acompanharChamada(antes, depois).frase).toBe('Chame no WhatsApp');
  });

  it('frase que a pessoa mudou fica como está', () => {
    const antes = com({ tipo: 'pix', frase: 'Pague aqui' });
    const depois = { ...antes, tipo: 'whatsapp' as const };
    expect(acompanharChamada(antes, depois).frase).toBe('Pague aqui');
  });

  it('sem frase, continua sem frase', () => {
    const antes = com({ tipo: 'pix', frase: '' });
    const depois = { ...antes, tipo: 'link' as const };
    expect(acompanharChamada(antes, depois).frase).toBe('');
  });

  it('a chamada de Instagram e redes acompanha a rede escolhida', () => {
    const antes = com({ tipo: 'redes', frase: chamadaDoTipo('redes', { rede: 'instagram', perfil: '' }) });
    const depois = { ...antes, campos: { ...antes.campos, redes: { rede: 'tiktok' as const, perfil: '' } } };
    expect(acompanharChamada(antes, depois).frase).toBe('Siga a gente no TikTok');
  });

  it('se a mudança já trouxe outra frase, ela vale', () => {
    const antes = com({ tipo: 'pix', frase: 'Pague com Pix' });
    const depois = { ...antes, tipo: 'link' as const, frase: 'Meu texto' };
    expect(acompanharChamada(antes, depois).frase).toBe('Meu texto');
  });

  it('sem tipo escolhido não há o que acompanhar', () => {
    const antes = com({ tipo: null, frase: 'Pague com Pix' });
    expect(acompanharChamada(antes, { ...antes, tipo: 'link' }).frase).toBe('Pague com Pix');
  });
});
