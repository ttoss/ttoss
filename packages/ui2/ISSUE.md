## 12 Componentes

### Selection — 4 componentes (maior matriz de interações)

| #   | Componente   | RAC base                         | entity    | interaction     | evaluations                                       |
| --- | ------------ | -------------------------------- | --------- | --------------- | ------------------------------------------------- |
| 1   | `Checkbox`   | `Checkbox`                       | Selection | `toggle.binary` | primary · secondary · muted · positive · negative |
| 2   | `Switch`     | `Switch`                         | Selection | `toggle.binary` | primary (simpler variant sem negative/positive)   |
| 3   | `RadioGroup` | `RadioGroup` + `Radio`           | Selection | `select.single` | primary · secondary · muted                       |
| 4   | `Select`     | `Select` + `ListBox` + `Popover` | Selection | `select.single` | primary · secondary · muted                       |

> Selection usa `vars.colors.input.*` + `vars.border.selected.*` — única entidade com coluna **Border** dupla.

---

### Disclosure — 1 componente

| #   | Componente     | RAC base                         | entity     | interaction       | evaluations     |
| --- | -------------- | -------------------------------- | ---------- | ----------------- | --------------- |
| 5   | ✅ `Accordion` | `Disclosure` + `DisclosurePanel` | Disclosure | `disclose.toggle` | primary · muted |

> Usa `vars.motion.transition.*` (não `feedback`), diferença crítica vs Action/Input.

---

### Feedback — 2 componentes

| #   | Componente       | RAC base                | entity   | interaction | evaluations                             |
| --- | ---------------- | ----------------------- | -------- | ----------- | --------------------------------------- |
| 6   | ✅ `ProgressBar` | `ProgressBar`           | Feedback | —           | primary · positive · caution · negative |
| 7   | ✅ `Toast`       | `ToastRegion` + `Toast` | Feedback | `dismiss`   | primary · positive · caution · negative |

> Primeiro uso de `vars.elevation.raised` e `vars.colors.feedback.*`. Revela se as scales de cores existem para todos os 4 evaluations.

---

### Collection — 2 componentes

| #   | Componente | RAC base                  | entity     | interaction              | evaluations     |
| --- | ---------- | ------------------------- | ---------- | ------------------------ | --------------- |
| 8   | `ListBox`  | `ListBox` + `ListBoxItem` | Collection | — (read)                 | primary · muted |
| 9   | `TagGroup` | `TagGroup` + `Tag`        | Collection | `select.multi` (via RAC) | primary · muted |

> TagGroup é o único caso onde Collection tem interação implícita — exercita a fronteira entity/interaction.

---

### Structure — 2 componentes

| #   | Componente  | RAC base    | entity    | interaction | evaluations     |
| --- | ----------- | ----------- | --------- | ----------- | --------------- |
| 10  | `Separator` | `Separator` | Structure | —           | primary · muted |
| 11  | `Toolbar`   | `Toolbar`   | Structure | —           | primary · muted |

> Mais simples da grade (zero interação), mas obrigatórios para o enforcement do contract test — verificam que `vars.colors.informational.*` nunca vaza para Action/Input.

---

### Navigation — completar a matriz

| #   | Componente | RAC base                    | entity     | interaction     | evaluations                          |
| --- | ---------- | --------------------------- | ---------- | --------------- | ------------------------------------ |
| 12  | `Tabs`     | `Tabs` + `Tab` + `TabPanel` | Navigation | `navigate.step` | primary · secondary · accent · muted |

> Complementa Link (`navigate.link`) — juntos cobrem os 2 interactions de Navigation.

---

## 4 Composites

**Regra**: Consequence deve existir como tipo/artefato antes dos composites 1 e 2.

```typescript
// src/consequence/Consequence.ts — mínimo suficiente
export type Consequence = {
  severity: 'destructive' | 'reversible';
  label: string; // texto do CTA de confirmação
  description?: string;
};
```

| #   | Composite       | Entidades compostas                                          | Pré-requisitos                              |
| --- | --------------- | ------------------------------------------------------------ | ------------------------------------------- |
| 1   | `ConfirmDialog` | Action[`confirm`] × Overlay                                  | `Consequence` + Button + Dialog             |
| 2   | `DeleteButton`  | Action[`negative`, `confirm`] × ConfirmDialog                | Composite 1 + `Consequence`                 |
| 3   | `ComboBox`      | Input[`entry.text`] × Collection[ListBox] × Overlay[Popover] | TextField + ListBox + Select (#4 + #8)      |
| 4   | `AlertBanner`   | Feedback × Structure                                         | ProgressBar/Toast (#6/#7) + Separator (#10) |

---

## Por que essa ordem

1. **Checkbox primeiro**: exercita `vars.border.selected.*` — token exclusivo de Selection, valida a coluna dupla.
2. **Accordion antes de Tabs**: Disclosure usa `transition` motion; se quebrar, é falha de token não de lógica.
3. **ProgressBar antes de Toast**: sem state machine (mais simples) — valida `vars.colors.feedback.*` isoladamente.
4. **Separator/Toolbar antes de Toolbar**: Structure sem interação força o enforcement "informational não vaza" no contract test.
5. **ConfirmDialog antes de DeleteButton**: Consequence só tem valor se existir antes do primeiro uso destrutivo.
