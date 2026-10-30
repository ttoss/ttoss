---
title: Principles
author: Pedro Arantes
---

import { useEffect } from 'react';

export const LEGACY_ANCHOR_CHAPTERS = {
prefixes: [
['ff', 'using-fast-feedback'],
['e', 'economic-view'],
['q', 'managing-queues'],
['v', 'exploiting-variability'],
['b', 'reducing-batch-size'],
['w', 'applying-wip-constraints'],
['f', 'controlling-flow-under-uncertainty'],
['d', 'achieving-decentralized-control'],
],
chapters: {
'the-economic-view': 'economic-view',
'managing-queues': 'managing-queues',
'exploiting-variability': 'exploiting-variability',
'reducing-batch-size': 'reducing-batch-size',
'applying-wip-constraints': 'applying-wip-constraints',
'controlling-flow-under-uncertainty': 'controlling-flow-under-uncertainty',
'using-fast-feedback': 'using-fast-feedback',
'achieving-decentralized-control': 'achieving-decentralized-control',
},
};

export const LegacyAnchorRedirect = () => {
useEffect(() => {
const anchor = decodeURIComponent(window.location.hash.slice(1));
if (!anchor) {
return;
}
const base = window.location.pathname.replace(/\/$/, '');
const chapter = LEGACY_ANCHOR_CHAPTERS.chapters[anchor];
if (chapter) {
window.location.replace(`${base}/${chapter}`);
return;
}
const match = LEGACY_ANCHOR_CHAPTERS.prefixes.find(([prefix]) =>
new RegExp(`^${prefix}\\d+-`).test(anchor)
);
if (match) {
window.location.replace(`${base}/${match[1]}#${anchor}`);
}
}, []);
return null;
};

<LegacyAnchorRedirect />

In this section, we list the principles that we follow when developing products. We use these principles as a base to create all processes, tools, guidelines, and workflows of all departments—[product](/docs/product), [design](/docs/engineering), and [engineering](/docs/engineering).

_These principles are based on the book [The Principles of Product Development Flow](https://www.amazon.com/Principles-Product-Development-Flow-Generation-ebook/dp/B00K7OWG7O) by Donald G. Reinertsen._

Each principle has an id made of its chapter's prefix and its number, such as E3 or FF7, and each chapter has its own page:

| Chapter                                                                       | Ids      | What it covers                                                                        |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| [The Economic View](./economic-view.md)                                       | E1–E21   | Every decision as a life-cycle profit trade-off, with cost of delay as the key number |
| [Managing Queues](./managing-queues.md)                                       | Q1–Q16   | Why invisible queues cause most of the waste, and how to measure and control them     |
| [Exploiting Variability](./exploiting-variability.md)                         | V1–V16   | When variability creates value, and how to reduce its cost instead of its amount      |
| [Reducing Batch Size](./reducing-batch-size.md)                               | B1–B22   | How smaller batches cut cycle time, risk and overhead, and how to pick the size       |
| [Applying WIP Constraints](./applying-wip-constraints.md)                     | W1–W23   | Limiting work in process to control cycle time and flow                               |
| [Controlling Flow Under Uncertainty](./controlling-flow-under-uncertainty.md) | F1–F30   | Cadence, synchronization and sequencing when loading and durations vary               |
| [Using Fast Feedback](./using-fast-feedback.md)                               | FF1–FF24 | Fast feedback loops and the metrics that steer the work                               |
| [Achieving Decentralized Control](./achieving-decentralized-control.md)       | D1–D23   | Decentralizing decisions with shared intent, clear boundaries and trust               |
