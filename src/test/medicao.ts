import { vi } from 'vitest';

export const URL_USO = 'https://uso.exemplo.test/public/tools/uso';

export type Envio = { f: string; e: string };

// Guarda o texto do corpo na própria Blob, para os testes lerem na hora (sem esperar promessa,
// o que também funciona com timers falsos).
class BlobComTexto extends Blob {
  readonly texto: string;
  constructor(partes: BlobPart[] = [], opcoes?: BlobPropertyBag) {
    super(partes, opcoes);
    this.texto = partes.map(String).join('');
  }
}

/** Liga a medição nos testes (variável de ambiente + espião em `navigator.sendBeacon`). Nenhuma rede real. */
export function ligarMedicao() {
  vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', URL_USO);
  vi.stubGlobal('Blob', BlobComTexto);
  const sendBeacon = vi.fn((url: string, corpo?: BodyInit | null) => {
    void url;
    void corpo;
    return true;
  });
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: sendBeacon });
  return sendBeacon;
}

export function desligarMedicao() {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'sendBeacon');
}

/** O que foi enviado, na ordem: lê o corpo de cada chamada ao espião. */
export function enviados(sendBeacon: ReturnType<typeof ligarMedicao>): Envio[] {
  return sendBeacon.mock.calls.map(([, corpo]) => JSON.parse((corpo as BlobComTexto).texto) as Envio);
}
