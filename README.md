# MangaTrack: Seu Organizador de Mangás, Manhwas e Webtoons

MangaTrack é uma aplicação web moderna, rápida e responsiva, projetada para ajudar você a organizar e acompanhar o progresso de leitura de todos os seus mangás, manhwas, webtoons e novels em um único lugar. Com uma interface limpa e foco na experiência do usuário, nunca mais perca o fio da meada em suas leituras.

A aplicação é um **Progressive Web App (PWA)**, o que significa que pode ser instalada em seu celular ou desktop para uma experiência mais próxima a um aplicativo nativo.

## ✨ Recursos Principais

- **Biblioteca Pessoal:** Adicione títulos à sua biblioteca e organize-os por status: "Lendo", "Planejo Ler" ou "Completo".
- **Busca Online Inteligente:** Encontre novos títulos buscando em múltiplas fontes populares, como MyAnimeList (via Jikan), Kitsu e AniList.
- **Acompanhamento de Progresso:** Marque facilmente os capítulos lidos e visualize seu progresso com barras de porcentagem.
- **Estatísticas Visuais:** Tenha insights sobre seus hábitos de leitura com gráficos que mostram a distribuição de gêneros e o status dos seus títulos.
- **Sincronização na Nuvem:** Crie uma conta com e-mail e senha para ter sua biblioteca sincronizada e acessível em qualquer dispositivo através do Firebase.
- **Modo Offline:** Prefere não criar uma conta? Use o modo anônimo e seus dados serão salvos localmente no seu navegador.
- **Backup e Restauração:** No modo offline, você pode exportar sua biblioteca para um arquivo JSON e restaurá-la a qualquer momento.
- **Design Responsivo e Moderno:** Interface otimizada para uma experiência de uso agradável tanto em desktops quanto em dispositivos móveis (Android/iOS).
- **Tema Claro e Escuro:** Alterne entre os temas para uma leitura mais confortável a qualquer hora do dia.
- **Instalável (PWA):** Adicione o MangaTrack à tela inicial do seu dispositivo para acesso rápido e uma experiência de tela cheia.

## 🚀 Tecnologias Utilizadas

O MangaTrack foi construído com um conjunto de tecnologias moderno e escalável, focado em performance e qualidade de desenvolvimento.

- **Framework:** [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/)
- **Backend e Banco de Dados:** [Firebase](https://firebase.google.com/) (Authentication para usuários e Firestore como banco de dados NoSQL)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Progressive Web App (PWA):** [next-pwa](https://www.npmjs.com/package/next-pwa)
- **Validação de Formulários:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## ⚙️ Como Executar o Projeto Localmente

Para executar o MangaTrack em seu ambiente de desenvolvimento, siga os passos abaixo.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### 1. Clone o Repositório

```bash
git clone https://github.com/SEU_USUARIO/mangatrack.git
cd mangatrack
```

### 2. Configure as Variáveis de Ambiente

A aplicação não possui mais nenhuma configuração Firebase embutida no código versionado. O arquivo `src/firebase/config.ts` apenas monta o objeto `firebaseConfig` a partir de variáveis `process.env.NEXT_PUBLIC_FIREBASE_*`, e `src/firebase/index.ts` interrompe a inicialização caso alguma variável obrigatória esteja ausente.

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto. Em outros ambientes compatíveis com Next.js, como CI ou produção, configure as mesmas variáveis diretamente no provedor de hospedagem.

**Variáveis obrigatórias:**

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="12345..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:12345...:web:abcdef..."
```

> Se qualquer uma dessas variáveis estiver ausente, a aplicação lançará um erro em tempo de execução informando exatamente quais chaves precisam ser definidas.

### 3. Migração da Configuração Antiga

Se você utilizava um ambiente Firebase fixo em `src/firebase/config.ts`, migre esses valores para o ambiente antes de atualizar:

1. Copie os valores antigos do Firebase para um arquivo local `.env.local`.
2. Em produção, cadastre os mesmos valores como variáveis de ambiente no seu provedor.
3. Remova qualquer credencial hardcoded remanescente do código versionado.
4. Reinicie o servidor de desenvolvimento ou refaça o deploy para que o Next.js recarregue as variáveis.

### 4. Instale as Dependências

Na raiz do projeto, execute o comando para instalar todos os pacotes necessários:

```bash
npm install
```

### 5. Rode o Servidor de Desenvolvimento

Com tudo configurado, inicie a aplicação:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:9002](http://localhost:9002).

## 📄 Licença

Este projeto é de código aberto e está disponível para uso e modificação.

## 🙏 Créditos

Desenvolvido com ❤️ por **ArthurM**.
