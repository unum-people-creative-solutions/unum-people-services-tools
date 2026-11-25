
## 📚 Documentação Oficial (Arquitetura e TDDs)

**Nota Importante:** A documentação técnica detalhada, as regras de IA (Harness), os Technical Design Documents (TDDs) e o log de estado contínuo deste projeto **não ficam armazenados neste repositório**. 

Para obter o contexto arquitetural completo e consultar o *Single Source of Truth* do ecossistema, acesse o repositório centralizado de documentação:
👉 **[unum-people-docs](https://github.com/unum-people-creative-solutions/unum-people-docs.git)**

# Unum People - Ferramentas de Inteligência Estratégica

O ecossistema de ferramentas da **Unum People** foi projetado para eliminar o "achismo" da gestão de serviços e marketing, fornecendo dados precisos sobre rentabilidade, precificação e viabilidade de campanhas.

## 🚀 Ferramentas Disponíveis

### 1. Mapeamento Estratégico (Portfólio)
- **O que faz:** Analisa seu portfólio de serviços sob a ótica de escalabilidade e lucratividade.
- **Destaque:** Matrizes de Operação e Decisão para identificar quais serviços priorizar ou otimizar.
- **Caminho:** `/portfolio-analises`

### 2. Simulador de Precificação
- **O que faz:** Calcula o preço ideal de venda baseado nos seus custos fixos reais, capacidade produtiva e impostos.
- **Destaque:** Identifica o "Piso Aceitável" (break-even) e a margem de lucro real de cada projeto.
- **Caminho:** `/simulador-precificacao`

### 3. Calculadora de Viabilidade de Campanhas
- **O que faz:** Projeta o ROI e o CAC de campanhas de anúncios antes de você investir.
- **Destaque:** Simula cenários baseados em orçamento disponível ou meta de clientes desejada.
- **Caminho:** `/calculadora-viabilidade`

### 4. Gerador de QR code
- **O que faz:** cria o QR code de 11 tipos: Pix (BR Code estático do Banco Central, com o copia e cola), WhatsApp, Instagram e outras redes, link, Wi-Fi, avaliação no Google, como chegar, contato (vCard), e-mail, ligação e texto.
- **Destaque:** o QR é estático e nunca expira. Pode levar cor, logo e frase, e tem uma plaquinha para imprimir (A6 ou A4, impressão ou PNG a 300 DPI). Tudo é gerado no navegador.
- **Guardar:** o último QR fica no `localStorage` (`tools-qr-code:v1`), sem o logo, e há um botão para apagar.
- **Código:** `src/utils/qr/` (lógica pura e testes que leem o QR de volta com `jsqr`), `src/components/qr/`, `src/app/gerador-qr-code/`.
- **Medição:** ferramenta `qr-code`, com o evento próprio `baixou`.
- **Caminho:** `/gerador-qr-code`

## 🛠️ Stack Técnica

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **QR code:** `qrcode` (só a matriz; o desenho em SVG e canvas é nosso)
- **Testes:** Vitest + React Testing Library

## 📦 Desenvolvimento

### Instalação

```bash
npm install
```

### Servidor de Desenvolvimento

```bash
npm run dev
```

### Build e Produção

```bash
npm run build
npm run start
```

### Qualidade e Testes

```bash
npm run lint    # Verificação de padrões e tipos
npm test        # Execução da suíte de testes unitários
```

## 📰 Conteúdo e anúncios

O site não tem anúncios desde 23/11/2026, por decisão do dono (o AdSense foi removido, junto com o aviso de cookies e o `ads.txt`). Cada ferramenta continua com um guia escrito em `src/components/guias/`, renderizado no servidor e passado à View como `children`, logo depois da ferramenta. O exemplo de cada guia vem de uma constante `EXEMPLO_*`, e o teste alimenta a ferramenta real com ela: se uma fórmula mudar, o teste do guia quebra até o texto ser atualizado.

## 🎨 Identidade Visual

O projeto utiliza a identidade visual da Unum People, baseada na fonte **Poppins** e uma paleta de cores estratégica:
- **Brand Blue:** `#030066` (Profissionalismo e Confiança)
- **Brand Orange:** `#FF4D00` (Ação e Energia)
- **Brand Grey:** `#4D4D4D` (Sóbrio e Elegante)

---
© 2026 Unum People Creative Solutions. Todos os direitos reservados.
