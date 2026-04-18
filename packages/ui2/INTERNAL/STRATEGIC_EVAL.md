Perfeito. A segunda matriz deve medir **vantagem estratégica do ttoss**, não baseline de mercado. Então ela deve excluir o que já entrou na matriz de paridade — acessibilidade geral, cobertura de catálogo, compatibilidade, bundle, docs genéricas, manutenção — e focar só no que torna o seu package especial: **semântica executável, disciplina de tokens, composição formal, multi-theme sem drift, authoring de composites e legibilidade para IA/agentes**.

A base conceitual para isso é sólida. O DTCG posiciona design tokens como formato para troca e escala entre ferramentas, o que justifica medir **disciplina e portabilidade de tokens**. Open UI trabalha justamente com **semântica, anatomia e diferenciação conceitual entre componentes** como menu, tabs, switch e combobox, o que sustenta medir **clareza semântica e composição formal**. E o GitHub Copilot já suporta instruções de repositório, `AGENTS.md`, custom agents e skills, enquanto `llms.txt` existe especificamente para ajudar LLMs a usar documentação em tempo de inferência; isso justifica tratar **AI-readiness** como um eixo formal de produto, não como bônus.

## Strategic Advantage Score — matriz formal do valor do ttoss

Use a mesma escala da outra matriz:

- **0** = inexistente ou falho
- **1** = muito fraco
- **2** = abaixo do necessário
- **3** = bom / funcional
- **4** = forte
- **5** = excelente / diferenciador real

Fórmula: **score ponderado = (nota ÷ 5) × peso**.

## Matriz

| Critério estratégico                                             | Peso | O que medir                                                                                     | Como avaliar/medir, de forma concisa e pragmática                                                                                                                                                                                       | Evidência mínima                                         |
| ---------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **1. Integridade do contrato semântico**                         |   20 | Se o sistema mantém significado estável entre token → componente → composição                   | Rode 10 cenários canônicos e conte: quantas vezes o time precisou inventar variant visual, renomear semântica localmente ou decidir “no feeling”. Métrica principal: **% de cenários resolvidos semânticamente sem ambiguidade local**  | Checklist por cenário + diff de API/props                |
| **2. Disciplina de tokens e indirection correta**                |   15 | Se components e composites consomem semantic tokens de forma consistente, sem bypass estrutural | Faça auditoria estática em `ui2` e em 3 composites reais. Conte: usos de raw/core token, CSS hardcoded, valores soltos. Métrica: **bypass rate por 1.000 linhas** e **% de estilos via semantic token**                                 | grep/rule report + exemplos de código                    |
| **3. Poder de composição formal (`Responsibility → Host.Role`)** |   15 | Se o modelo de composição resolve casos reais sem explodir em variants e if/switch              | Teste 5 hosts reais, como ActionSet, FieldFrame, ItemFrame e SurfaceFrame. Meça: número de casos resolvidos por contexto em vez de props visuais arbitrárias. Métrica: **% de composições resolvidas por contrato, não por override**   | Stories + exemplos de composites + contagem de overrides |
| **4. Robustez multi-theme sem drift semântico**                  |   15 | Se o significado do componente permanece o mesmo ao trocar tema/mode/brand                      | Rode a mesma bateria em uma matriz de tema: brand A/B, light/dark, densidade e contraste. Meça: quantos casos mudam de aparência de forma esperada vs. quantos mudam de significado ou exigem exceção. Métrica: **semantic drift rate** | Grid de screenshots + lista de exceções                  |
| **5. Authoring leverage para composites locais**                 |   12 | Se apps conseguem criar composites locais robustos sem sair do sistema                          | Peça para criar 5 composites reais usando só `@ttoss/ui2` + authoring helpers. Meça: linhas extras de glue code, CSS ad hoc, wrappers descartáveis e escapes do modelo. Métrica: **tempo até composite correto** e **override burden**  | PRs de exemplo + tempo por tarefa                        |
| **6. AI/agent executability**                                    |   12 | Se Copilot/Claude/etc. conseguem usar o ecossistema corretamente sem inferir semântica errada   | Rode uma suíte fixa de prompts: criar dialog, field, menu item, composite local, trocar tema, migrar raw token. Meça: **first-pass success rate**, **taxa de erro semântico**, **número de correções humanas**                          | Logs de prompts + diffs + rubric de avaliação            |
| **7. Evolvabilidade arquitetural**                               |    6 | Se o sistema suporta mudança sem ripple effect excessivo                                        | Faça 4 mudanças controladas: trocar token family, ajustar naming semântico, mudar host role, introduzir novo theme dimension. Meça: arquivos tocados, componentes impactados e quebras. Métrica: **change blast radius**                | Relatório de impacto por mudança                         |
| **8. Clareza de boundary entre component, composite e app**      |    5 | Se o sistema evita promoção prematura e evita “componentização” do que deveria ser local        | Revise 10 casos recentes. Classifique: deveria ser component público, composite oficial ou local app layer? Métrica: **taxa de classificação coerente entre avaliadores** e **número de promoções prematuras**                          | Rubric de classificação + revisão por 2 pessoas          |

