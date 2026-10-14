#!/usr/bin/env bash
# Confere o HTML que o Google recebe das ferramentas, sem rodar JavaScript
# (spec adsense-aprovacao, RF-20).
# Uso: bash scripts/verificar-adsense.sh <url-base>
#   ex.: bash scripts/verificar-adsense.sh http://localhost:3000
# Sai com 0 se tudo ok, 1 se houver qualquer falha.
set -euo pipefail

BASE="${1:?uso: verificar-adsense.sh <url-base>}"
BASE="${BASE%/}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PAGINAS=(home portfolio-analises simulador-precificacao calculadora-viabilidade)
for p in "${PAGINAS[@]}"; do
  caminho="/$p"
  [ "$p" = home ] && caminho="/"
  curl -sSf --max-time 30 "$BASE$caminho" -o "$TMP/$p.html"
done

python3 - "$TMP" <<'EOF'
import re
import sys
from html.parser import HTMLParser

pasta = sys.argv[1]
MIN_PALAVRAS = 600
falhas = []


class TextoDoGuia(HTMLParser):
    """Junta o texto do elemento com data-guia, ignorando <script> e <style>."""

    VAZIOS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
              'link', 'meta', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.profundidade = 0
        self.ignorar = 0
        self.partes = []
        self.achou = False

    def handle_starttag(self, tag, attrs):
        if tag in self.VAZIOS:
            return
        if self.profundidade:
            self.profundidade += 1
        elif any(nome == 'data-guia' for nome, _ in attrs):
            self.profundidade = 1
            self.achou = True
        if tag in ('script', 'style'):
            self.ignorar += 1

    def handle_endtag(self, tag):
        if tag in self.VAZIOS:
            return
        if tag in ('script', 'style') and self.ignorar:
            self.ignorar -= 1
        if self.profundidade:
            self.profundidade -= 1

    def handle_data(self, data):
        if self.profundidade and not self.ignorar:
            self.partes.append(data)


def ler(nome):
    with open(f'{pasta}/{nome}.html', encoding='utf-8') as f:
        return f.read()


INS_ADSENSE = re.compile(r'<ins\b[^>]*class="adsbygoogle"')
INICIO_GUIA = re.compile(r'<[a-z]+\b[^>]*\sdata-guia\b')

# (b) home sem anúncio
if INS_ADSENSE.search(ler('home')):
    falhas.append('/: a home tem <ins class="adsbygoogle">')
else:
    print('ok: / sem anúncio')

for pagina in ('portfolio-analises', 'simulador-precificacao', 'calculadora-viabilidade'):
    html = ler(pagina)
    leitor = TextoDoGuia()
    leitor.feed(html)

    # (a) guia com pelo menos MIN_PALAVRAS palavras
    if not leitor.achou:
        falhas.append(f'/{pagina}: guia ausente (nenhum elemento com data-guia)')
        continue
    palavras = len(' '.join(leitor.partes).split())
    if palavras < MIN_PALAVRAS:
        falhas.append(f'/{pagina}: guia com {palavras} palavras (mínimo {MIN_PALAVRAS})')
    else:
        print(f'ok: /{pagina} guia com {palavras} palavras')

    # (c) nenhum anúncio antes do guia enquanto a ferramenta carrega
    if pagina in ('portfolio-analises', 'simulador-precificacao'):
        inicio = INICIO_GUIA.search(html).start()
        anuncio = INS_ADSENSE.search(html)
        if anuncio and anuncio.start() < inicio:
            falhas.append(f'/{pagina}: <ins class="adsbygoogle"> antes do guia')
        else:
            print(f'ok: /{pagina} sem anúncio antes do guia')

for f in falhas:
    print(f'FALHA: {f}')
sys.exit(1 if falhas else 0)
EOF
