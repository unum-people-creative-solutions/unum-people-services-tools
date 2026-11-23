import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, montarCSV } from '../csv';
import { Service } from '../../types';

const servico = (id: string, nome: string, e: number, c: number, p: number, l: number): Service => ({
  id,
  nome,
  esforco: e,
  complexidade: c,
  padronizacao: p,
  lucratividade: l,
});

// Adesivo: operação 16,67, decisão 75, nota geral 79,17
const ADESIVO = servico('1', 'Adesivo de vitrine', 100 / 6, 100 / 6, (5 / 6) * 100, (4 / 6) * 100);
// Fachada: operação 83,33, decisão 33,33, nota geral 25
const FACHADA = servico('2', 'Fachada em ACM', (5 / 6) * 100, (5 / 6) * 100, 100 / 6, 50);

describe('montarCSV (RF-F3b-08)', () => {
  it('começa com os cabeçalhos com os nomes novos, separados por ponto e vírgula', () => {
    const [cabecalho] = montarCSV([ADESIVO]).split('\r\n');
    expect(cabecalho).toBe('Serviço;Nota geral;Trabalho;Retorno;Esforço;Dificuldade;Repetição;Lucro');
  });

  it('usa ponto e vírgula entre as colunas e vírgula decimal, sem aspas nos números', () => {
    const linhas = montarCSV([ADESIVO]).split('\r\n');
    expect(linhas[1]).toBe('Adesivo de vitrine;79,17;16,67;75,00;16,67;16,67;83,33;66,67');
  });

  it('ordena da maior para a menor nota geral', () => {
    const linhas = montarCSV([FACHADA, ADESIVO]).split('\r\n');
    expect(linhas[1].startsWith('Adesivo de vitrine;')).toBe(true);
    expect(linhas[2]).toBe('Fachada em ACM;25,00;83,33;33,33;83,33;83,33;16,67;50,00');
  });

  it('protege o nome que tem ponto e vírgula ou aspas', () => {
    const csv = montarCSV([servico('3', 'Corte; "premium"', 0, 0, 0, 0)]);
    expect(csv.split('\r\n')[1].startsWith('"Corte; ""premium""";')).toBe(true);
  });

  it.each(['=SOMA(1)', '+1', '-1', '@cmd', '\tx', '\rx'])(
    'nome que começa com %j recebe apóstrofo na frente (proteção contra fórmula no Excel)',
    (nome) => {
      const csv = montarCSV([servico('4', nome, 0, 0, 0, 0)]);
      const linha = csv.slice(csv.indexOf('\r\n') + 2);
      expect(linha.startsWith(`'${nome}`) || linha.startsWith(`"'${nome}`)).toBe(true);
    },
  );

  it('o apóstrofo de proteção vem antes das aspas de um nome com ponto e vírgula', () => {
    const csv = montarCSV([servico('5', '=A;B', 0, 0, 0, 0)]);
    expect(csv.split('\r\n')[1].startsWith('"\'=A;B";')).toBe(true);
  });

  it('nomes normais, com hífen ou sinal no meio, ficam inalterados', () => {
    const csv = montarCSV([servico('6', 'Corte a-b + c', 0, 0, 0, 0)]);
    expect(csv.split('\r\n')[1].startsWith('Corte a-b + c;')).toBe(true);
  });

  it('sem serviços, só o cabeçalho', () => {
    expect(montarCSV([]).split('\r\n')).toHaveLength(1);
  });
});

describe('exportToCSV (RF-F3b-08)', () => {
  let blobs: Blob[];
  let clique: ReturnType<typeof vi.spyOn>;
  let nomeDoArquivo: string | null;

  beforeEach(() => {
    blobs = [];
    nomeDoArquivo = null;
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      blobs.push(blob as Blob);
      return 'blob:teste';
    });
    URL.revokeObjectURL = vi.fn();
    clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nomeDoArquivo = this.getAttribute('download');
    });
  });

  afterEach(() => {
    clique.mockRestore();
  });

  it('baixa um arquivo .csv com BOM UTF-8 que o Excel em português abre certo', async () => {
    exportToCSV([ADESIVO]);

    expect(clique).toHaveBeenCalledOnce();
    expect(nomeDoArquivo).toMatch(/\.csv$/);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toContain('text/csv');

    const bytes = new Uint8Array(await blobs[0].arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    const texto = new TextDecoder('utf-8').decode(bytes.slice(3));
    expect(texto).toBe(montarCSV([ADESIVO]));
    expect(texto.startsWith('Serviço;Nota geral;')).toBe(true);
  });

  it('não deixa o link de download no documento', () => {
    exportToCSV([ADESIVO]);
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
