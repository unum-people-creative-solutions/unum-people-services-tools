'use client';

import { useCallback, useState } from 'react';
import type { CamposPorTipo, TipoId } from '../utils/qr/conteudos';
import { estadoVazio, type EstadoQr } from '../utils/qr/estado';

/** Estado do gerador de QR code: tipo e campos de todos os tipos. */
export function useQrCode() {
  const [estado, setEstado] = useState<EstadoQr>(estadoVazio);

  const escolherTipo = useCallback((tipo: TipoId) => {
    setEstado((atual) => ({ ...atual, tipo }));
  }, []);

  const mudarCampos = useCallback(<T extends TipoId>(tipo: T, parcial: Partial<CamposPorTipo[T]>) => {
    setEstado((atual) => ({
      ...atual,
      campos: { ...atual.campos, [tipo]: { ...atual.campos[tipo], ...parcial } },
    }));
  }, []);

  return { estado, escolherTipo, mudarCampos };
}
