/**
 * Visual sign-off capture — renders every story in this Storybook in a real
 * Chromium, light and dark, and writes a contact sheet the owner can walk in
 * one pass instead of clicking through the catalog twice.
 *
 * It is the sign-off counterpart of the P3 review-round probe: the rounds
 * measured geometry against `@adobe/spectrum-tokens`; this one produces the
 * evidence a human looks at. It decides nothing — no thresholds, no verdicts.
 *
 *   pnpm --filter @docs/fsl-storybook run visual-signoff
 *
 * Options (env):
 *   SB_URL     Storybook base URL (default http://localhost:6007). When unset
 *              and nothing is listening, start `pnpm dev` in this package first.
 *   OUT_DIR    Output directory (default ./visual-signoff)
 *   ONLY       Substring filter on the story id (e.g. ONLY=overlay)
 *   WIDTH      Viewport width (default 1280)
 */
import { chromium } from 'playwright';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const SB_URL = process.env.SB_URL ?? 'http://localhost:6007';
const OUT_DIR = path.resolve(
  process.env.OUT_DIR ?? new URL('../visual-signoff', import.meta.url).pathname
);
const ONLY = process.env.ONLY ?? '';
const WIDTH = Number(process.env.WIDTH ?? 1280);
const MODES = ['light', 'dark'];

/**
 * Members whose story renders only a trigger: the thing under review is behind
 * a click. Stories that already ship `defaultOpen` are not listed — clicking
 * them again would close the surface. `toast` is here for the same reason as
 * the overlays even though it is a Feedback member: it publishes `alertdialog`,
 * so the clip below finds it once it exists.
 */
const OPENS_ON_CLICK = /(dialog|drawer|contextualhelp|toast)/i;

/** Selectors that prove an overlay surface is actually on screen. */
const OVERLAY_SURFACE =
  '[role="dialog"],[role="menu"],[role="tooltip"],[role="listbox"],[role="alertdialog"]';

/**
 * The sheet's running order. Sections follow the P3 review rounds recorded in
 * `packages/fsl-ui/INTERNAL/ROADMAP.md` §P3 so the walk matches the record the
 * sign-off is against; families P3 reached through its earlier slices rather
 * than through a round come last, under their own heading.
 *
 * `look` names what each round changed or ruled on. It is context for the eye,
 * not a checklist to tick — the sheet asserts nothing.
 */
const SECTIONS = [
  {
    id: 'r1',
    entity: 'Overlay',
    label: 'Rounds 1 & 2 — Overlay',
    look: 'Round 1 measured geometry and colour and fixed four findings: an anchored surface with no audited separation from the page (F-044), the fluid page inset applied to fixed overlay content (F-045), a Dialog with no minimum width (F-046), a Tooltip sized for a paragraph (F-047), plus F-048 — a surface claiming the overlay stratum shadow while painting the flat stratum fill. Look at the surface edge and shadow in dark, the inset at each width, and whether an open surface reads as lifted rather than pasted. Round 2 was behavioural (focus containment, dismiss, APG roles) and found no defect — screenshots cannot carry it; its evidence is the keyboard walk, not this sheet.',
  },
  {
    id: 'r3',
    entity: 'Feedback',
    label: 'Round 3 — Feedback',
    look: 'A fill and the rail behind it resolved to the same colour in dark (F-050); the rail had no address of its own, so three components borrowed three different tokens (F-051, now `semantic.rail.track`); the rail had no width envelope (F-052, now `--fsl-track-max-width`); Badge and StatusLight were one silhouette distinguished only by colour family (F-053, StatusLight is now dot + label). Look at rail contrast in dark, rail width at both extremes, and whether a status now reads as a status rather than a chip.',
  },
  {
    id: 'r4',
    entity: 'Collection',
    label: 'Round 4 — Collection',
    look: 'Every row painted the entity’s own resting fill instead of borrowing the container’s, so in dark a list read as a stack of filled boxes (F-055). Look at resting rows in dark across GridList, ListBox and Table — a row should materialise on hover, not sit pre-lit.',
  },
  {
    id: 'r5',
    entity: 'Navigation',
    label: 'Round 5 — Navigation',
    look: 'No defect found. Look for what the round explicitly checked and cleared: no doubled line under the selected tab, the current crumb distinguishable from its siblings, all four Link evaluations legible, and the focus ring present everywhere.',
  },
  {
    id: 'r6',
    entity: 'Disclosure',
    label: 'Round 6 — Disclosure',
    look: 'A pure refactor: Disclosure and Accordion restated one design decision under two names (F-056), now single-sourced in `disclosureAnatomy.ts`. It was verified pixel-identical before and after, so the thing to confirm here is that the two composites still look like one family — same trigger, same indicator, same panel edge.',
  },
  {
    id: 'r7',
    entity: 'Structure',
    label: 'Round 7 — Structure',
    look: 'The largest round, the fewest defects. One finding stands filed and fixed: Surface’s boundary had no address of its own at an elevated tonal stratum and in dark collided byte-for-byte with its own fill (F-057). Look at Surface at every level in dark, and at the 18 members here as a set — the point of this round is family coherence, not any single component.',
  },
  {
    id: 'slices',
    entity: ['Action', 'Input', 'Selection'],
    label: 'Reached by P3 slices, not by a round — Action, Input, Selection',
    look: 'These families were retuned component by component during P3 slices 3–5 and the forms block rather than in a review round, so they carry no round of their own. They are here because the sign-off is on the catalog the rounds left behind, and a family that drifted from the rest would show up next to it.',
  },
];

