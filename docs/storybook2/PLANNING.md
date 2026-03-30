Eu faria **um Storybook de sistema em `docs/storybook2`**, não apenas “um Storybook do `ui2`”.

A melhor implementação para o seu caso é tornar o `storybook2` o **hub oficial de integração** entre `@ttoss/theme2` (theme-v2) e `@ttoss/ui2`. O motivo é simples: o valor do ttoss não está só no componente isolado, mas na integração entre **semantic tokens**, **component semantics** e **composição**. Isso está no centro dos seus docs: components são a camada pública acima de semantic tokens e abaixo de patterns; consomem apenas semântica; e o modelo real é `Responsibility → Host.Role`.

## Recomendação principal

Use **Storybook 10 + React/Vite**, **se o monorepo já estiver ESM-ready**. Hoje o Storybook 10 é a versão atual, e a própria documentação destaca que ele é **ESM-only**; para React com Vite, há framework oficial e integração direta. Se o repo ainda não estiver pronto para ESM-only, eu começaria com Storybook 9 e planejava a migração logo depois. ([Storybook][1])

## O que o Storybook do ttoss deve otimizar

Ele deve servir a quatro objetivos ao mesmo tempo:

1. **DX para desenvolver e inspecionar componentes**
   Storybook é exatamente um workshop para construir, testar e documentar UI em isolamento. ([Storybook][2])

2. **Expor o modelo semântico do ttoss, não só o visual**
   O Storybook precisa mostrar `Responsibility`, `Host.Role`, slots e tokens usados, porque o valor do sistema está em “meaning first”, não em um catálogo visual plano.

3. **Testar o `theme-v2` de verdade**
   Como o seu sistema depende de semantic tokens e múltiplos temas, Storybook deve ser um laboratório de **troca de tema**, **modo**, **densidade**, **motion**, **background** e **container size**, não só uma galeria. Components nunca devem consumir core tokens diretamente.

4. **Transformar stories em documentação viva e em testes**
   O Storybook hoje cobre Docs, component tests, interaction tests, a11y e visual tests a partir das próprias stories. ([Storybook][3])

## A arquitetura que eu adotaria

### 1) Um Storybook de sistema em `docs/storybook2`

Estrutura sugerida:

```txt
docs/storybook2/
  .storybook/
    main.ts
    preview.tsx
    manager.ts
  src/
    docs/
      TtossDocsPage.mdx
      FoundationsPage.mdx
    addons/
      ttoss-semantic/
    stories/
      foundations/
      components/
      composition/
      composites/
      sandbox/
```

Isso deixa o Storybook como o lugar oficial para validar **integração** entre packages, sem acoplar a infra de docs/testes a um único pacote. O foco deste plano é **exclusivamente** fazer o melhor `storybook2` possível para `ui2` e `theme-v2`/`@ttoss/theme2`. ([Storybook][4])

### 2) Um `preview.tsx` que simula o runtime real do ttoss

O Storybook deve envolver todas as stories com o **mesmo `ThemeProvider` do `theme-v2`** que a aplicação usa. Para controlar isso, use **globals + toolbar + decorators**. O Storybook tem suporte nativo a toolbar items que alimentam “globals”, e decorators podem ler esses globals para controlar a renderização. ([Storybook][5])

Eu colocaria pelo menos estes globals:

- `brand`
- `mode` (`light` / `dark` / outros)
- `density`
- `motion` (`normal` / `reduced`)
- `direction` (`ltr` / `rtl`, se fizer sentido)
- `container` (`narrow` / `default` / `wide` / `full`)

Para **tema**, há dois caminhos:

- se o `theme-v2` troca tema por **classe** ou **data-attribute**, use `@storybook/addon-themes` com `withThemeByClassName` ou `withThemeByDataAttribute`; o addon oficial já suporta ambos; ([Storybook][6])
- se o `theme-v2` depende de provider/react runtime, use os **globals** e um **decorator customizado** que injeta o provider com os valores selecionados. Isso tende a ser mais fiel ao runtime real do ttoss. ([Storybook][5])

### 3) Não dependa só de viewport: adicione “container testing”

Esse ponto é muito importante para o ttoss.

Seus tokens de **typography**, **spacing** e **sizing** colocam a responsividade no engine de tokens, com forte ênfase em **container queries / cqi** e fallback seguro; os próprios docs pedem `container-type: inline-size`, fallback viewport-safe e consumo sem lógica responsiva no componente.

O addon oficial de **viewport** é útil, mas ele só ajusta o tamanho do iframe. Para o ttoss, isso é insuficiente, porque muito do sistema é **container-first**, não apenas viewport-first. O Storybook oferece viewport para testar responsividade do iframe, mas você deve complementar isso com um **decorator de container redimensionável** ou um **toolbar addon customizado** para largura do container. ([Storybook][7])

