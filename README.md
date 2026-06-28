# 🛒 Lista de Compras — PWA

App de lista de compras para iPhone, desenvolvida como Progressive Web App (PWA).

## Como instalar no iPhone

### Opção 1 — Netlify (recomendado, gratuito)

1. Vai a [netlify.com](https://netlify.com) e cria uma conta gratuita
2. No dashboard, arrasta a pasta `public/` para a área "Deploy manually"
3. A Netlify dá-te um link como `https://nome-aleatorio.netlify.app`
4. Abre esse link no Safari do iPhone
5. Toca no botão **Partilhar** (□↑) → **Adicionar ao ecrã principal**
6. A app fica instalada como uma app nativa!

### Opção 2 — Vercel (também gratuito)

1. Vai a [vercel.com](https://vercel.com) e cria uma conta
2. Instala o Vercel CLI: `npm i -g vercel`
3. Na pasta do projeto: `vercel --prod`
4. Segue os passos no terminal
5. Abre o link no Safari do iPhone e instala

### Opção 3 — GitHub Pages

1. Cria um repositório no GitHub
2. Faz upload dos ficheiros da pasta `public/`
3. Vai a Settings → Pages → seleciona a branch main
4. Acede ao link `https://username.github.io/repo-name`

---

## Estrutura do projeto

```
public/
├── index.html      # Estrutura da app
├── style.css       # Estilos (tema claro/escuro)
├── app.js          # Lógica da app
├── sw.js           # Service Worker (offline)
├── manifest.json   # Configuração PWA
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Funcionalidades

- ✅ Categorias recolhíveis/expansíveis
- ✅ Checkbox esquerda = produto planeado
- ✅ Tick direita = produto comprado (risca automaticamente)
- ✅ Adicionar produtos com campo rápido
- ✅ Editar/apagar com pressão longa
- ✅ Pesquisa de produtos
- ✅ Tema Claro / Escuro / Automático
- ✅ Funciona offline
- ✅ Dados guardados localmente no dispositivo
- ✅ Instala no ecrã inicial do iPhone
