---
title: 'Guia da Stack ttoss: Desenvolvimento Full-Stack com suporte de IA'
description: Esta cartilha apresenta a stack ttoss, um conjunto de bibliotecas open-source para desenvolvimento full-stack com TypeScript, Node.js e React. Inclui instruções para configurar o ambiente, boas práticas para contribuição, e dicas para usar IA (como GitHub Copilot) para aumentar a produtividade no desenvolvimento de frontend e backend.
authors:
  - Triângulos Tecnologia
tags:
  - software-development
  - open-source
  - typescript
  - node.js
  - react
  - aws
  - github-copilot
  - monorepo
---

# Cartilha de Apresentação da Stack ttoss: Node.js (BackEnd), React (frontend), TypeScript e Uso de IA como suporte da codificação

Bem-vindo à **Cartilha de Apresentação da Stack ttoss**! Este documento, criado pela equipe da Triângulos Tecnologia, tem como objetivo ajudar a comunidade de desenvolvedores a entender, utilizar e contribuir para os projetos open-source da **ttoss**, disponíveis no repositório [ttoss/ttoss](https://github.com/ttoss). Esta versão inclui suporte ao uso de **Inteligência Artificial (IA)**, como o GitHub Copilot, para auxiliar na codificação. Nosso objetivo é facilitar o onboarding de desenvolvedores, explicando a estrutura do monorepo, as tecnologias, a configuração do ambiente, boas práticas de contribuição, e como maximizar a produtividade com IA.

## 1. Sobre a ttoss

A **ttoss** (Triângulos Tecnologia Open-Source Software) é uma organização no GitHub que mantém bibliotecas e ferramentas open-source, organizadas em um **monorepo**. Esses projetos suportam aplicações escaláveis, com foco em **frontend** (React) e **backend** (Node.js com AWS). O repositório principal, `ttoss/ttoss`, é o ponto de partida para explorar a stack, que inclui pacotes como `@ttoss/config`, `@ttoss/forms`, `@ttoss/aws-appsync-backend`, e `@ttoss/dynamodb-cursor-based-pagination`.

### Principais Projetos
A organização possui 14 repositórios, com destaque para:
- **ttoss/ttoss**: Monorepo principal com pacotes reutilizáveis para frontend e backend.
- **ttoss/carlin**: Ferramenta para deploy de aplicações serverless na AWS (arquivado em junho de 2022).
- **ttoss/dynamodb-cursor-based-pagination**: Biblioteca para paginação baseada em cursor no DynamoDB.
- **ttoss/aws-appsync-backend**: Cliente para integração com AWS AppSync no backend.
- **ttoss/monorepo**: Template para criação de monorepos full-stack.

### Estrutura do Monorepo
O repositório `ttoss/ttoss` é um monorepo gerenciado com **Lerna** e **Turbo**, organizando múltiplos pacotes. Cada pacote tem uma funcionalidade específica, como configurações de linting (`@ttoss/eslint-config`), formulários React (`@ttoss/forms`), ou integração com AWS para backend (`@ttoss/aws-appsync-backend`). A configuração de exportações usa o campo `exports` no `package.json` para apontar para arquivos compilados no diretório `dist`.

## 2. Tecnologias e Ferramentas

A stack da **ttoss** é centrada em **TypeScript**, **JavaScript**, e **Node.js**, com suporte a frameworks e serviços modernos para frontend e backend. Aqui estão as principais tecnologias:

- **Node.js**: Runtime para backend, usado em pacotes como `@ttoss/aws-appsync-backend` e `@ttoss/dynamodb-cursor-based-pagination`.
- **TypeScript**: Linguagem principal, com `moduleResolution: NodeNext` para backend e `bundler` para frontend.
- **React**: Usado em pacotes de frontend, como `@ttoss/forms`.
- **AWS**: Integrações com AppSync, DynamoDB, e Lambda para backend.
- **Storybook**: Ferramenta para desenvolvimento e visualização de componentes frontend.
- **Lerna**: Gerencia versionamento e publicação com `@lerna-lite/version`.
- **Turbo**: Orquestra tarefas entre pacotes (ex.: `^build`).
- **ESLint e Prettier**: Configurações padronizadas via `@ttoss/config`.
- **Husky e Lint-Staged**: Ganchos de Git para qualidade de código.
- **Jest**: Testes unitários e de integração, incluindo APIs backend.
- **tsup**: Empacotamento de projetos TypeScript.
- **GitHub Copilot**: Ferramenta de IA para autocompletar código, gerar testes, e sugerir melhorias.

## 3. Configurando o Ambiente

Para usar ou contribuir com a **ttoss**, incluindo backend com **Node.js** e suporte a IA, siga os passos abaixo.

### Pré-requisitos
- **Node.js**: Versão 16 ou superior (recomendado: LTS, atualmente 20.x).
- **pnpm**: Gerenciador de pacotes para o monorepo.
- **Git**: Para clonar o repositório.
- **AWS CLI**: Para projetos backend com AWS.
- **AWS Credentials**: Configure via `~/.aws/credentials` ou variáveis de ambiente.
- **Visual Studio Code**: Recomendado para usar GitHub Copilot.
- **GitHub Copilot**: Assinatura ativa e extensão instalada no VSCode.

### Passos para Configuração
1. **Clone o repositório**:
   ```bash
   git clone https://github.com/ttoss/ttoss.git
   cd ttoss
   ```
2. **Instale dependências**:
   ```bash
   pnpm install
   ```
3. **Execute o build de configuração**:
   ```bash
   pnpm build-config
   ```
4. **Configure o ambiente backend**:
   - Instale o AWS SDK:
     ```bash
     pnpm add aws-sdk
     ```
   - Configure credenciais AWS:
     ```bash
     aws configure
     ```
5. **Teste um pacote backend** (ex.: `@ttoss/aws-appsync-backend`):
   ```typescript
   import { AwsAppSyncBackend, AUTH_TYPE, gql } from '@ttoss/aws-appsync-backend';

   const client = new AwsAppSyncBackend({
     url: 'SUA_URL_APPSYNC',
     region: 'us-east-1',
     auth: { type: AUTH_TYPE.API_KEY, apiKey: 'SUA_API_KEY' },
   });

   const query = gql`
     query {
       hello
     }
   `;

   client.query({ query }).then((result) => console.log(result));
   ```
   Execute com:
   ```bash
   npx ts-node test-backend.ts
   ```
6. **Inicie o Storybook (opcional, para frontend)**:
   ```bash
   pnpm storybook
   ```

### Configuração do GitHub Copilot no VSCode
Para usar IA com GitHub Copilot no desenvolvimento da **ttoss**, siga estas etapas:
1. **Instale a extensão Copilot**:
   - No VSCode, vá para a aba de extensões (Ctrl+Shift+X).
   - Pesquise por **GitHub Copilot** e instale a extensão oficial.
   - Faça login com sua conta GitHub e autorize o acesso.
2. **Habilite o Copilot**:
   - Abra as configurações do VSCode (Ctrl+,).
   - Certifique-se de que `github.copilot.enable` está ativado para `*`, `typescript`, e `javascript`:
     ```json
     {
       "github.copilot.enable": {
         "*": true,
         "plaintext": false,
         "markdown": true,
         "typescript": true,
         "javascript": true
       }
     }
     ```
3. **Crie um arquivo `copilot-instructions.md`**:
   - No diretório raiz do monorepo, crie um arquivo `copilot-instructions.md` para fornecer contexto ao Copilot:
     ```markdown
     # Instruções para GitHub Copilot

     Este é o monorepo da **ttoss**, um conjunto de pacotes TypeScript para frontend (React) e backend (Node.js com AWS). Aqui estão as diretrizes para usar o Copilot:

     - **Linguagens**: Priorize TypeScript com `moduleResolution: NodeNext` para backend e `bundler` para frontend.
     - **Pacotes**:
       - `@ttoss/config`: Configurações para ESLint, Prettier, Jest, e tsup.
       - `@ttoss/aws-appsync-backend`: Cliente para AWS AppSync.
       - `@ttoss/dynamodb-cursor-based-pagination`: Paginação no DynamoDB.
     - **Estrutura**: Use o campo `exports` no `package.json` para apontar para `dist`.
     - **Testes**: Escreva testes com Jest, cobrindo casos de frontend e backend.
     - **Commits**: Siga o padrão Conventional Commits (ex.: `feat: add new endpoint`).
     - **AWS**: Configure credenciais via `aws configure` para pacotes backend.

     **Exemplo de Prompt**:
     - "Escreva uma função TypeScript para consultar uma tabela DynamoDB usando `@ttoss/dynamodb-cursor-based-pagination`."
     - "Gere um componente React com `@ttoss/forms` para um formulário de login."
     ```
   - O Copilot usará este arquivo para sugerir código mais relevante.
4. **Otimize as configurações**:
   - Habilite sugestões inline: `editor.inlineSuggest.enabled: true`.
   - Ajuste o delay das sugestões, se necessário:
     ```json
     {
       "github.copilot.advanced": {
         "inlineSuggestDelay": 100
       }
     }
     ```

### Configuração de Testes
Configure o Jest com `tsconfig.test.json`:
```json
{
  "extends": "@ttoss/config/tsconfig.test.json",
  "include": ["**/*.test.ts", "**/*.test.tsx"]
}
```
Execute testes:
```bash
pnpm test
```

### Configuração do TypeScript para Backend
Use `moduleResolution: NodeNext`:
```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## 4. Boas Práticas para Contribuição

Para garantir a qualidade das contribuições, incluindo backend com Node.js e uso de IA, siga estas práticas:

### Estrutura de Commits
- Use **Conventional Commits**:
  - Exemplo: `feat(aws-appsync-backend): add mutation support` ou `fix: handle DynamoDB errors`.
  - Para mudanças quebrantes: `BREAKING CHANGE: new schema requires updated client`.
- Configure **Husky** e **Lint-Staged**:
  ```bash
  pnpm set-script prepare "husky install"
  pnpm run prepare
  pnpm husky add .husky/commit-msg "pnpm commitlint --edit"
  pnpm husky add .husky/pre-commit "pnpm lint-staged"
  ```

### Estrutura de Código
- **Pacotes Backend**: Use `moduleResolution: NodeNext`. Exemplo de `package.json`:
  ```json
  {
    "name": "@ttoss/example-backend",
    "exports": {
      ".": {
        "import": "./dist/esm/index.js",
        "require": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    },
    "publishConfig": {
      "access": "public"
    }
  }
  ```
- **ESLint e Prettier**: Use `@ttoss/config`. Acompanhe [#526](https://github.com/ttoss/ttoss/issues/526) para ESLint v9.
- **Testes**: Escreva testes Jest para frontend e backend:
  ```typescript
  import { paginate } from '@ttoss/dynamodb-cursor-based-pagination';

  test('should paginate DynamoDB table', async () => {
    const result = await paginate({
      tableName: 'TestTable',
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: { ':pk': 'user#123' },
    });
    expect(result.items).toBeDefined();
  });
  ```

### Fluxo de Contribuição
1. **Crie uma branch**:
   ```bash
   git checkout -b feat/backend-support
   ```
2. **Desenvolva e teste**:
   - Use Copilot para sugestões de código.
   - Teste APIs backend com `pnpm test`.
   - Use Storybook para frontend (`pnpm storybook`).
3. **Envie um Pull Request (PR)**:
   - Adicione labels como `@ttoss/aws-appsync-backend` ou `backend`.
   - Solicite revisão (ex.: `RayzaOliveira`).
   - Habilite auto-merge (squash).
4. **Resolva conflitos**:
   - Verifique caracteres Unicode ocultos.
   - Aplique feedback do PR.

## 5. Usando IA para Codificação

A **ttoss** incentiva o uso de ferramentas de IA, como o **GitHub Copilot**, para aumentar a produtividade e a qualidade do código. Abaixo estão dicas, sugestões e boas práticas para integrar IA ao desenvolvimento na stack **ttoss**.

### Configuração do GitHub Copilot
- **Ative sugestões contextuais**: Use o arquivo `copilot-instructions.md` (descrito acima) para fornecer contexto específico ao Copilot.
- **Habilite Copilot Chat**:
  - Instale a extensão **GitHub Copilot Chat** no VSCode.
  - Use comandos como `/explain` para entender trechos de código ou `/fix` para corrigir erros.
- **Atalhos úteis**:
  - `Alt+\`: Ativa sugestões inline.
  - `Ctrl+Enter`: Abre o painel de sugestões do Copilot.
- **Personalize prompts**:
  - Crie um arquivo `.vscode/settings.json` para prompts específicos:
    ```json
    {
      "github.copilot.advanced": {
        "context": "Use TypeScript with NodeNext for backend and follow @ttoss/config conventions."
      }
    }
    ```

### Boas Práticas com IA
- **Escreva prompts claros**:
  - Exemplo: "Gere uma função TypeScript para consultar DynamoDB usando `@ttoss/dynamodb-cursor-based-pagination` com paginação de 10 itens."
  - Resultado esperado:
    ```typescript
    import { paginate } from '@ttoss/dynamodb-cursor-based-pagination';
    import AWS from 'aws-sdk';

    async function fetchPaginatedItems(pk: string) {
      const dynamodb = new AWS.DynamoDB.DocumentClient();
      return await paginate({
        dynamodb,
        tableName: 'YourTable',
        keyConditionExpression: 'pk = :pk',
        expressionAttributeValues: { ':pk': pk },
        limit: 10,
      });
    }
    ```
- **Valide sugestões do Copilot**:
  - Sempre revise o código gerado para garantir conformidade com `@ttoss/config` (ESLint/Prettier).
  - Execute `pnpm test` para validar funcionalidades.
- **Use IA para testes**:
  - Peça ao Copilot para gerar testes Jest:
    ```typescript
    // Prompt: "Escreva um teste Jest para uma função que usa @ttoss/aws-appsync-backend"
    import { AwsAppSyncBackend, AUTH_TYPE, gql } from '@ttoss/aws-appsync-backend';

    test('should query AppSync', async () => {
      const client = new AwsAppSyncBackend({
        url: 'mock-url',
        region: 'us-east-1',
        auth: { type: AUTH_TYPE.API_KEY, apiKey: 'mock-key' },
      });
      const query = gql`query { hello }`;
      const result = await client.query({ query });
      expect(result.data).toHaveProperty('hello');
    });
    ```
- **Automatize tarefas repetitivas**:
  - Use Copilot para criar scripts de build, configurações de `package.json`, ou queries GraphQL.
  - Exemplo: "Gere um script Turbo para rodar testes em paralelo."
    ```json
    {
      "turbo": {
        "pipeline": {
          "test": {
            "dependsOn": ["^build"],
            "outputs": []
          }
        }
      }
    }
    ```
- **Evite dependência excessiva**:
  - Use IA para acelerar o desenvolvimento, mas entenda o código gerado.
  - Combine sugestões do Copilot com a documentação da **ttoss** (ex.: [ttoss.dev](https://ttoss.dev)).

### Sugestões de Prompts para Copilot
- **Backend**:
  - "Crie uma função TypeScript para criar um item no DynamoDB com `@ttoss/dynamodb-cursor-based-pagination`."
  - "Gere um endpoint GraphQL com `@ttoss/aws-appsync-backend` para uma mutation."
- **Frontend**:
  - "Escreva um componente React com `@ttoss/forms` para um formulário de cadastro."
  - "Crie uma história Storybook para um componente de botão."
- **Testes**:
  - "Gere um teste Jest para validar a paginação do DynamoDB."
  - "Crie um teste para um componente React com `@ttoss/forms`."
- **Configurações**:
  - "Configure um `tsconfig.json` para Node.js com `moduleResolution: NodeNext`."
  - "Gere um arquivo ESLint baseado em `@ttoss/config`."

### Dicas Adicionais
- **Itere com Copilot**: Se a sugestão não for ideal, refine o prompt com mais detalhes (ex.: "Inclua tratamento de erros").
- **Use Copilot para documentação**: Peça para gerar JSDoc ou comentários explicativos:
  ```typescript
  // Prompt: "Adicione JSDoc a esta função"
  /**
   * Fetches paginated items from DynamoDB using cursor-based pagination.
   * @param pk - Partition key for the query.
   * @param limit - Number of items per page (default: 10).
   * @returns Paginated items and cursor for next page.
   */
  async function fetchPaginatedItems(pk: string, limit = 10) {
    // ...
  }
  ```
- **Combine com outras IAs**: Além do Copilot, use ferramentas como **Grok** (disponível em [grok.com](https://grok.com)) para responder perguntas complexas ou validar arquiteturas.

## 6. Dicas para a Comunidade

- **Teste Backend Localmente**: Use Postman ou scripts Node.js para testar APIs.
- **Explore o Storybook**: Execute `pnpm storybook` para visualizar componentes.
- **Use IA com moderação**: Combine sugestões do Copilot com revisões manuais.
- **Participe das Discussões**: Use [ttoss/ttoss Discussions](https://github.com/ttoss/ttoss/discussions).
- **Reporte Issues**: Registre bugs ou sugestões em [ttoss/ttoss Issues](https://github.com/ttoss/ttoss/issues).
- **Contribua com Exemplos**: Adicione exemplos para backend e IA, como em `dynamodb-cursor-based-pagination/examples`.

## 7. Contato e Suporte

- **GitHub Discussions**: [ttoss/ttoss Discussions](https://github.com/ttoss/ttoss/discussions).
- **Issues**: [ttoss/ttoss Issues](https://github.com/ttoss/ttoss/issues).
- **Comunidade**: Siga as diretrizes em [ttoss.dev](https://ttoss.dev).

## 8. Licenças

A maioria dos projetos usa a licença **MIT**, exceto `ttoss/carlin` (**GPL-3.0**). Verifique o arquivo `LICENSE` de cada repositório.

---

Obrigado por contribuir com a **ttoss**! Estamos animados para ver suas ideias e projetos full-stack com suporte de IA!