Eu faria isso assim:

- cada story é renderizada dentro de um wrapper `.tt-container`
- um global `container` controla a largura máxima desse wrapper
- o usuário consegue alternar `320 / 480 / 768 / 1024 / 1280 / auto`

Isso vai te mostrar o comportamento real dos ramps de `type.ramp.*`, `space.unit`, `size.ramp.*` e `surface.maxWidth`, que é exatamente o que vocês definiram no `theme-v2`.

### 4) Organize a navegação pelo modelo semântico, não pelo visual

Eu não faria uma sidebar plana por componente apenas.

Eu organizaria assim:

- **Foundations**
  - Colors
  - Typography
  - Spacing
  - Sizing
  - Radii
  - Elevation
  - Motion
  - Z-Index

- **Components**
  - Action
  - Input
  - Selection
  - Navigation
  - Disclosure
  - Overlay
  - Feedback
  - Structure

- **Composition**
  - ActionSet
  - FieldFrame
  - ItemFrame
  - SurfaceFrame

- **Composites**
  - exemplos reais de combinação

- **Sandbox / Edge cases**
  - histórias internas, debug, experimentos

Isso reforça o modelo oficial do ttoss: family-first, surface pequena, patterns acima de components, e local application layer como escape hatch controlado.

### 5) Use tags para separar o que é público, interno, teste, sandbox

Storybook tem suporte a **tags** para organização e filtragem da sidebar, inclusive com seleção padrão de inclusão/exclusão. ([Storybook][8])

Eu usaria tags como:

- `public`
- `internal`
- `foundation`
- `semantic`
- `composition`
- `composite`
- `test-only`
- `wip`

E deixaria `internal`, `test-only` e `wip` excluídas por padrão.

Isso ajuda muito porque seu Storybook vai ter mais de uma função: docs, playground, testes e edge cases.

## Como potencializar o modelo semântico dentro do Storybook

### 6) Crie um addon/panel próprio do ttoss

Esse é um dos maiores ganhos que vocês podem ter.

O Storybook expõe **Addon API** para criar **panels**, **toolbars** e outras extensões. Você pode registrar um addon e ler os parâmetros da story atual. ([Storybook][9])

Eu criaria um painel chamado algo como **“ttoss Semantics”** mostrando para cada story:

- `Responsibility`
- `Host`
- `Role`
- foundation tokens envolvidos
- parts/slots do Ark
- observações de acessibilidade
- se a story é standalone, composition ou composite

Para isso, cada story teria um bloco de parâmetros, por exemplo:

```ts
parameters: {
  ttoss: {
    responsibility: 'Action',
    host: 'ActionSet',
    role: 'primary',
    foundations: {
      color: ['action.primary.background.default', 'action.primary.text.default'],
      typography: ['text.label.md'],
      spacing: ['spacing.inset.control.md'],
      sizing: ['hit.default'],
      radii: ['radii.control'],
    },
  },
}
```

Isso transforma o Storybook em uma **interface de inspeção do contrato semântico**, não só em catálogo visual. E ajuda muito IA, DX e revisão humana. ([Storybook][9])

### 7) Tenha uma docs page customizada do ttoss

Autodocs já gera documentação viva a partir das stories e metadados, e pode ser estendido com **MDX** e **Doc Blocks**. Além disso, o Storybook permite customizar a docs page e até criar seus próprios doc blocks. ([Storybook][3])

Eu criaria um template de docs que sempre mostre, nesta ordem:

1. propósito do componente
2. `Responsibility`
3. hosts/roles suportados
4. anatomy/parts do Ark
5. examples
6. controls
7. semantic tokens por foundation
8. accessibility notes
9. compositional examples
10. local composite hints

Ou seja: **docs do ttoss primeiro, autodocs do Storybook depois**.

## Como testar melhor o `theme-v2`

### 8) Faça stories específicas para foundations, não só para components

Como os tokens são o contrato base, eu criaria stories específicas para:

- paletas semânticas por UX/role/dimension/state
- typography semantic scale (`text.display.*`, `text.title.*`, `text.body.*`, etc.)
- spacing decision matrix (`inset`, `gap`, `gutter`, `separation`)
- sizing contracts (`hit.*`, `icon.*`, `identity.*`, `surface.maxWidth`)
- radii, elevation, motion, z-index

Isso reforça que core e semantic tokens são camadas diferentes e que components devem consumir apenas semantic tokens.

### 9) Use backgrounds e grid como ferramentas reais de revisão

O addon de **backgrounds** permite configurar fundos por toolbar ou fixar um fundo em uma story específica; ele também inclui uma opção de **grid** para revisar alinhamento. ([Storybook][10])

No ttoss isso é ótimo para:

