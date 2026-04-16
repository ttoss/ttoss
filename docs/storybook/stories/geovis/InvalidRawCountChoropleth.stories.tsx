import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { PolicyViolation, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import fixture from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.json';
import type { LockRef, MapRef } from './_map-story-helpers';
import {
  ChoroplethPainter,
  ColorSwatchLegend,
  MapLabel,
  MapOverlayLegend,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/InvalidRawCountChoropleth',
  tags: ['autodocs'],
} as Meta;

const spec = fixture as unknown as VisualizationSpec;

const fmtPop = (v: number) => {
  return `${(v / 1_000_000).toFixed(1)}M hab.`;
};
const fmtDensity = (v: number) => {
  return `${v} hab/km²`;
};

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

// Expressao MapLibre para calcular densidade em runtime: population / sq-km
const densityExpr = ['/', ['get', 'population'], ['get', 'sq-km']] as const;

/**
 * Componente nulo que le policyViolations do GeoVisContext (via useGeoVis)
 * e os hissa para a story pai via callback.
 * Deve ser filho de um GeoVisProvider montado com o mesmo spec.
 * Substitui a leitura direta de metadata.isPolicyInvalid do JSON importado.
 */
const PolicyDetector = ({
  onViolations,
}: {
  onViolations: (v: PolicyViolation[]) => void;
}) => {
  const { policyViolations } = useGeoVis();
  React.useEffect(() => {
    if (policyViolations.length > 0) onViolations(policyViolations);
  }, [policyViolations, onViolations]);
  return null;
};

const PolicyWarningBanner = ({
  violations,
}: {
  violations: PolicyViolation[];
}) => {
  if (violations.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        background: '#fffbeb',
        border: '1px solid #f59e0b',
        borderLeft: '4px solid #d97706',
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
      <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>
          Guardrail cartografico: contagem absoluta em coropletico
        </strong>
        Provincias de Ruanda codificadas por <strong>populacao absoluta</strong>{' '}
        (esq.) vs <strong>densidade</strong> (hab/km², dir.). Kigali tem apenas
        1,1M hab. — a menor contagem — mas e a provincia mais densa (1.551
        hab/km²). No mapa esquerdo Kigali parece quase branca; no mapa direito e
        a mais escura.
        <br />
        <strong>Correto:</strong> dividir por area antes de codificar em cor.
        {violations.map((v) => {
          return (
            <span
              key={v.reason}
              style={{
                display: 'block',
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            >
              [{v.reason}]
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Story

/**
 * Fixture **propositalmente invalido** — artefato de contrato da policy
 * `cartography.warnOnRawCountChoropleth`.
 *
 * Usa dados oficiais do MapLibre (provincias de Ruanda) e split-compare para
 * evidenciar o problema: Kigali City tem a menor populacao absoluta (1,1M) mas
 * a maior densidade (1.551 hab/km²). No mapa esquerdo parece quase branca;
 * no mapa direito e a mais escura. A densidade e calculada em runtime via
 * expressao MapLibre `['/', ['get', 'population'], ['get', 'sq-km']]`.
 */
export const InvalidRawCountChoropleth: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;
  const [violations, setViolations] = React.useState<PolicyViolation[]>([]);

  // Estabiliza a referencia do callback para nao disparar re-renders desnecessarios.
  const handleViolations = React.useCallback((v: PolicyViolation[]) => {
    return setViolations(v);
  }, []);

  const recenter = React.useCallback(() => {
    const { center, zoom } = fixture.view;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center: center as [number, number], zoom, animate: false });
    }
    syncLock.current = false;
  }, []);

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };

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
          Recentralizar
        </button>
      </div>

      {/* Banner acionado via policyViolations do GeoVisContext — nao le metadata diretamente do JSON */}
      <PolicyWarningBanner violations={violations} />

      <div style={{ display: 'flex', gap: 4, height: 460 }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            border: '2px solid #f59e0b',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <MapLabel>Populacao absoluta (population) - invalido</MapLabel>
          <MapOverlayLegend
            label="populacao absoluta"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
          <GeoVisProvider spec={spec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
            <ChoroplethPainter
              layerId="rwanda-choropleth"
              field="population"
              defaultColor="#eff6ff"
              steps={rawSteps}
            />
            {/* PolicyDetector hissa violations para o estado da story pai */}
            <PolicyDetector onViolations={handleViolations} />
          </GeoVisProvider>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            border: '2px solid #16a34a',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <MapLabel>Densidade (population / sq-km) - correto</MapLabel>
          <MapOverlayLegend
            label="densidade (hab/km²)"
            defaultColor="#f0fdf4"
            steps={densitySteps}
            formatValue={fmtDensity}
          />
          <GeoVisProvider spec={spec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
            <ChoroplethPainter
              layerId="rwanda-choropleth"
              field={densityExpr}
              defaultColor="#f0fdf4"
              steps={densitySteps}
            />
          </GeoVisProvider>
        </div>
      </div>

      {/* gap: 4 espelha o layout da linha dos mapas — cada swatch alinha com seu painel correspondente */}
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

      <div>
        <strong>Policy</strong>
        <ul style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
          <li>
            <code>cartography.warnOnRawCountChoropleth: true</code> - este
            fixture deve disparar aviso em runtime quando a policy estiver
            ativa.
          </li>
          <li>
            Campo invalido:{' '}
            <code>{fixture.metadata.metricField as string}</code>. Expressao
            correta:{' '}
            <code>{fixture.metadata.normalizedExpression as string}</code> (
            {fixture.metadata.normalizedLabel as string}).
          </li>
        </ul>
      </div>

      <div>
        <strong>Official references</strong>
        <ul style={{ fontSize: 13 }}>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Visualize population density (normalized)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
