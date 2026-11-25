// Só para testes: lê de volta o QR que está na tela (o SVG do `role="img"`), sem canvas.
import { lerQr } from './qr';

/** Texto que um leitor leria do SVG do QR desenhado na tela, ou null se não houver leitura. */
export function lerQrDoSvg(svg: Element): string | null {
  const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
  const caminho = svg.querySelector('path')?.getAttribute('d');
  if (!viewBox || !caminho) return null;

  const tamanho = viewBox[2] - 8; // margem de 4 módulos de cada lado
  const escuros = new Set<string>();
  for (const m of caminho.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [x, y, n] = [Number(m[1]), Number(m[2]), Number(m[3])];
    for (let c = 0; c < n; c++) escuros.add(`${y - 4},${x - 4 + c}`);
  }
  return lerQr({ tamanho, escuro: (linha, coluna) => escuros.has(`${linha},${coluna}`) });
}