const fetchIndex = async () => {
  const res = await fetch(`${SB_URL}/index.json`);
  if (!res.ok) {
    throw new Error(
      `Storybook index unreachable at ${SB_URL} (${res.status}). Start it with \`pnpm dev\` in docs/fsl-storybook.`
    );
  }
  const { entries } = await res.json();
  return Object.values(entries)
    .filter((e) => e.type === 'story')
    .filter((e) => !ONLY || e.id.includes(ONLY));
};

const captureStory = async ({ page, story, mode }) => {
  const url = `${SB_URL}/iframe.html?viewMode=story&id=${encodeURIComponent(
    story.id
  )}&globals=mode:${mode}`;

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#storybook-root > *', { timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);

  if (OPENS_ON_CLICK.test(story.id)) {
    const trigger = page.locator('#storybook-root button').first();
    if ((await trigger.count()) > 0) {
      await trigger.click().catch(() => {});
    }
  }

  // Overlays portal outside #storybook-root, so clipping to the canvas alone
  // would miss the surface under review — but clipping to the whole viewport
  // buys that at the cost of a mostly-empty frame, which is exactly what makes
  // a sheet unreadable at two-up. The clip is the union of the canvas and any
  // overlay surface. The modal underlay is deliberately excluded: it covers the
  // viewport by definition, so including it would defeat the union.
  const clip = await page.evaluate(
    ({ surfaceSelector, pad, maxWidth, maxHeight }) => {
      const rects = [
        ...document.querySelectorAll(`#storybook-root > *, ${surfaceSelector}`),
      ]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);

      if (rects.length === 0) {
        return null;
      }

      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));

      return {
        x: 0,
        y: 0,
        width: Math.min(maxWidth, Math.ceil(right + pad)),
        height: Math.max(48, Math.min(maxHeight, Math.ceil(bottom + pad))),
      };
    },
    {
      surfaceSelector: OVERLAY_SURFACE,
      pad: 16,
      maxWidth: WIDTH,
      maxHeight: 900,
    }
  );

  const buffer = await page.screenshot({
    type: 'jpeg',
    quality: 78,
    animations: 'disabled',
    ...(clip ? { clip } : {}),
  });

  return { buffer, clip };
};

const escape = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

/**
 * Writes `index.html` beside the frames: every story as one row, light and dark
 * side by side, grouped by review round. With `INLINE=1` the images are
 * embedded as data URIs so the file travels on its own.
 */