## Pesos e lógica

O peso mais alto fica em **integridade semântica** porque esse é o centro do valor do ttoss. O segundo bloco forte é **tokens + composição + multi-theme**, porque o ganho do sistema depende de o significado sobreviver à implementação e à troca de tema. **AI/agent executability** recebe peso alto, mas não máximo, porque ele é consequência da estrutura correta, não substituto dela. Tudo isso é coerente com o papel que standards e tooling já estão assumindo: DTCG para intercâmbio/escala de tokens, Open UI para semântica e anatomia, e GitHub/`llms.txt` para legibilidade operacional por agentes. ([Design Tokens][1])

## Planilha pronta para preencher

| Library              | Integridade semântica (20) | Disciplina de tokens (15) | Composição formal (15) | Multi-theme sem drift (15) | Authoring de composites (12) | AI/agent executability (12) | Evolvabilidade (6) | Boundary clarity (5) | Total /100 | Confiança  |
| -------------------- | -------------------------: | ------------------------: | ---------------------: | -------------------------: | ---------------------------: | --------------------------: | -----------------: | -------------------: | ---------: | ---------- |
| **React Aria**       |                        3.5 |                       2.0 |                    4.5 |                        3.0 |                          4.5 |                         5.0 |                4.0 |                  4.5 |   **74.6** | alta       |
| **Ark UI**           |                        3.0 |                       2.5 |                    3.5 |                        2.5 |                          4.0 |                         4.0 |                4.5 |                  4.0 |   **66.1** | média-alta |
| **Base UI**          |                        3.0 |                       2.5 |                    3.5 |                        2.5 |                          4.0 |                         4.0 |                4.0 |                  4.0 |   **65.5** | média      |
| **Radix Primitives** |                        2.5 |                       2.0 |                    3.0 |                        3.0 |                          3.5 |                         2.0 |                3.5 |                  3.5 |   **54.9** | média-alta |
| **Headless UI**      |                        2.0 |                       1.5 |                    2.0 |                        2.0 |                          2.5 |                         1.5 |                2.5 |                  2.5 |   **39.6** | média      |

## Rubrica curta para atribuir nota

**0–1**
O sistema não sustenta o critério sem hacks constantes. O significado ou se perde, ou depende da cabeça do time.

**2**
Funciona parcialmente, mas com atrito alto, ambiguidade ou exceções frequentes.

**3**
Resolve bem o caso normal, mas ainda apresenta escapes importantes ou baixa consistência.

**4**
Resolve de forma forte e repetível, com poucas exceções e boa previsibilidade.

**5**
O critério é claramente uma vantagem do sistema, com baixo custo operacional e alta confiabilidade.

## Regras para não contaminar esta matriz com a de paridade

Não use aqui:

- número de componentes
- cobertura geral de catálogo
- WCAG/a11y baseline
- SSR/browser support
- bundle size genérico
- docs genéricas
- cadência de release

Esses itens já pertencem à **matriz de paridade de mercado**. Aqui só entra o que mede **o quanto o ttoss transforma design tokens + semântica + composição em um sistema melhor de construir, evoluir e usar com agentes**.
