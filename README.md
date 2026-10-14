
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

## 🛠️ Stack Técnica

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Testes:** Vitest + React Testing Library
- **Monetização:** Google AdSense, só depois do conteúdo (ver abaixo)

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

## 📰 Conteúdo e anúncios (AdSense)

O AdSense reprovou o site por "conteúdo de baixo valor" em 2026. Estas regras existem para não repetir isso (TECH-DESIGN `adsense-aprovacao` no `unum-people-docs`):

- **Cada ferramenta tem um guia escrito** em `src/components/guias/`, renderizado no servidor e passado à View como `children`. Ele sai no HTML mesmo enquanto a ferramenta mostra "Carregando...". O exemplo de cada guia vem de uma constante `EXEMPLO_*`, e o teste alimenta a ferramenta real com ela: se uma fórmula mudar, o teste do guia quebra até o texto ser atualizado.
- **Anúncio só depois do conteúdo.** Nenhum anúncio na home, que é tela de navegação, nem acima da ferramenta. O slot `1270666901` fica entre a ferramenta e o guia, só depois de carregada, e o `7715444307` fica depois do guia.
- **A política de privacidade** (`/privacidade#anuncios`) tem o conteúdo obrigatório do AdSense sobre cookies de anúncio do Google. Não remova.

Para conferir o HTML como o Google recebe, sem rodar JavaScript:

```bash
npm run build && npm run start
bash scripts/verificar-adsense.sh http://localhost:3000   # sai com 0 se tudo ok
```

## 🎨 Identidade Visual

O projeto utiliza a identidade visual da Unum People, baseada na fonte **Poppins** e uma paleta de cores estratégica:
- **Brand Blue:** `#030066` (Profissionalismo e Confiança)
- **Brand Orange:** `#FF4D00` (Ação e Energia)
- **Brand Grey:** `#4D4D4D` (Sóbrio e Elegante)

---
© 2026 Unum People Creative Solutions. Todos os direitos reservados.
