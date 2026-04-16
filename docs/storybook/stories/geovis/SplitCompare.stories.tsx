import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec, VisualizationView } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import choroplethFixture from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.json';
import fixture from '../../../../packages/geovis/src/fixtures/split-compare.json';
import type { LockRef, MapRef } from './_map-story-helpers';
import {
  ChoroplethPainter,
  ColorSwatchLegend,
  GeoVisSplitLayout,
  MapLabel,
  MapOverlayLegend,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/SplitCompare',
  tags: ['autodocs'],
} as Meta;

// Specs derivados do mesmo fixture
// Ambos compartilham source, view e basemap. Apenas os layers diferem.

const leftSpec: VisualizationSpec = {
  ...(fixture as unknown as VisualizationSpec),
  layers: (fixture as unknown as VisualizationSpec).layers.filter((l) => {
    return (fixture.metadata.leftLayers as string[]).includes(l.id);
  }),
};

const rightSpec: VisualizationSpec = {
  ...(fixture as unknown as VisualizationSpec),
  layers: (fixture as unknown as VisualizationSpec).layers.filter((l) => {
    return (fixture.metadata.rightLayers as string[]).includes(l.id);
  }),
};

// Spec com views[] declaradas — usado pela Option A
const choroplethSpec = choroplethFixture as unknown as VisualizationSpec;

// Escala azul para contagem absoluta (invalido)
// Ruanda: Kigali=1.1M (menor, mais denso), East/South/West=2.5-2.6M (maiores)
const rawSteps = [
  { threshold: 1_300_000, color: '#bfdbfe' },
  { threshold: 1_700_000, color: '#60a5fa' },
  { threshold: 2_000_000, color: '#3b82f6' },
  { threshold: 2_300_000, color: '#1d4ed8' },
];

// Escala verde para densidade normalizada (correto)
// Ruanda: East=274, West=420, South=434, North=527, Kigali=1551 hab/km2
const densitySteps = [
  { threshold: 350, color: '#86efac' },
  { threshold: 430, color: '#4ade80' },
  { threshold: 520, color: '#16a34a' },
  { threshold: 900, color: '#15803d' },
  { threshold: 1300, color: '#14532d' },
];

// Expressao MapLibre: population / sq-km — calculada em runtime
const densityExpr = ['/', ['get', 'population'], ['get', 'sq-km']] as const;

const fmtPop = (v: number) => {
  return `${(v / 1_000_000).toFixed(1)}M hab.`;
};
const fmtDensity = (v: number) => {
  return `${v} hab/km²`;
};

// Story principal

/**
 * Dois `GeoVisProvider` independentes com o mesmo source de dados.
 * O mapa esquerdo exibe cobertura territorial (fill).
 * O mapa direito exibe perímetro das zonas (line).
 * O movimento é sincronizado via `getNativeInstance()` — sem API adicional no package.
 */
