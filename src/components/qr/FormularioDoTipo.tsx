'use client';

import React from 'react';
import {
  LIMITE_TEXTO,
  REDES,
  TIPOS_DE_CHAVE_PIX,
  type CamposPorTipo,
  type RedeId,
  type TipoId,
} from '../../utils/qr/conteudos';
import type { TipoChavePix } from '../../utils/qr/pix';
import { DICA_DO_CPF } from './PixCopiaECola';
import { CaixaQr, CampoAreaQr, CampoListaQr, CampoTextoQr } from './CamposDoQr';

interface Comum<T extends TipoId> {
  campos: CamposPorTipo[T];
  /** Só os erros que já podem aparecer (ver `errosVisiveis`). */
  erros: Record<string, string>;
  /** Avisos que não impedem o QR (corte do nome e da cidade no Pix). */
  avisos: Record<string, string>;
  onChange: (parcial: Partial<CamposPorTipo[T]>) => void;
  /** A pessoa saiu do campo: o erro dele pode aparecer. */
  onBlur: (campo: string) => void;
}

const EXEMPLO_DA_CHAVE: Record<TipoChavePix, string> = {
  cpf: '123.456.789-09',
  cnpj: '12.345.678/0001-95',
  celular: '(11) 98765-4321',
  email: 'contato@seunegocio.com.br',
  aleatoria: '123e4567-e12b-12d1-a456-426655440000',
};

function FormPix({ campos, erros, avisos, onChange, onBlur }: Comum<'pix'>) {
  return (
    <>
      <CampoListaQr
        rotulo="Tipo da chave"
        valor={campos.tipoChave}
        opcoes={TIPOS_DE_CHAVE_PIX}
        onChange={(tipoChave) => onChange({ tipoChave: tipoChave as TipoChavePix })}
      />
      <CampoTextoQr
        rotulo="Chave Pix"
        ajuda={campos.tipoChave === 'cpf' ? DICA_DO_CPF : undefined}
        valor={campos.chave}
        placeholder={EXEMPLO_DA_CHAVE[campos.tipoChave]}
        erro={erros.chave}
        onChange={(chave) => onChange({ chave })}
        onBlur={() => onBlur('chave')}
      />
      <CampoTextoQr
        rotulo="Nome de quem recebe"
        valor={campos.nome}
        placeholder="Maria da Silva"
        aviso={avisos.nome}
        erro={erros.nome}
        onChange={(nome) => onChange({ nome })}
        onBlur={() => onBlur('nome')}
      />
      <CampoTextoQr
        rotulo="Cidade"
        valor={campos.cidade}
        placeholder="São Paulo"
        aviso={avisos.cidade}
        erro={erros.cidade}
        onChange={(cidade) => onChange({ cidade })}
        onBlur={() => onBlur('cidade')}
      />
      <CampoTextoQr
        rotulo="Valor (opcional)"
        ajuda="Deixe em branco para o cliente digitar o valor."
        prefixo="R$"
        inputMode="decimal"
        valor={campos.valor}
        placeholder="25,00"
        erro={erros.valor}
        onChange={(valor) => onChange({ valor })}
        onBlur={() => onBlur('valor')}
      />
    </>
  );
}

function FormWhatsapp({ campos, erros, onChange, onBlur }: Comum<'whatsapp'>) {
  return (
    <>
      <CampoTextoQr
        rotulo="Número do WhatsApp com DDD"
        inputMode="tel"
        valor={campos.numero}
        placeholder="(11) 98765-4321"
        erro={erros.numero}
        onChange={(numero) => onChange({ numero })}
        onBlur={() => onBlur('numero')}
      />
      <CampoTextoQr
        rotulo="Mensagem que já chega escrita (opcional)"
        valor={campos.mensagem}
        placeholder="Olá! Vim pelo QR code e quero saber mais."
        onChange={(mensagem) => onChange({ mensagem })}
      />
    </>
  );
}

