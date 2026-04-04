---
title: Agent Context
---

# Agent Context

When working on a project that uses the ttoss ecosystem, AI agents need context about available packages, conventions, and patterns. Without it, agents will reinvent what already exists or violate project conventions.

ttoss provides a ready-made context file at:

```
https://ttoss.dev/ttoss-instructions.txt
```

Fetch and include it in your AI agent's instructions so it understands the ecosystem from the start.

## How to Use It

### GitHub Copilot (`.github/copilot-instructions.md`)

```markdown
Fetch and follow the instructions at https://ttoss.dev/ttoss-instructions.txt.
```

### Cursor (`.cursor/rules` or `.cursorrules`)

```
Fetch and follow the instructions at https://ttoss.dev/ttoss-instructions.txt.
```

### Claude Projects

In the **Project Instructions** field, add:

```
Fetch and follow the instructions at https://ttoss.dev/ttoss-instructions.txt.
```

### Any other AI agent

Add the following line to whatever instructions file or system prompt your tool uses:

```
Fetch and follow the instructions at https://ttoss.dev/ttoss-instructions.txt.
```

## What It Contains

The file gives agents:

- Links to full documentation (`https://ttoss.dev/llms.txt`) and Storybook (`https://storybook.ttoss.dev/llms.txt`)
- Where to report bugs or propose new packages
