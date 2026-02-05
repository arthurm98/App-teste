# MangaTrack: Seu Organizador de Mangás, Manhwas e Webtoons

MangaTrack é uma aplicação web moderna, rápida e responsiva, projetada para ajudar você a organizar e acompanhar o progresso de leitura de todos os seus mangás, manhwas, webtoons e novels em um único lugar. Com uma interface limpa e foco na experiência do usuário, nunca mais perca o fio da meada em suas leituras.

A aplicação é um **Progressive Web App (PWA)**, o que significa que pode ser instalada em seu celular ou desktop para uma experiência mais próxima a um aplicativo nativo.

## ✨ Recursos Principais

- **Biblioteca Pessoal:** Adicione títulos à sua biblioteca e organize-os por status: "Lendo", "Planejo Ler" ou "Completo".
- **Busca Online:** Encontre novos títulos buscando na API pública do Jikan (MyAnimeList).
- **Acompanhamento de Progresso:** Marque facilmente os capítulos lidos e visualize seu progresso com barras de porcentagem.
- **Estatísticas Visuais:** Tenha insights sobre seus hábitos de leitura com gráficos que mostram a distribuição de gêneros e o status dos seus títulos.
- **Sincronização na Nuvem (Opcional):** Crie uma conta com e-mail e senha para ter sua biblioteca sincronizada e acessível em qualquer dispositivo através do Firebase.
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
- **Backend e Banco de Dados (Opcional):** [Firebase](https://firebase.google.com/) (Authentication para usuários e Firestore como banco de dados NoSQL)
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

### 2. Configure as Variáveis de Ambiente (Opcional)

Por padrão, a aplicação rodará em **modo local**, salvando os dados no seu navegador. Para ativar a sincronização na nuvem com o Firebase, você precisa configurar as credenciais.

1.  **Crie um Projeto Firebase:**
    *   Acesse o [console do Firebase](https://console.firebase.google.com/) e crie um novo projeto.
    *   Adicione um aplicativo da Web ao seu projeto.
    *   Nas configurações do projeto, encontre suas credenciais de configuração do Firebase.

2.  **Crie o arquivo `.env`:**
    *   Crie um arquivo chamado `.env` na raiz do projeto e adicione suas credenciais.

**Conteúdo do arquivo `.env`:**
```
# Credenciais do Firebase (Opcional, para login com e-mail e sincronização na nuvem)
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="12345..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:12345...:web:abcdef..."
```

> **Atenção:** O arquivo `src/firebase/config.ts` utiliza as variáveis do Firebase. Se elas não estiverem presentes, o app funcionará no modo local/offline.

### 3. Instale as Dependências

Na raiz do projeto, execute o comando para instalar todos os pacotes necessários:

```bash
npm install
```

### 4. Rode o Servidor de Desenvolvimento

Com tudo configurado, inicie a aplicação:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:9002](http://localhost:9002).

## 📄 Licença

Este projeto é de código aberto e está disponível para uso e modificação.

## 🙏 Créditos

Desenvolvido com ❤️ por **ArthurM**.