function FormRedes({ campos, erros, onChange, onBlur }: Comum<'redes'>) {
  return (
    <>
      <CampoListaQr
        rotulo="Rede"
        valor={campos.rede}
        opcoes={REDES}
        onChange={(rede) => onChange({ rede: rede as RedeId })}
      />
      <CampoTextoQr
        rotulo="Seu @ ou o link do perfil"
        valor={campos.perfil}
        placeholder="@seunegocio"
        erro={erros.perfil}
        onChange={(perfil) => onChange({ perfil })}
        onBlur={() => onBlur('perfil')}
      />
    </>
  );
}

function FormLink({ campos, erros, onChange, onBlur }: Comum<'link'>) {
  return (
    <CampoTextoQr
      rotulo="Endereço do site"
      inputMode="url"
      valor={campos.endereco}
      placeholder="www.seunegocio.com.br"
      erro={erros.endereco}
      onChange={(endereco) => onChange({ endereco })}
      onBlur={() => onBlur('endereco')}
    />
  );
}

function FormWifi({ campos, erros, onChange, onBlur }: Comum<'wifi'>) {
  return (
    <>
      <CampoTextoQr
        rotulo="Nome da rede (Wi-Fi)"
        valor={campos.rede}
        placeholder="Loja da Maria"
        erro={erros.rede}
        onChange={(rede) => onChange({ rede })}
        onBlur={() => onBlur('rede')}
      />
      <CampoTextoQr
        rotulo="Senha"
        valor={campos.senha}
        placeholder="senha-forte-123"
        disabled={campos.semSenha}
        erro={campos.semSenha ? undefined : erros.senha}
        onChange={(senha) => onChange({ senha })}
        onBlur={() => onBlur('senha')}
      />
      <CaixaQr rotulo="Rede sem senha" marcada={campos.semSenha} onChange={(semSenha) => onChange({ semSenha })} />
    </>
  );
}

function FormAvaliacao({ campos, erros, onChange, onBlur }: Comum<'avaliacao'>) {
  return (
    <CampoTextoQr
      rotulo="Link de avaliação do Google"
      ajuda="Veja no guia abaixo como pegar esse link pelo celular."
      inputMode="url"
      valor={campos.link}
      placeholder="https://g.page/r/SeuNegocio/review"
      erro={erros.link}
      onChange={(link) => onChange({ link })}
      onBlur={() => onBlur('link')}
    />
  );
}

function FormComoChegar({ campos, erros, onChange, onBlur }: Comum<'como-chegar'>) {
  return (
    <CampoTextoQr
      rotulo="Endereço do negócio ou link do Google Maps"
      valor={campos.endereco}
      placeholder="Rua das Flores, 100 - Centro, São Paulo"
      erro={erros.endereco}
      onChange={(endereco) => onChange({ endereco })}
      onBlur={() => onBlur('endereco')}
    />
  );
}

function FormContato({ campos, erros, onChange, onBlur }: Comum<'contato'>) {
  return (
    <>
      <CampoTextoQr
        rotulo="Nome"
        valor={campos.nome}
        placeholder="Maria da Silva"
        erro={erros.nome}
        onChange={(nome) => onChange({ nome })}
        onBlur={() => onBlur('nome')}
      />
      <CampoTextoQr
        rotulo="Nome do negócio (opcional)"
        valor={campos.negocio}
        placeholder="Doces da Maria"
        onChange={(negocio) => onChange({ negocio })}
      />
      <CampoTextoQr
        rotulo="Celular (opcional)"
        inputMode="tel"
        valor={campos.celular}
        placeholder="(11) 98765-4321"
        erro={erros.celular}
        onChange={(celular) => onChange({ celular })}
        onBlur={() => onBlur('celular')}
      />
      <CampoTextoQr
        rotulo="E-mail (opcional)"
        inputMode="email"
        valor={campos.email}
        placeholder="maria@doces.com.br"
        erro={erros.email}
        onChange={(email) => onChange({ email })}
        onBlur={() => onBlur('email')}
      />
      <CampoTextoQr
        rotulo="Site (opcional)"
        inputMode="url"
        valor={campos.site}
        placeholder="www.doces.com.br"
        erro={erros.site}
        onChange={(site) => onChange({ site })}
        onBlur={() => onBlur('site')}
      />
    </>
  );
}

