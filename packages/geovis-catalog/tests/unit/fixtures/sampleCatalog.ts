import type { Catalog } from 'src/schema/types';

/**
 * A catalog exercising every field, modeled on real Brazilian public-data
 * sources so the D7 domain/source-compatibility claims are concrete: an
 * IBGE administrative hierarchy (UF → município), an H3 spatial-index grid,
 * a SICAR rural-parcel geography, a POI collection, a demografia dataset
 * with a density metric, an infrastructure dataset with a distance metric,
 * and an IPEA socioeconomic dataset using existing index/ratio/rate kinds.
 */
export const sampleCatalog: Catalog = {
  version: '2026-Q3',
  domain: 'br',
  geographies: [
    {
      id: 'geo-uf',
      label: 'Unidade da Federação',
      description:
        'Estados e o Distrito Federal, conforme a malha territorial do IBGE.',
      kind: 'administrative',
      level: 1,
      codeScheme: 'ibge:uf',
    },
    {
      id: 'geo-municipio',
      label: 'Município',
      description:
        'Municípios brasileiros, conforme a malha territorial do IBGE.',
      kind: 'administrative',
      level: 2,
      parentId: 'geo-uf',
      codeScheme: 'ibge:municipio',
    },
    {
      id: 'geo-h3-grid',
      label: 'Malha H3 (resolução 8)',
      description: 'Malha de indexação espacial hexagonal, resolução 8.',
      kind: 'grid',
      codeScheme: 'h3',
      resolution: 'h3:8',
    },
    {
      id: 'geo-sicar-imovel',
      label: 'Imóvel Rural (CAR)',
      description: 'Perímetro de imóveis rurais cadastrados no SICAR.',
      kind: 'custom',
      codeScheme: 'sicar:imovel',
    },
    {
      id: 'geo-poi-equipamentos',
      label: 'Equipamentos Urbanos',
      description: 'Pontos de interesse: hospitais, escolas e postos de saúde.',
      kind: 'poi',
    },
  ],
  metrics: [
    {
      id: 'metric-populacao',
      label: 'População',
      description: 'População total residente.',
      kind: 'count',
      nullPolicy: 'zero',
    },
    {
      id: 'metric-taxa-alfabetizacao',
      label: 'Taxa de Alfabetização',
      description: 'Percentual da população alfabetizada.',
      unit: '%',
      kind: 'rate',
      formatter: 'percent',
      nullPolicy: 'hide',
    },
    {
      id: 'metric-razao-urbano-rural',
      label: 'Razão Urbano/Rural',
      description: 'Razão entre população urbana e rural.',
      kind: 'ratio',
      nullPolicy: 'hide',
    },
    {
      id: 'metric-idh',
      label: 'IDH',
      description: 'Índice de Desenvolvimento Humano.',
      aliases: ['índice de desenvolvimento humano'],
      kind: 'index',
      nullPolicy: 'hide',
    },
    {
      id: 'metric-densidade-populacional',
      label: 'Densidade Populacional',
      description: 'População por área.',
      unit: 'hab/km²',
      kind: 'density',
      nullPolicy: 'hide',
    },
    {
      id: 'metric-distancia-hospital',
      label: 'Distância ao Hospital mais Próximo',
      description: 'Distância em linha reta até o hospital mais próximo.',
      unit: 'km',
      kind: 'distance',
      formatter: 'number',
      nullPolicy: 'explain',
    },
  ],
  datasets: [
    {
      id: 'dataset-demografia-municipio',
      label: 'Demografia Municipal',
      description: 'População e densidade populacional por município.',
      geographyIds: ['geo-municipio'],
      metricIds: ['metric-populacao', 'metric-densidade-populacional'],
      source: 'ibge',
      spatial: {
        status: 'described',
        geometry: 'polygon',
        extent: [
          { code: '35', label: 'São Paulo' },
          { code: '31', label: 'Minas Gerais' },
        ],
      },
      temporal: {
        status: 'described',
        grain: 'P1Y',
        extent: [{ start: '2010-01-01', end: '2022-12-31' }],
        history: 'snapshot',
      },
      columns: {
        'metric-populacao': 'populacao',
        'metric-densidade-populacional': 'densidade',
      },
    },
    {
      id: 'dataset-perfil-socioeconomico',
      label: 'Perfil Socioeconômico',
      description: 'Indicadores socioeconômicos por UF e município.',
      geographyIds: ['geo-uf', 'geo-municipio'],
      metricIds: [
        'metric-idh',
        'metric-razao-urbano-rural',
        'metric-taxa-alfabetizacao',
      ],
      source: 'ipea',
      spatial: {
        status: 'described',
        geometry: 'polygon',
      },
      temporal: {
        status: 'described',
        grain: 'P1Y',
        history: 'revised',
      },
    },
    {
      id: 'dataset-infra-distancias',
      label: 'Distâncias a Equipamentos Urbanos',
      description:
        'Distância de cada ponto de interesse ao hospital mais próximo.',
      geographyIds: ['geo-poi-equipamentos'],
      metricIds: ['metric-distancia-hospital'],
      spatial: {
        status: 'described',
        geometry: 'point',
      },
      temporal: {
        status: 'unknown',
      },
    },
    {
      id: 'dataset-uso-solo-h3',
      label: 'Uso do Solo (Grade H3)',
      description: 'População estimada por célula da malha H3.',
      geographyIds: ['geo-h3-grid'],
      metricIds: ['metric-populacao'],
      source: 'ibge',
      spatial: {
        status: 'described',
        geometry: 'polygon',
      },
      temporal: {
        status: 'described',
        grain: 'P1Y',
      },
    },
    {
      id: 'dataset-imoveis-rurais',
      label: 'Imóveis Rurais (CAR)',
      description: 'Distância de cada imóvel rural ao hospital mais próximo.',
      geographyIds: ['geo-sicar-imovel'],
      metricIds: ['metric-distancia-hospital'],
      source: 'sicar',
      spatial: {
        status: 'described',
        geometry: 'polygon',
      },
      temporal: {
        status: 'not_applicable',
      },
    },
  ],
  series: [
    {
      id: 'series-populacao-municipio-anual',
      metricId: 'metric-populacao',
      spatialGrain: {
        geographyId: 'geo-municipio',
        label: 'Município',
      },
      temporalGrain: 'P1Y',
      dimensions: [
        {
          id: 'dim-sexo',
          label: 'Sexo',
          kind: 'categorical',
          property: 'sexo',
        },
        {
          id: 'dim-faixa-etaria',
          label: 'Faixa Etária',
          kind: 'categorical',
          property: 'faixa_etaria',
        },
      ],
    },
    {
      id: 'series-densidade-h3-anual',
      metricId: 'metric-densidade-populacional',
      spatialGrain: {
        geographyId: 'geo-h3-grid',
        label: 'Grade H3 (8)',
      },
      temporalGrain: 'P1Y',
    },
  ],
  joins: [
    {
      from: 'dataset-demografia-municipio',
      to: 'geo-municipio',
      on: { left: 'codigo_municipio', right: 'id' },
      cardinality: '1:1',
    },
    {
      from: 'dataset-perfil-socioeconomico',
      to: 'geo-municipio',
      on: { left: 'codigo_municipio', right: 'id' },
      cardinality: '1:1',
    },
    {
      from: 'dataset-imoveis-rurais',
      to: 'geo-sicar-imovel',
      on: { left: 'codigo_imovel', right: 'id' },
      cardinality: '1:1',
    },
  ],
  mapTypes: [
    {
      name: 'choropleth',
      supportedGeometries: ['polygon'],
      metricKinds: ['count', 'rate', 'ratio', 'index', 'density'],
    },
    {
      name: 'proportionalCircles',
      supportedGeometries: ['point', 'polygon'],
      metricKinds: ['count', 'distance'],
    },
    {
      name: 'dotDensity',
      supportedGeometries: ['point'],
      metricKinds: ['count'],
    },
  ],
  filters: [
    {
      id: 'filter-regiao',
      label: 'Região',
      description: 'Macrorregião do IBGE a que o município pertence.',
      aliases: ['macrorregiao'],
      property: 'regiao',
      kind: 'categorical',
      sourceGeographyId: 'geo-municipio',
      operators: ['in', 'not-in'],
      multiple: true,
      domain: {
        mode: 'values',
        values: [
          { value: 'Norte', label: 'Norte', count: 450 },
          { value: 'Nordeste', label: 'Nordeste', count: 1794 },
          { value: 'Centro-Oeste', label: 'Centro-Oeste', count: 467 },
          { value: 'Sudeste', label: 'Sudeste', count: 1668 },
          { value: 'Sul', label: 'Sul', count: 1191 },
        ],
      },
    },
    {
      id: 'filter-ano',
      label: 'Ano de referência',
      property: 'ano',
      kind: 'temporal',
      sourceDatasetId: 'dataset-demografia-municipio',
      operators: ['gte', 'lte'],
      domain: { mode: 'interval', start: '2010-01-01', end: '2022-12-31' },
    },
    {
      id: 'filter-populacao',
      label: 'População',
      property: 'populacao',
      kind: 'numeric',
      sourceDatasetId: 'dataset-demografia-municipio',
      metricId: 'metric-populacao',
      operators: ['gte', 'lte'],
      domain: { mode: 'range', min: 0, max: 12_000_000, step: 1000 },
    },
    {
      id: 'filter-distancia-hospital',
      label: 'Distância ao hospital',
      description:
        'Bounds are unknown until the rural-property rows are loaded.',
      property: 'distancia_hospital',
      kind: 'numeric',
      sourceDatasetId: 'dataset-imoveis-rurais',
      metricId: 'metric-distancia-hospital',
      operators: ['lte'],
      domain: { mode: 'runtime' },
    },
  ],
  permissions: {
    roles: ['admin', 'viewer'],
  },
};