const renderSheet = async ({ manifest, inline }) => {
  const byId = new Map();
  for (const shot of manifest) {
    const entry = byId.get(shot.id) ?? {
      id: shot.id,
      title: shot.title,
      name: shot.name,
    };
    entry[shot.mode] = shot;
    byId.set(shot.id, entry);
  }
  const stories = [...byId.values()];
  const entityOf = (story) => story.title.split('/')[0];

  const src = async (shot) => {
    if (!shot?.file) {
      return null;
    }
    if (!inline) {
      return escape(shot.file);
    }
    const bytes = await fs.readFile(path.join(OUT_DIR, shot.file));
    return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  };

  // The mode label sits above the frame rather than over it: a corner badge
  // covered a Meter's own value readout, which is exactly the kind of detail
  // this sheet exists to show.
  const frame = async (shot, mode) => {
    const url = await src(shot);
    if (!url) {
      return `<figure class="frame missing"><figcaption>${mode}</figcaption><span>${escape(
        shot?.error ?? 'not captured'
      )}</span></figure>`;
    }
    return `<figure class="frame"><figcaption>${mode}</figcaption><img loading="lazy" alt="${escape(
      `${shot.title} / ${shot.name} — ${mode}`
    )}" src="${url}" /></figure>`;
  };

  const sections = [];
  const placed = new Set();

  for (const section of SECTIONS) {
    const entities = [section.entity].flat();
    const members = stories.filter((s) => entities.includes(entityOf(s)));
    members.forEach((s) => placed.add(s.id));
    if (members.length === 0) {
      continue;
    }

    const rows = [];
    for (const story of members) {
      rows.push(
        `<article class="story"><h3>${escape(
          // A single-family section already names the family in its heading.
          entities.length > 1
            ? story.title
            : story.title.split('/').slice(1).join('/')
        )} <span>${escape(
          story.name
        )}</span><button class="zoom" type="button">1:1</button></h3><div class="pair">${await frame(
          story.light,
          'light'
        )}${await frame(story.dark, 'dark')}</div></article>`
      );
    }

    sections.push(
      `<section id="${section.id}"><header><h2>${escape(
        section.label
      )}</h2><p>${escape(section.look)}</p><p class="count">${
        members.length
      } stories</p></header>${rows.join('')}</section>`
    );
  }

  const orphans = stories.filter((s) => !placed.has(s.id));
  if (orphans.length > 0) {
    const rows = [];
    for (const story of orphans) {
      rows.push(
        `<article class="story"><h3>${escape(story.title)} <span>${escape(
          story.name
        )}</span><button class="zoom" type="button">1:1</button></h3><div class="pair">${await frame(
          story.light,
          'light'
        )}${await frame(story.dark, 'dark')}</div></article>`
      );
    }
    sections.push(
      `<section id="unmapped"><header><h2>Not mapped to a section</h2><p>Stories whose entity is not named above — the section map in <code>scripts/visual-signoff.mjs</code> has drifted from the catalog.</p><p class="count">${orphans.length} stories</p></header>${rows.join(
        ''
      )}</section>`
    );
  }

  const nav = SECTIONS.map(
    (s) => `<a href="#${s.id}">${escape(s.label.split(' — ')[0])}</a>`
  ).join('');

  const html = `<title>FSL P3 — visual sign-off sheet</title>
<style>
  :root { color-scheme: light dark; --bg:#fff; --fg:#101010; --dim:#5b5b5b; --line:#e3e3e3; --card:#fafafa; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0e0e0e; --fg:#f2f2f2; --dim:#a0a0a0; --line:#2a2a2a; --card:#161616; } }
  :root[data-theme="dark"] { --bg:#0e0e0e; --fg:#f2f2f2; --dim:#a0a0a0; --line:#2a2a2a; --card:#161616; }
  :root[data-theme="light"] { --bg:#fff; --fg:#101010; --dim:#5b5b5b; --line:#e3e3e3; --card:#fafafa; }
  body { background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; margin:0; }
  .wrap { max-width:1180px; margin:0 auto; padding:2.5rem 1.25rem 6rem; }
  h1 { font-size:1.6rem; margin:0 0 .5rem; letter-spacing:-.01em; }
  .lede { color:var(--dim); max-width:60ch; margin:0 0 1.25rem; }
  .rule { border:1px solid var(--line); border-radius:10px; padding:1rem 1.15rem; background:var(--card); margin:0 0 2rem; }
  .rule p { margin:0; }
  nav { position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:.4rem; padding:.6rem 0; background:var(--bg); border-bottom:1px solid var(--line); margin-bottom:2rem; }
  nav a { font-size:.8rem; text-decoration:none; color:var(--fg); border:1px solid var(--line); border-radius:999px; padding:.2rem .6rem; }
  section { margin:0 0 3.5rem; scroll-margin-top:4rem; }
  section > header { border-top:2px solid var(--fg); padding-top:.75rem; margin-bottom:1.5rem; }
  section > header h2 { font-size:1.15rem; margin:0 0 .5rem; }
  section > header p { color:var(--dim); margin:0 0 .35rem; max-width:76ch; font-size:.9rem; }
  .count { font-variant-numeric:tabular-nums; font-size:.78rem !important; text-transform:uppercase; letter-spacing:.06em; }
  .story { margin:0 0 1.5rem; }
  .story h3 { font-size:.9rem; margin:0 0 .4rem; font-weight:600; }
  .story h3 span { color:var(--dim); font-weight:400; }
  .zoom { font:inherit; font-size:.68rem; letter-spacing:.04em; margin-left:.5rem; padding:.05rem .4rem; border:1px solid var(--line); border-radius:5px; background:transparent; color:var(--dim); cursor:pointer; }
  .zoom:hover { color:var(--fg); }
  .story.wide .zoom { color:var(--fg); border-color:currentColor; }
  .pair { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
  .story.wide .pair { grid-template-columns:1fr; }
  @media (max-width:760px) { .pair { grid-template-columns:1fr; } }
  .frame { margin:0; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .frame figcaption { font-size:.62rem; letter-spacing:.09em; text-transform:uppercase; color:var(--dim); padding:.2rem .5rem; border-bottom:1px solid var(--line); }
  .frame img { display:block; width:100%; height:auto; }
  .missing { display:grid; place-items:center; min-height:80px; color:var(--dim); font-size:.8rem; padding:1rem; text-align:center; }
</style>
<div class="wrap">
<h1>FSL P3 — visual sign-off sheet</h1>
<p class="lede">Every story in the fsl Storybook, rendered in Chromium at ${WIDTH}px, light and dark side by side, in the order of the P3 review rounds. Two-up halves each frame’s scale — <strong>1:1</strong> on a row stacks its two modes at full width when something needs a closer look.</p>
<div class="rule"><p>This sheet is evidence, not a verdict. The rounds closed their findings and <code>FRICTION.md</code> is at zero open — that is a separate fact from the owner’s visual sign-off, which no generated artefact can perform. Anything wrong that you see here becomes a new <code>FRICTION.md</code> entry, numbered from the highest <code>F-###</code> in the file.</p></div>
<nav>${nav}</nav>
${sections.join('')}
</div>
<script>
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.zoom');
    if (button) {
      button.closest('.story').classList.toggle('wide');
    }
  });
</script>
`;

  const file = path.join(OUT_DIR, inline ? 'sheet-inline.html' : 'index.html');
  await fs.writeFile(file, html);
  console.log(`sheet → ${file}`);
};