- validar contrastes em `light`/`dark`
- testar overlays, panels e surfaces em fundos diferentes
- revisar alinhamento/rhythm das semânticas de spacing
- criar stories fixas “sempre em dark canvas” para componentes que exigem esse contexto

### 10) Use viewport, mas combinado com container toolbar

O viewport oficial continua valioso para cenários gerais e dispositivos comuns. ([Storybook][7])
Mas, de novo, no ttoss ele deve andar junto com um controle de container width para validar a engine responsiva real dos tokens.

## Como transformar stories em teste real

### 11) Use o Vitest addon como base de testes do Storybook

O **Vitest addon** transforma stories em component tests rodando em navegador real e pode calcular coverage; além disso, integra com a11y e visual tests. ([Storybook][11])

Para o ttoss, isso é ideal porque:

- uma story simples já vira render test
- `play` vira interaction test
- a mesma story continua servindo docs + playground + teste

### 12) Use `play` para fluxos do Ark UI

O Storybook trata interaction tests como parte da própria story, com `play function`, e isso pode ser executado na UI, no editor, no CLI e em CI. ([Storybook][12])

Eu usaria `play` principalmente em:

- Dialog
- Menu
- Tabs
- Select / Combobox
- Tooltip / Popover
- Form Field states

Isso é especialmente importante porque o Ark UI resolve comportamento e acessibilidade de primitives complexas; o Storybook vira a forma prática de verificar se a integração do `ui2` preserva esse contrato.

### 13) Ative a11y addon desde o início

O addon oficial de a11y usa axe-core, adiciona painel e controles de simulação, e integra com o Vitest addon. ([Storybook][13])

Como os seus próprios docs definem acessibilidade como parte do contrato do componente, isso não deveria ser opcional no Storybook do `ui2`.

### 14) Use visual tests para regressão de temas e semântica

O addon de visual tests adiciona painel de revisão local e trabalha integrado ao fluxo de testes visuais. ([Storybook][14])

No ttoss, eu usaria isso principalmente para:

- diffs entre temas
- diffs de light/dark
- overlays e z-index layering
- typography/spacing regressions
- Ark parts styled via semântica

## Minha recomendação final

Eu implementaria o Storybook do ttoss assim:

- **`docs/storybook2` como Storybook de sistema oficial para `ui2` + `theme-v2`**
- **Storybook 10 + React/Vite** se o repo já estiver ESM-ready; se não, **9.x como transição** ([Storybook][1])
- `ThemeProvider` real do `theme-v2` no `preview`
- `globals` para `brand`, `mode`, `density`, `motion`, `direction`, `container`
- addon-themes **somente** se o runtime de tema do `theme-v2` for baseado em classe/data-attribute; senão, decorator customizado ([Storybook][6])
- **estrutura da sidebar pelo modelo semântico**
- **stories de foundations + components + composition + composites**
- **custom docs page do ttoss**
- **addon/panel “ttoss Semantics”**
- **viewport + background + grid + container width**
- **Vitest addon + a11y + play functions + visual tests**

Em uma frase:

> **o melhor Storybook para o ttoss não é um catálogo de componentes, mas um laboratório de semântica, tema, composição e testes do sistema.**

## Ajustes críticos para deixar o plano executável

O plano está forte em visão e direção. Para ficar robusto na execução, faltavam alguns pontos objetivos.

### 1) Escopo fixo: foco total em `docs/storybook2`

Este plano **não inclui migração**. O escopo é construir e evoluir o `docs/storybook2` como Storybook principal para os packages `ui2` e `theme-v2`/`@ttoss/theme2`.

- Tudo que for decisão de arquitetura, DX, testes e documentação deve otimizar `docs/storybook2`.
- O plano desconsidera o Storybook antigo para decisões de produto e implementação.

### 2) Alinhamento de naming do pacote de tema

Padronize no plano o nome real do package usado no monorepo: `@ttoss/theme2`.

- Nos textos estratégicos, pode citar “theme-v2” como conceito.
- Nos exemplos técnicos (imports, comandos, dependências), usar `@ttoss/theme2` para evitar ambiguidade.

### 3) Preflight técnico antes de escolher Storybook 10

Antes de fixar a versão, executar um check rápido e registrar no plano:

- ESM readiness dos configs e scripts
- compatibilidade dos addons necessários (themes, a11y, vitest, visual tests)
- compatibilidade com runner escolhido (`react-vite` preferencial)

Critério de decisão:

- se todos os checks passarem: Storybook 10
- se houver bloqueio relevante: Storybook 9 como baseline temporário dentro do `storybook2`, com evolução planejada para 10 no próprio `storybook2`

### 4) Definition of Done com métricas objetivas

Adicionar critérios mensuráveis ligados ao valor de [Design System v2](/docs/design/design-system-v2) e [Component Model](/docs/design/design-system-v2/components/component-model):

