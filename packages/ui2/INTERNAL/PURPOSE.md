O propósito do ui2: transformar a semântica do design system em componentes executáveis, acessíveis e prontos para uso por humanos e IA.

De forma mais prática, ela existe para resolver 5 coisas:

1. **Virar o contrato público de UI do ttoss**
   Ela materializa em código o que hoje está modelado nos docs: components como camada pública entre tokens e patterns.

2. **Garantir uso correto da semântica**
   O componente não escolhe estilo por “gosto visual”, mas por significado: Entity primeiro (FSL §1), depois Composition (FSL §4) quando estiver em composição.

3. **Consumir theme-v2 de forma consistente**
   A lib não recria tema nem tokens; ela consome apenas semantic tokens do @ttoss/theme2.

4. **Entregar acessibilidade e comportamento por padrão**
   Acessibilidade não entra como ajuste posterior; ela faz parte do contrato do componente.

5. **Ser AI-first de verdade**
   A lib deve ser fácil para Copilot, Claude Code e outras IAs lerem e comporem corretamente, sem inventar variantes, cores ou padrões arbitrários. Ela precisa ser uma gramática executável do sistema.

Em uma frase ainda mais direta:

> A ttoss components deve existir para operacionalizar, em código, a semântica do design system — com consistência, acessibilidade, composição correta e alta legibilidade para IA.

E o que ela não deve ser:

> não deve ser só uma coleção de widgets React nem uma nova camada de theme/styling.
> Ela deve ser o executor oficial do modelo semântico do ttoss.

---
