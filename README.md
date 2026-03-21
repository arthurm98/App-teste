# MangaTrack: Seu Organizador de Mangás, Manhwas e Webtoons

MangaTrack é uma aplicação web moderna, rápida e responsiva, projetada para ajudar você a organizar e acompanhar o progresso de leitura de mangás, manhwas, webtoons e novels em um único lugar. O projeto usa **um único manifesto NPM na raiz** (`package.json`) para instalação, desenvolvimento, build e fluxos auxiliares como Genkit.

A aplicação é um **Progressive Web App (PWA)**, o que significa que pode ser instalada no celular ou desktop para uma experiência mais próxima a um aplicativo nativo.

## ✨ Recursos Principais

- **Biblioteca Pessoal:** Adicione títulos à sua biblioteca e organize-os por status: "Lendo", "Planejo Ler" ou "Completo".
- **Busca Online Inteligente:** Encontre novos títulos buscando em múltiplas fontes populares, como MyAnimeList (via Jikan), Kitsu e AniList.
- **Acompanhamento de Progresso:** Marque facilmente os capítulos lidos e visualize seu progresso com barras de porcentagem.
- **Estatísticas Visuais:** Tenha insights sobre seus hábitos de leitura com gráficos que mostram a distribuição de gêneros e o status dos seus títulos.
- **Sincronização na Nuvem:** Crie uma conta com e-mail e senha para ter sua biblioteca sincronizada e acessível em qualquer dispositivo através do Firebase.
- **Modo Offline:** Prefere não criar uma conta? Use o modo anônimo e seus dados serão salvos localmente no navegador.
- **Backup e Restauração:** No modo offline, você pode exportar sua biblioteca para um arquivo JSON e restaurá-la a qualquer momento.
- **Design Responsivo e Moderno:** Interface otimizada para uma experiência agradável em desktops e dispositivos móveis.
- **Tema Claro e Escuro:** Alterne entre os temas para uma leitura mais confortável a qualquer hora do dia.
- **Instalável (PWA):** Adicione o MangaTrack à tela inicial do dispositivo para acesso rápido e experiência de tela cheia.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/)
- **Backend e Banco de Dados:** [Firebase](https://firebase.google.com/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **PWA:** [next-pwa](https://www.npmjs.com/package/next-pwa)
- **Validação de Formulários:** [React Hook Form](https://react-hook-form.com/) e [Zod](https://zod.dev/)
- **IA / Flows locais:** [Genkit](https://genkit.dev/)

## ⚙️ Fluxo Único do Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [npm](https://www.npmjs.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/mangatrack.git
cd mangatrack
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na **raiz do projeto** com as credenciais do Firebase usadas pela aplicação.

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="12345..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:12345...:web:abcdef..."
```

> O arquivo `src/firebase/config.ts` consome essas variáveis. Se você habilitar os fluxos de IA do Genkit, também precisará configurar as variáveis exigidas pelo provedor usado nesses fluxos.

### 3. Instale as dependências

Use somente o manifesto da raiz:

```bash
npm install
```

> Não execute `npm install` dentro de `src/`. O diretório `src/` não é um workspace separado.

### 4. Rode a aplicação

```bash
npm run dev
```

A aplicação ficará disponível em [http://localhost:9002](http://localhost:9002).

## 🤖 Fluxos locais com Genkit

As dependências e scripts do Genkit também ficam centralizados na raiz do projeto.

```bash
npm run genkit:dev
npm run genkit:watch
```

Esses comandos usam `src/ai/dev.ts` como ponto de entrada.

## 🧪 Comandos úteis

```bash
npm run typecheck
npm run lint
npm run build
npm run ci:build
```

## 📄 Licença

Este projeto é de código aberto e está disponível para uso e modificação.

## 🙏 Créditos

Desenvolvido com ❤️ por **ArthurM**.
