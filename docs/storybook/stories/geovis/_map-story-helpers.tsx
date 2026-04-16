/**
 * Helpers internos compartilhados entre stories de GeoVis.
 * Nao sao artefatos publicos do package — apenas utilidades de story.
 */
import type { VisualizationSpec, VisualizationView } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

// ---------------------------------------------------------------------------
// MapSync
// ---------------------------------------------------------------------------

export type MapRef = React.MutableRefObject<MapLibreMap | null>;
export type LockRef = React.MutableRefObject<boolean>;

/**
 * Renderizado dentro de um GeoVisProvider.
 * Registra o mapa nativo em `selfRef` e sincroniza movimentos com `peerRef`.
 * `lockRef` eh compartilhado entre os dois MapSync para evitar loop de retorno.
 * `animate: false` no jumpTo impede que a animacao do peer gere novos eventos move.
 */
export const MapSync = ({
  selfRef,
  peerRef,
  lockRef,
}: {
  selfRef: MapRef;
  peerRef: MapRef;
  lockRef: LockRef;
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;
    selfRef.current = map;
    return () => {
      selfRef.current = null;
    };
  }, [runtime, selfRef]);

  React.useEffect(() => {
    if (!runtime) return;
    const self = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!self) return;

    const onMove = () => {
      if (lockRef.current || !peerRef.current) return;
      lockRef.current = true;
      peerRef.current.jumpTo({
        center: self.getCenter(),
        zoom: self.getZoom(),
        bearing: self.getBearing(),
        pitch: self.getPitch(),
        animate: false,
      });
      lockRef.current = false;
    };

    self.on('move', onMove);
    return () => {
      return self.off('move', onMove);
    };
  }, [runtime, peerRef, lockRef]);

  return null;
};

// ---------------------------------------------------------------------------
// MapLabel
// ---------------------------------------------------------------------------

export const MapLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ChoroplethPainter
// ---------------------------------------------------------------------------

export interface ColorStep {
  threshold: number;
  color: string;
}

/**
 * Componente sem render renderizado dentro de um GeoVisProvider.
 * Aplica uma expressao `step` de cor data-driven via getNativeInstance().
 * Necessario pois FillPaint.fillColor nao suporta expressoes MapLibre (so string).
 *
 * `field` pode ser:
 * - string: usa ['get', field] — propriedade direta do feature
 * - array: usa como expressao MapLibre arbitraria (ex: ['/', ['get', 'pop'], ['get', 'area']])
 *
 * Reaplica quando o layer ainda nao existe (retry em idle) para lidar com
 * corridas entre montagem React e carregamento do estilo do adapter.
 */
export const ChoroplethPainter = ({
  layerId,
  field,
  defaultColor,
  steps,
}: {
  layerId: string;
  field: string | readonly unknown[];
  defaultColor: string;
  steps: ColorStep[];
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    let mounted = true;

    const getExpr = typeof field === 'string' ? ['get', field] : field;
    const expr = [
      'step',
      getExpr,
      defaultColor,
      ...steps.flatMap(({ threshold, color }) => {
        return [threshold, color];
      }),
    ];

    const applyWhenReady = () => {
      if (!mounted) return;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'fill-color', expr);
      } else {
        map.once('idle', applyWhenReady);
      }
    };

    if (map.isStyleLoaded()) {
      applyWhenReady();
    } else {
      map.once('load', applyWhenReady);
    }

    return () => {
      mounted = false;
    };
  }, [runtime, layerId, field, defaultColor, steps]);

  return null;
};

// ---------------------------------------------------------------------------
// MapOverlayLegend
// ---------------------------------------------------------------------------

/**
 * Overlay de gradiente posicionado abaixo do MapLabel (topo-esquerdo do painel).
 * Deve ser filho direto de um div com `position: relative` (o painel do mapa),
 * nao precisa estar dentro de GeoVisProvider.
 *
 * [cartografia] Robinson & Slocum "Thematic Cartography" cap. 18:
 * Em mapas de comparacao lado a lado, a legenda deve ser agrupada com o
 * rotulo do layer correspondente, formando um bloco informativo coeso que
 * o leitor processa ANTES de explorar os dados — padrao seguido por
 * ESRI StoryMaps e ArcGIS Dashboards.
 * `top: 40` ancora o overlay imediatamente abaixo do MapLabel (~32px de altura).
 * Canto inferior-esquerdo (ICA) e preferido em mapas isolados, mas em
 * split-compare o topo-esquerdo agrupa rotulo + escala e evita sobreposicao
 * com a barra de atribuicao do MapLibre (bottom-right).
 */
