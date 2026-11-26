'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { apagarLink, gravarLink, lerLinkDoTexto, lerTextoDoLink, type LinkGuardado } from '../utils/linkWhatsapp/armazenamento';

// O armazenamento não muda sozinho durante a visita: não há o que assinar.
const semAssinatura = () => () => undefined;

const VAZIO: LinkGuardado = { numero: '', mensagem: '' };

/**
 * Número e mensagem do gerador de link do WhatsApp, guardados no aparelho (RF-LW-21).
 *
 * O texto guardado é lido como uma "fonte externa": no servidor vale `null` (página vazia) e no
 * navegador vale o que está no `localStorage`. Enquanto a pessoa não mexe, o estado é o guardado;
 * a partir da primeira mudança, o estado é o da tela e é ele que vai sendo gravado. Restaurar não
 * passa por nenhuma ação da pessoa, então não conta como "comecou" na medição.
 */
export function useLinkWhatsapp() {
  const texto = useSyncExternalStore(semAssinatura, lerTextoDoLink, () => null);
  const guardado = useMemo(() => lerLinkDoTexto(texto) ?? VAZIO, [texto]);
  const [editado, setEditado] = useState<LinkGuardado | null>(null);
  const estado = editado ?? guardado;

  useEffect(() => {
    if (editado === null) return;
    // Tudo vazio não deixa chave no aparelho (é o que "Apagar o que eu digitei" pede).
    if (editado.numero === '' && editado.mensagem === '') apagarLink();
    else gravarLink(editado);
  }, [editado]);

  const mudarNumero = useCallback(
    (numero: string) => setEditado((atual) => ({ ...(atual ?? guardado), numero })),
    [guardado],
  );
  const mudarMensagem = useCallback(
    (mensagem: string) => setEditado((atual) => ({ ...(atual ?? guardado), mensagem })),
    [guardado],
  );
  const apagar = useCallback(() => setEditado(VAZIO), []);

  return { ...estado, mudarNumero, mudarMensagem, apagar };
}