- **DX onboarding:** novo dev consegue criar uma story semântica correta em até 30 minutos
- **Semântica:** 100% dos stories públicos com `parameters.ttoss` preenchidos (`responsibility`, e quando aplicável `host`/`role`)
- **Tokens:** 0 ocorrência de consumo direto de core token em stories/components de demonstração
- **Testes:** stories críticas com `play` cobrindo fluxos de overlay/selection/input
- **A11y:** zero violações críticas (axe) nas stories públicas
- **Visual:** baseline aprovado para light/dark + pelo menos 2 temas

### 5) Matriz mínima de testes para facilitar ui2

Para garantir que o Storybook realmente acelera desenvolvimento e testes de `ui2`, incluir uma matriz mínima:

- `components/action`: Button (variants, states, play)
- `components/selection`: Checkbox/Switch (keyboard + checked states)
- `components/overlay`: Tooltip/Dialog (focus trap, escape, click outside)
- `composition/action-set`: primary/secondary/dismiss mapping
- `composition/field-frame`: label/control/description/validation
- `foundations`: color/typography/spacing/sizing com container presets

### 6) Fluxo CI explícito (monorepo)

Registrar um pipeline mínimo para evitar drift entre intenção e execução:

1. Build do storybook de sistema
2. Testes de interação (play)
3. Testes de acessibilidade
4. Testes visuais
5. Lint do monorepo

Comandos sugeridos (ajustar nomes finais de scripts ao implementar):

```bash
pnpm --filter @docs/storybook2 run build
pnpm --filter @docs/storybook2 run test
pnpm --filter @docs/storybook2 run deploy
pnpm run -w lint
```

Scripts sugeridos no `package.json` de storybook2:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build": "storybook build --quiet",
    "deploy": "carlin deploy static-app",
    "test": "storybook test run",
    "dev": "pnpm run storybook"
  }
}
```

### 7) Escopo MVP para reduzir risco

Definir claramente o que entra no primeiro corte:

- 1 página Foundations (colors + typography + spacing)
- 4 componentes de `ui2` (Button, Checkbox, Switch, Tooltip)
- 2 composições (`ActionSet`, `FieldFrame`)
- toolbar globals (`theme`, `mode`, `container`)
- addon/panel semântico em versão inicial (read-only)

Tudo além disso fica como fase 2.

### 8) Governança de evolução

Adicionar no plano uma cadência de revisão quinzenal com três perguntas:

- o Storybook está reduzindo tempo de desenvolvimento?
- está capturando regressões semânticas antes de produção?
- está melhorando a clareza do contrato para humanos e IA?

Se a resposta for "não" em dois ciclos, replanejar escopo e arquitetura.

### 9) Regra de foco deste planning

- Tratar `docs/storybook2` como único alvo de execução.
- Tratar `ui2` + `theme-v2`/`@ttoss/theme2` como núcleo de valor do projeto.
- Evitar decisões condicionadas ao Storybook legado.

## Veredito da análise

O plano está estrategicamente correto e alinhado ao valor do design system (semântica, flexibilidade multibrand, simplicidade de uso). Com os ajustes acima, ele fica também **operacionalmente robusto** para entregar DX/tooling e acelerar o desenvolvimento/testes de `ui2`.

[1]: https://storybook.js.org/?utm_source=chatgpt.com 'Storybook: Frontend workshop for UI development'
[2]: https://storybook.js.org/docs?utm_source=chatgpt.com 'Get started with Storybook | Storybook docs'
[3]: https://storybook.js.org/docs/writing-docs/autodocs 'Automatic documentation and Storybook | Storybook docs'
[4]: https://storybook.js.org/docs/sharing/storybook-composition 'Storybook Composition | Storybook docs'
[5]: https://storybook.js.org/docs/essentials/toolbars-and-globals 'Toolbars & globals | Storybook docs'
[6]: https://storybook.js.org/docs/essentials/themes 'Themes | Storybook docs'
[7]: https://storybook.js.org/docs/essentials/viewport 'Viewport | Storybook docs'
[8]: https://storybook.js.org/docs/writing-stories/tags?utm_source=chatgpt.com 'Tags | Storybook docs'
[9]: https://storybook.js.org/docs/addons/addons-api 'Addon API | Storybook docs'
[10]: https://storybook.js.org/docs/essentials/backgrounds 'Backgrounds | Storybook docs'
[11]: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index 'Vitest addon | Storybook docs'
[12]: https://storybook.js.org/docs/writing-tests/interaction-testing 'Interaction tests | Storybook docs'
[13]: https://storybook.js.org/docs/writing-tests/accessibility-testing 'Accessibility tests | Storybook docs'
[14]: https://storybook.js.org/docs/writing-tests/visual-testing 'Visual tests | Storybook docs'