export const MapOverlayLegend = ({
  label,
  defaultColor,
  steps,
  formatValue,
}: {
  label?: string;
  defaultColor: string;
  steps: ColorStep[];
  formatValue?: (v: number) => string;
}) => {
  const colors = [
    defaultColor,
    ...steps.map((s) => {
      return s.color;
    }),
  ];
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
  const fmt =
    formatValue ??
    ((v: number) => {
      return String(v);
    });
  const minLabel = `< ${fmt(steps[0].threshold)}`;
  const maxLabel = `> ${fmt(steps[steps.length - 1].threshold)}`;

  return (
    <div
      style={{
        position: 'absolute',
        // Ancorado abaixo do MapLabel (top: 8, ~28px de altura) — ver comentario no JSDoc.
        top: 40,
        left: 8,
        zIndex: 1,
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '5px 8px',
        minWidth: 130,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 3,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ height: 8, background: gradient, borderRadius: 2 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 9, color: '#6b7280' }}>{minLabel}</span>
        <span style={{ fontSize: 9, color: '#6b7280' }}>{maxLabel}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ColorSwatchLegend
// ---------------------------------------------------------------------------

/**
 * Legenda de swatches (quadrado + faixa de valor) para secao abaixo dos mapas.
 */
// ---------------------------------------------------------------------------
// GeoVisSplitLayout
// ---------------------------------------------------------------------------

/**
 * Renderiza um split-compare de dois paineis a partir de um spec que declara
 * `views[]`. Cada view gera um `GeoVisProvider` com layers filtrados e
 * sincronizacao de movimento automatica — o consumer nao precisa gerenciar
 * `MapRef`, `LockRef` ou `MapSync` diretamente.
 *
 * O prop `render` recebe a `VisualizationView` corrente e deve retornar os
 * filhos a serem montados DENTRO do `GeoVisProvider` daquela view (ex:
 * `ChoroplethPainter`, `MapOverlayLegend`). Eh o escape hatch para logica
 * que ainda nao pode ser declarada no spec (ex: expressoes MapLibre em paint).
 *
 * Requer exatamente 2 views em `spec.views`. Emite aviso visual se ausente.
 */
export const GeoVisSplitLayout = ({
  spec,
  height = 480,
  leftBorder,
  rightBorder,
  render,
}: {
  spec: VisualizationSpec;
  height?: number;
  leftBorder?: string;
  rightBorder?: string;
  render?: (view: VisualizationView) => React.ReactNode;
}) => {
  const views = spec.views ?? [];
  const [left, right] = views as [
    VisualizationView | undefined,
    VisualizationView | undefined,
  ];

  const leftRef = React.useRef<MapRef['current']>(null);
  const rightRef = React.useRef<MapRef['current']>(null);
  const lockRef = React.useRef(false) as LockRef;

  if (!left || !right) {
    return (
      <div style={{ padding: 12, color: '#ef4444', fontSize: 13 }}>
        GeoVisSplitLayout: spec.views deve conter exatamente 2 views.
      </div>
    );
  }

  const filterLayers = (ids: string[]) => {
    return spec.layers.filter((l) => {
      return ids.includes(l.id);
    });
  };

  const leftSpec: VisualizationSpec = {
    ...spec,
    id: `${spec.id}--left`,
    layers: filterLayers(left.layers),
    views: undefined,
  };
  const rightSpec: VisualizationSpec = {
    ...spec,
    id: `${spec.id}--right`,
    layers: filterLayers(right.layers),
    views: undefined,
  };

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };
  const panelBase: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    borderRadius: 4,
  };

  return (
    <div style={{ display: 'flex', gap: 4, height }}>
      <div style={{ ...panelBase, border: leftBorder ?? '1px solid #d4d4d8' }}>
        <MapLabel>{left.label}</MapLabel>
        <GeoVisProvider spec={leftSpec}>
          <GeoVisCanvas viewId={left.id} style={canvasStyle} />
          <MapSync selfRef={leftRef} peerRef={rightRef} lockRef={lockRef} />
          {render?.(left)}
        </GeoVisProvider>
      </div>
      <div style={{ ...panelBase, border: rightBorder ?? '1px solid #d4d4d8' }}>
        <MapLabel>{right.label}</MapLabel>
        <GeoVisProvider spec={rightSpec}>
          <GeoVisCanvas viewId={right.id} style={canvasStyle} />
          <MapSync selfRef={rightRef} peerRef={leftRef} lockRef={lockRef} />
          {render?.(right)}
        </GeoVisProvider>
      </div>
    </div>
  );
};

export const ColorSwatchLegend = ({
  title,
  defaultColor,
  steps,
  formatValue,
}: {
  title: string;
  defaultColor: string;
  steps: ColorStep[];
  formatValue?: (v: number) => string;
}) => {
  const fmt =
    formatValue ??
    ((v: number) => {
      return v.toLocaleString('pt-BR');
    });
  const entries: { color: string; label: string }[] = [
    { color: defaultColor, label: `< ${fmt(steps[0].threshold)}` },
    ...steps.map((s, i) => {
      return {
        color: s.color,
        label:
          i < steps.length - 1
            ? `${fmt(s.threshold)} – ${fmt(steps[i + 1].threshold)}`
            : `\u2265 ${fmt(s.threshold)}`,
      };
    }),
  ];

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {entries.map((e, i) => {
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                background: e.color,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#4b5563' }}>{e.label}</span>
          </div>
        );
      })}
    </div>
  );
};
