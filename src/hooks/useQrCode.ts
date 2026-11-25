'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { CamposPorTipo, TipoId } from '../utils/qr/conteudos';
import { apagarEstado, gravarEstado, lerEstadoDoTexto, lerTextoGuardado } from '../utils/qr/armazenamento';
import { acompanharChamada, estadoVazio, type EstadoQr } from '../utils/qr/estado';

// O armazenamento não muda sozinho durante a visita: não há o que assinar.
const semAssinatura = () => () => undefined;

const estaVazio = (estado: EstadoQr) => JSON.stringify(estado) === JSON.stringify(estadoVazio());

/**
 * Estado do gerador de QR code: tipo e campos de todos os tipos, guardados no aparelho (RF-QR-28).
 *
 * O texto guardado é lido como uma "fonte externa": no servidor vale `null` (página vazia) e no
 * navegador vale o que está no `localStorage`. Enquanto a pessoa não mexe, o estado é o guardado;
 * a partir da primeira mudança, o estado é o da tela e é ele que vai sendo gravado. Restaurar não
 * passa por nenhuma ação da pessoa, então não conta como "comecou" na medição.
 */
export function useQrCode() {
  const texto = useSyncExternalStore(semAssinatura, lerTextoGuardado, () => null);
  const guardado = useMemo(() => lerEstadoDoTexto(texto) ?? estadoVazio(), [texto]);
  const [editado, setEditado] = useState<EstadoQr | null>(null);
  const estado = editado ?? guardado;

  useEffect(() => {
    if (editado === null) return;
    // Estado vazio não deixa chave no aparelho (é o que "Apagar o que eu digitei" pede).
    if (estaVazio(editado)) apagarEstado();
    else gravarEstado(editado);
  }, [editado]);

  const escolherTipo = useCallback(
    (tipo: TipoId) =>
      setEditado((atual) => {
        const base = atual ?? guardado;
        return acompanharChamada(base, { ...base, tipo });
      }),
    [guardado],
  );

  const mudarCampos = useCallback(
    <T extends TipoId>(tipo: T, parcial: Partial<CamposPorTipo[T]>) =>
      setEditado((atual) => {
        const base = atual ?? guardado;
        return acompanharChamada(base, {
          ...base,
          campos: { ...base.campos, [tipo]: { ...base.campos[tipo], ...parcial } },
        });
      }),
    [guardado],
  );

  /** Cor, frase, nome do negócio e tamanho da plaquinha (F2). */
  const mudarAparencia = useCallback(
    (parcial: Partial<Pick<EstadoQr, 'cor' | 'frase' | 'nomeDoNegocio' | 'tamanho'>>) =>
      setEditado((atual) => ({ ...(atual ?? guardado), ...parcial })),
    [guardado],
  );

  const apagar = useCallback(() => setEditado(estadoVazio()), []);

  return { estado, escolherTipo, mudarCampos, mudarAparencia, apagar };
}
