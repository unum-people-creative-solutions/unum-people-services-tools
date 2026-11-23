import { Service } from '../types';
import { formatarNumero } from './numeros';

// Mesmas contas da lista de serviços: Trabalho = média de esforço e dificuldade,
// Retorno = média de repetição e lucro, Nota geral = média de (100 − Trabalho) e Retorno.
const trabalhoDe = (s: Service) => (s.esforco + s.complexidade) / 2;
const retornoDe = (s: Service) => (s.padronizacao + s.lucratividade) / 2;
const notaGeralDe = (s: Service) => (100 - trabalhoDe(s) + retornoDe(s)) / 2;

const CABECALHOS = ['Serviço', 'Nota geral', 'Trabalho', 'Retorno', 'Esforço', 'Dificuldade', 'Repetição', 'Lucro'];

const SEPARADOR = ';';
const QUEBRA_DE_LINHA = '\r\n';
const BOM = '﻿';

// Texto que começa com = + - @, tab ou CR vira fórmula no Excel: um apóstrofo na frente o mantém como texto.
const protegerContraFormula = (texto: string) => (/^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto);

// Texto com separador, aspas ou quebra de linha vai entre aspas, com as aspas dobradas.
const protegerTexto = (original: string) => {
  const texto = protegerContraFormula(original);
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const numero = (n: number) => formatarNumero(n, 2);

/** O conteúdo do CSV (sem o BOM): separador `;`, vírgula decimal, da maior para a menor nota geral. */
export function montarCSV(services: Service[]): string {
  const linhas = [...services]
    .sort((a, b) => notaGeralDe(b) - notaGeralDe(a))
    .map((s) =>
      [
        protegerTexto(s.nome),
        numero(notaGeralDe(s)),
        numero(trabalhoDe(s)),
        numero(retornoDe(s)),
        numero(s.esforco),
        numero(s.complexidade),
        numero(s.padronizacao),
        numero(s.lucratividade),
      ].join(SEPARADOR),
    );

  return [CABECALHOS.join(SEPARADOR), ...linhas].join(QUEBRA_DE_LINHA);
}

/** Baixa a planilha. O BOM UTF-8 faz o Excel em português abrir os acentos certos. */
export function exportToCSV(services: Service[]) {
  const blob = new Blob([BOM + montarCSV(services)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `servicos-que-compensam_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
