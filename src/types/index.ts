export interface Service {
  id: string;
  nome: string;
  esforco: number;
  complexidade: number;
  padronizacao: number;
  lucratividade: number;
  /** As 24 respostas (true = sim), na ordem das perguntas de QUESTIONS. Ausente em serviços cadastrados antes. */
  respostas?: boolean[];
}

export interface PricingData {
  // Custos Fixos
  custosFixos: {
    aluguel: number;
    energia: number;
    internet: number;
    contador: number;
    softwares: number;
    equipe: number;
    proLabore: number;
  };
  // Capacidade Produtiva
  capacidade: {
    diasTrabalhados: number;
    horasDiarias: number;
    percentualOciosidade: number;
  };
  // Parametrização do Serviço Atual
  servico: {
    nome: string;
    horasEstimadas: number;
    materiaisDiretos: number;
    deslocamento: number;
    impostosPercentual: number;
    precoDesejado: number;
  };
}

export type StepKey = 'esforco' | 'complexidade' | 'padronizacao' | 'lucratividade';

export interface Question {
  id: string;
  text: string;
}

export const QUESTIONS: Record<StepKey, Question[]> = {
  esforco: [
    { id: 'e1', text: 'A execução operacional do serviço consome, no total, mais de 8 horas de trabalho ativo (o equivalente a um turno completo de um profissional)?' },
    { id: 'e2', text: 'O processo exige a alocação de três ou mais pessoas (seja de forma simultânea ou em etapas de repasse) para ser concluído do início ao fim?' },
    { id: 'e3', text: 'O processo de alinhamento, coleta de requisitos, orçamentos complexos ou medições consome mais de 2 horas de trabalho antes do início efetivo da produção?' },
    { id: 'e4', text: 'A conclusão do serviço obriga o deslocamento físico da equipe para fora da base da empresa (ex: instalações em clientes, montagens externas)?' },
    { id: 'e5', text: 'A execução exige a configuração demorada de maquinário primário, paralisação de outros setores ou uso de equipamentos que impedem que outros serviços sejam feitos ao mesmo tempo?' },
    { id: 'e6', text: 'A preparação prévia (separação de material, configuração de ambiente) somada à finalização (limpeza, empacotamento, desmobilização) consome mais de 1 hora de trabalho ininterrupto?' },
  ],
  complexidade: [
    { id: 'c1', text: 'A execução do serviço exige a elaboração de um projeto estrutural ou design criativo exclusivo do zero, em vez de apenas adaptar informações do cliente a um gabarito pré-existente?' },
    { id: 'c2', text: 'O processo exige validações intermediárias do cliente (como provas de cor físicas, testes de material ou múltiplas rodadas de revisão de projeto) antes que a produção final possa ser iniciada ou concluída?' },
    { id: 'c3', text: 'Um erro irrecuperável durante a produção (perda de material) ou durante a instalação (danos ao local do cliente) resultaria em um prejuízo financeiro superior ao próprio lucro estimado para o serviço?' },
    { id: 'c4', text: 'A produção, montagem ou instalação só pode ser executada por um profissional com treinamento técnico específico, experiência sênior ou certificação (ex: soldador, eletricista, instalador de ACM), sendo impossível delegar a tarefa para um assistente comum?' },
    { id: 'c5', text: 'O serviço exige precisão milimétrica crítica (onde um erro de milímetros inutiliza a peça) ou condições de ambiente rigorosamente controladas (ex: ausência de poeira para envelopamento, controle de temperatura)?' },
    { id: 'c6', text: 'A instalação ou entrega final depende de autorizações externas que não dependem da empresa, como alvarás de prefeitura, laudos de engenharia (ART), normas rígidas de condomínios ou horários restritos em shoppings?' },
  ],
  padronizacao: [
    { id: 'p1', text: 'Os materiais base utilizados para a execução deste serviço são estritamente os mesmos em mais de 90% dos pedidos, eliminando a necessidade de realizar cotações ou compras sob medida no fornecedor para cada cliente?' },
    { id: 'p2', text: 'O serviço pode ser vendido utilizando uma tabela de preços fixa (por metro quadrado, por unidade ou por pacote fechado), sem a necessidade de calcular um orçamento do zero baseando-se no projeto de cada cliente?' },
    { id: 'p3', text: 'A venda e a produção do material podem ser concluídas com segurança baseando-se apenas nas medidas e informações fornecidas pelo cliente (ex: via WhatsApp), eliminando a necessidade obrigatória de uma visita técnica prévia ao local?' },
    { id: 'p4', text: 'O processo de fabricação ou impressão segue um roteiro técnico idêntico em todas as vendas, não sofrendo alterações de maquinário ou de ordem de montagem independentemente da variação da arte do cliente?' },
    { id: 'p5', text: 'Qualquer funcionário da área de produção com treinamento básico consegue iniciar, executar e finalizar o serviço de forma autônoma, sem precisar consultar constantemente o vendedor ou solicitar instruções de um projetista/designer?' },
    { id: 'p6', text: 'Em caso de pico extremo de demanda, o processo produtivo deste serviço é simples o suficiente para ser terceirizado com outro fornecedor rapidamente, sem que o cliente perceba perda de qualidade ou alteração no padrão do produto final?' },
  ],
  lucratividade: [
    { id: 'l1', text: 'O preço final cobrado pelo serviço representa, no mínimo, o triplo (300%) do custo direto de todos os materiais e insumos utilizados para a sua fabricação?' },
    { id: 'l2', text: 'O custo financeiro equivalente às horas de trabalho gastas por toda a equipe (atendimento, arte, produção e instalação) consome menos de 30% do valor total cobrado pelo serviço?' },
    { id: 'l3', text: 'O serviço possui uma demanda de mercado firme ou um alto valor percebido, permitindo que o contrato seja fechado de forma consistente pelo preço de tabela, sem a necessidade de ceder descontos para vencer a concorrência?' },
    { id: 'l4', text: 'A política comercial padrão para este serviço exige e consegue aplicar o pagamento de um sinal (entrada) de 50% ou mais, garantindo que a compra do material e os custos iniciais sejam pagos com o dinheiro do próprio cliente?' },
    { id: 'l5', text: 'A venda deste serviço principal atua como um ímã que gera a contratação imediata de produtos adicionais de produção rápida (ex: o cliente compra a fachada em ACM e naturalmente adiciona adesivos de vitrine e banners ao pacote)?' },
    { id: 'l6', text: 'O histórico da empresa comprova que este serviço possui um índice de problemas pós-entrega praticamente inexistente, blindando o lucro contra custos invisíveis de visitas técnicas de ajuste, manutenções em garantia ou trocas precoces?' },
  ],
};