const main = async () => {
  // Re-rendering the sheet is cheap and re-capturing is not, so editing the
  // section map does not cost another Chromium pass.
  if (process.env.SHEET_ONLY === '1') {
    const manifest = JSON.parse(
      await fs.readFile(path.join(OUT_DIR, 'manifest.json'), 'utf8')
    );
    await renderSheet({ manifest, inline: false });
    if (process.env.INLINE === '1') {
      await renderSheet({ manifest, inline: true });
    }
    return;
  }

  const stories = await fetchIndex();
  if (stories.length === 0) {
    throw new Error(`No stories matched ONLY=${ONLY}`);
  }
  console.log(`${stories.length} stories × ${MODES.length} modes`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  // `CHROMIUM_PATH` lets a sandbox point at a preinstalled Chromium whose
  // build number does not match the pinned playwright package.
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const manifest = [];

  try {
    for (const mode of MODES) {
      const context = await browser.newContext({
        viewport: { width: WIDTH, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: mode,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      for (const story of stories) {
        const file = `${story.id}--${mode}.jpg`;
        try {
          const { buffer } = await captureStory({ page, story, mode });
          await fs.writeFile(path.join(OUT_DIR, file), buffer);
          manifest.push({
            id: story.id,
            title: story.title,
            name: story.name,
            mode,
            file,
            bytes: buffer.length,
          });
          console.log(`  ✓ ${file} (${(buffer.length / 1024).toFixed(0)}kB)`);
        } catch (error) {
          console.log(`  ✗ ${file} — ${error.message}`);
          manifest.push({
            id: story.id,
            title: story.title,
            name: story.name,
            mode,
            error: String(error.message),
          });
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  await renderSheet({ manifest, inline: false });
  if (process.env.INLINE === '1') {
    await renderSheet({ manifest, inline: true });
  }

  const failed = manifest.filter((m) => m.error);
  console.log(
    `\n${manifest.length - failed.length} captured, ${failed.length} failed → ${OUT_DIR}`
  );
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

await main();