function FormEmail({ campos, erros, onChange, onBlur }: Comum<'email'>) {
  return (
    <>
      <CampoTextoQr
        rotulo="Seu e-mail"
        inputMode="email"
        valor={campos.email}
        placeholder="contato@seunegocio.com.br"
        erro={erros.email}
        onChange={(email) => onChange({ email })}
        onBlur={() => onBlur('email')}
      />
      <CampoTextoQr
        rotulo="Assunto (opcional)"
        valor={campos.assunto}
        placeholder="Orçamento"
        onChange={(assunto) => onChange({ assunto })}
      />
      <CampoAreaQr
        rotulo="Mensagem (opcional)"
        valor={campos.mensagem}
        placeholder="Quero um orçamento."
        onChange={(mensagem) => onChange({ mensagem })}
      />
    </>
  );
}

function FormLigacao({ campos, erros, onChange, onBlur }: Comum<'ligacao'>) {
  return (
    <CampoTextoQr
      rotulo="Telefone com DDD"
      inputMode="tel"
      valor={campos.telefone}
      placeholder="(11) 98765-4321"
      erro={erros.telefone}
      onChange={(telefone) => onChange({ telefone })}
      onBlur={() => onBlur('telefone')}
    />
  );
}

function FormTexto({ campos, erros, onChange, onBlur }: Comum<'texto'>) {
  return (
    <CampoAreaQr
      rotulo="Texto"
      valor={campos.texto}
      placeholder="Bem-vindo! Horário: segunda a sexta, das 9h às 18h."
      rodape={`${Array.from(campos.texto).length} de ${LIMITE_TEXTO} caracteres`}
      erro={erros.texto}
      onChange={(texto) => onChange({ texto })}
      onBlur={() => onBlur('texto')}
    />
  );
}

interface FormularioDoTipoProps {
  tipo: TipoId;
  campos: CamposPorTipo;
  erros: Record<string, string>;
  avisos: Record<string, string>;
  onChange: <T extends TipoId>(tipo: T, parcial: Partial<CamposPorTipo[T]>) => void;
  onBlur: (campo: string) => void;
}

/** Passo 2 (RF-QR-06 a 16): os campos do tipo escolhido. */
export function FormularioDoTipo({ tipo, campos, erros, avisos, onChange, onBlur }: FormularioDoTipoProps) {
  const comum = { erros, avisos, onBlur };
  switch (tipo) {
    case 'pix':
      return <FormPix {...comum} campos={campos.pix} onChange={(p) => onChange('pix', p)} />;
    case 'whatsapp':
      return <FormWhatsapp {...comum} campos={campos.whatsapp} onChange={(p) => onChange('whatsapp', p)} />;
    case 'redes':
      return <FormRedes {...comum} campos={campos.redes} onChange={(p) => onChange('redes', p)} />;
    case 'link':
      return <FormLink {...comum} campos={campos.link} onChange={(p) => onChange('link', p)} />;
    case 'wifi':
      return <FormWifi {...comum} campos={campos.wifi} onChange={(p) => onChange('wifi', p)} />;
    case 'avaliacao':
      return <FormAvaliacao {...comum} campos={campos.avaliacao} onChange={(p) => onChange('avaliacao', p)} />;
    case 'como-chegar':
      return <FormComoChegar {...comum} campos={campos['como-chegar']} onChange={(p) => onChange('como-chegar', p)} />;
    case 'contato':
      return <FormContato {...comum} campos={campos.contato} onChange={(p) => onChange('contato', p)} />;
    case 'email':
      return <FormEmail {...comum} campos={campos.email} onChange={(p) => onChange('email', p)} />;
    case 'ligacao':
      return <FormLigacao {...comum} campos={campos.ligacao} onChange={(p) => onChange('ligacao', p)} />;
    case 'texto':
      return <FormTexto {...comum} campos={campos.texto} onChange={(p) => onChange('texto', p)} />;
  }
}