export const SplitCompare: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;

  const recenter = () => {
    const { center, zoom } = fixture.view;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center: center as [number, number], zoom, animate: false });
    }
    syncLock.current = false;
  };

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };
  const panelStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    border: '1px solid #d4d4d8',
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <strong>{fixture.title}</strong>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {fixture.description}
          </p>
        </div>
        <button
          onClick={recenter}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #d4d4d8',
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⊙ Recentralizar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, height: 480 }}>
        <div style={panelStyle}>
          <MapLabel>Cobertura territorial (fill)</MapLabel>
          <GeoVisProvider spec={leftSpec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>

        <div style={panelStyle}>
          <MapLabel>Per&iacute;metro das zonas (line)</MapLabel>
          <GeoVisProvider spec={rightSpec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>
      </div>

      <div>
        <strong>Official references</strong>
        <ul>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/sync-movement-of-multiple-maps/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Sync movement of multiple maps
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/change-a-layers-color-with-buttons/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre &mdash; Change a layer&apos;s color with buttons
              (setPaintProperty)
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-polygon/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Add a GeoJSON polygon
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Exploração de APIs nativas da biblioteca

/**
 * **Opcao A — `views[]` na VisualizationSpec (spec-first)**
 *
 * O fixture `invalid-raw-count-choropleth.json` declara:
 * ```json
 * "views": [
 *   { "id": "left",  "label": "...", "layers": ["rwanda-choropleth"] },
 *   { "id": "right", "label": "...", "layers": ["rwanda-choropleth"] }
 * ]
 * ```
 *
 * `GeoVisSplitLayout` le `spec.views[]`, deriva um spec filtrado por view,
 * cria um `GeoVisProvider` + `GeoVisCanvas` por painel e gerencia sincronizacao
 * internamente. O consumer nao precisa de `MapRef`, `LockRef` ou `MapSync`.
 *
 * O prop `render` e o escape hatch para logica ainda nao declaravel no spec:
 * `ChoroplethPainter` aplica paint data-driven via `getNativeInstance()` pois
 * `FillPaint.fillColor` nao suporta expressoes MapLibre no schema v1.
 *
 * Dados: provincias de Ruanda (dataset oficial MapLibre — campos `population` e `sq-km`).
 * Demonstra o anti-padrao classico: Kigali City tem 1,1M hab (menor provinicia)
 * mas 1.551 hab/km² (mais densa). No mapa esquerdo parece branca; no direito e a mais escura.
 */
export const OptionA_ViewsInSpec: StoryFn = () => {
  const renderView = (view: VisualizationView) => {
    if (view.id === 'left') {
      return (
        <>
          <MapOverlayLegend
            label="populacao absoluta"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
          <ChoroplethPainter
            layerId="rwanda-choropleth"
            field="population"
            defaultColor="#eff6ff"
            steps={rawSteps}
          />
        </>
      );
    }
    return (
      <>
        <MapOverlayLegend
          label="densidade (hab/km²)"
          defaultColor="#f0fdf4"
          steps={densitySteps}
          formatValue={fmtDensity}
        />
        <ChoroplethPainter
          layerId="rwanda-choropleth"
          field={densityExpr}
          defaultColor="#f0fdf4"
          steps={densitySteps}
        />
      </>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>Opcao A — spec.views[] com GeoVisSplitLayout</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          O fixture declara <code>views[]</code>. O layout le a spec e cria os
          paineis com sync automatico — sem <code>MapRef</code> ou{' '}
          <code>MapSync</code> no consumer.
        </p>
      </div>

      <GeoVisSplitLayout
        spec={choroplethSpec}
        leftBorder="2px solid #f59e0b"
        rightBorder="2px solid #16a34a"
        render={renderView}
      />

      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Azul — contagem absoluta (invalido)"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Verde — densidade hab/km² (correto)"
            defaultColor="#f0fdf4"
            steps={densitySteps}
            formatValue={fmtDensity}
          />
        </div>
      </div>

      <details style={{ marginTop: 4 }}>
        <summary
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Como usar: codigo do consumer
        </summary>
        <pre
          style={{
            marginTop: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre',
            overflowX: 'auto',
            background: '#f3f4f6',
            padding: 12,
            borderRadius: 6,
            color: '#1f2937',
          }}
        >
          {`// 1. O fixture (ou spec gerada por IA) declara views[]:
//
// {
//   "id": "invalid-raw-count-choropleth",
//   "sources": [{ "id": "rwanda-provinces", ... }],
//   "layers": [{ "id": "rwanda-choropleth", ... }],
//   "views": [
//     { "id": "left",  "label": "Populacao absoluta — invalido", "layers": ["rwanda-choropleth"] },
//     { "id": "right", "label": "Densidade (hab/km²) — correto",  "layers": ["rwanda-choropleth"] }
//   ]
// }

import { GeoVisSplitLayout } from './_map-story-helpers';
import type { VisualizationView } from '@ttoss/geovis';

// 2. O consumer fornece logica por view via prop render:
const renderView = (view: VisualizationView) => {
  if (view.id === 'left') {
    return (
      <ChoroplethPainter
        layerId="rwanda-choropleth"
        field="population"
        defaultColor="#eff6ff"
        steps={rawSteps}
      />
    );
  }
  return (
    <ChoroplethPainter
      layerId="rwanda-choropleth"
      field={['/', ['get', 'population'], ['get', 'sq-km']]}
      defaultColor="#f0fdf4"
      steps={densitySteps}
    />
  );
};

// 3. Layout e sync automaticos — sem MapRef, LockRef ou MapSync:
<GeoVisSplitLayout
  spec={spec}
  leftBorder="2px solid #f59e0b"
  rightBorder="2px solid #16a34a"
  render={renderView}
/>`}
        </pre>
      </details>

      <div>
        <strong>Official references</strong>
        <ul style={{ fontSize: 13 }}>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Visualize population density
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

OptionA_ViewsInSpec.parameters = {
  docs: {
    description: {
      story:
        'Spec-first: `views[]` declara múltiplas perspectivas do mesmo dado no fixture JSON. `GeoVisSplitLayout` lê a spec do prop, filtra layers por view, cria um `GeoVisProvider` por painel e sincroniza automaticamente — sem `MapRef`, `LockRef` ou `MapSync` no consumer. O prop `render` é o _escape hatch_ para lógica ainda não declarável no spec (ex: expressões MapLibre em paint via `ChoroplethPainter`).',
    },
  },
};

/**
 * **Opcao B — `useSplitCompare()` hook**
 *
 * O hook recebe um spec base e overrides por painel (ex: layers filtrados),
 * retorna specs derivadas e um par de componentes de sync para o consumer montar.
 *
 * ```tsx
 * const { leftProps, rightProps, syncRef } = useSplitCompare(baseSpec, {
 *   left:  { layers: ['districts-fill'] },
 *   right: { layers: ['districts-line'] },
 * });
 *
 * <div style={{ display: 'flex' }}>
 *   <GeoVisProvider spec={leftProps.spec}>
 *     <GeoVisCanvas viewId="left" style={{ flex: 1 }} />
 *     <syncRef.Left />
 *   </GeoVisProvider>
 *   <GeoVisProvider spec={rightProps.spec}>
 *     <GeoVisCanvas viewId="right" style={{ flex: 1 }} />
 *     <syncRef.Right />
 *   </GeoVisProvider>
 * </div>
 * ```
 *
 * ---
 *
 * ## Trade-offs: Opcao A (views[] na spec) vs Opcao B (useSplitCompare hook)
 *
 * | Dimensao                  | Opcao A — spec-first              | Opcao B — hook                     |
 * |---------------------------|-----------------------------------|------------------------------------|
 * | Acoplamento de schema     | Adiciona `views[]` ao schema v1   | Nenhuma mudanca no schema          |
 * | Declaratividade           | Estrutura de dados (JSON)         | Codigo TypeScript                  |
 * | Serializabilidade         | Spec e persistivel/transmissivel  | Override e ephemero (codigo)       |
 * | Gerabilidade por IA       | LLM gera `views[]` como JSON puro | Requer geracao de codigo           |
 * | Controle de layout        | Delegado ao componente de layout  | Consumer controla 100%             |
 * | Sync                      | Automatico — nao pode esquecer    | Explicito via `syncRef` — fragil   |
 * | Escape hatch por painel   | Prop `render` com view como arg   | Filho direto por painel            |
 * | Testabilidade             | Requer render-level test          | Hook pode ser testado isoladamente |
 * | Evolucao do schema        | Breaking change se views[] mudar  | Mudanca isolada na API do hook     |
 * | Numero de paineis         | Fixo (2 no layout atual)          | N paineis (flexivel)               |
 * | Boilerplate no consumer   | Minimo (um prop `render`)         | Verbose (2 providers + syncRef)    |
 *
 * ### Quando preferir A
 * - O split-compare e parte da definicao do dado (ex: fixture de policy invalida
 *   que SEMPRE deve ser mostrada com contexto correto ao lado)
 * - Specs sao geradas por IA ou persistidas em banco — a estrutura de views
 *   deve ser legivel por qualquer consumer sem conhecer o hook
 * - Sync automatico e um requisito de seguranca (ex: auditorias, revisoes)
 *
 * ### Quando preferir B
 * - O layout e variavel: o consumer pode querer 3 paineis, direction column,
 *   tamanhos assimetricos ou integrar com um sistema de UI externo
 * - O hook e composto com outras logicas (ex: filtros condicionais por painel)
 * - Time-to-first-implementation e curto: nao ha custo de ADR para schema
 */
export const OptionB_UseSplitCompareHook: StoryFn = () => {
  return (
    <div
      style={{
        padding: 24,
        background: '#f9fafb',
        borderRadius: 8,
        fontSize: 13,
        color: '#374151',
      }}
    >
      <strong style={{ fontSize: 15 }}>
        Opcao B — <code>useSplitCompare()</code> hook
      </strong>
      <pre
        style={{
          marginTop: 12,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          background: '#f3f4f6',
          padding: 12,
          borderRadius: 6,
        }}
      >
        {`const { leftProps, rightProps, syncRef } = useSplitCompare(baseSpec, {
  left:  { layers: ['districts-fill'] },
  right: { layers: ['districts-line'] },
});

<GeoVisProvider spec={leftProps.spec}>
  <GeoVisCanvas viewId="left" style={{ flex: 1 }} />
  <syncRef.Left />
</GeoVisProvider>
<GeoVisProvider spec={rightProps.spec}>
  <GeoVisCanvas viewId="right" style={{ flex: 1 }} />
  <syncRef.Right />
</GeoVisProvider>`}
      </pre>
      <p style={{ marginTop: 16, lineHeight: 1.6 }}>
        O consumer monta os providers e controla o layout diretamente. A
        sincronizacao e explicitamente declarada via <code>syncRef.Left</code> /{' '}
        <code>syncRef.Right</code> — se omitida, os mapas nao sincronizam.
        Nenhuma mudanca no schema de <code>VisualizationSpec</code> e
        necessaria.
      </p>
      <p style={{ marginTop: 8, lineHeight: 1.6 }}>
        Ver tabela de trade-offs completa na documentacao desta story.
      </p>
    </div>
  );
};

OptionB_UseSplitCompareHook.parameters = {
  docs: {
    description: {
      story: `
Hook \`useSplitCompare\` que deriva specs filtradas por painel e expõe
componentes de sync como \`syncRef.Left\` / \`syncRef.Right\`.
Composable e sem mudança no schema — o consumer mantém controle total do layout.

**Trade-offs vs Opção A (\`views[]\` na spec)**

| Dimensão | A — spec-first | B — hook |
|---|---|---|
| Acoplamento de schema | Adiciona \`views[]\` ao schema v1 | Nenhuma mudança no schema |
| Declaratividade | JSON — estrutura de dados | TypeScript — código |
| Serializabilidade | Spec é persistível/transmissível como JSON | Override é efémero (código) |
| Gerabilidade por IA | LLM gera \`views[]\` sem conhecer o package | Requer geração de código com a API do hook |
| Controle de layout | Delegado ao componente de layout | Consumer controla 100% (direção, tamanhos, N painéis) |
| Sincronização | Automática — não pode ser esquecida | Explícita via \`syncRef\` — frágil se omitida |
| Escape hatch por painel | Prop \`render(view)\` | Filho direto por painel |
| Testabilidade | Requer render-level test | Hook pode ser testado isoladamente |
| Evolução da API | Breaking se \`views[]\` schema mudar | Mudança isolada na assinatura do hook |
| Número de painéis | Fixo (2 no layout padrão) | N painéis (flexível) |
| Boilerplate no consumer | Mínimo (spec + prop \`render\`) | Verbose (2 providers + 2 syncRef + refs) |

**Quando preferir A:** a perspectiva múltipla faz parte da definição do dado — ex: fixture de policy
inválida que _sempre_ deve ser mostrada com o correto ao lado; specs geradas por IA ou
persistidas em banco; sync automático é requisito de conformidade.

**Quando preferir B:** o layout é variável (N painéis, column, tamanhos assimétricos, integração com
um design system externo); o hook é composto com outras lógicas condicionais por painel; a
equipe quer adiar a decisão de schema e iterar antes de um ADR formal.
      `.trim(),
    },
  },
};
