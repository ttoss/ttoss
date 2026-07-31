import type { Catalog } from 'src/schema/types';

/**
 * A catalog exercising every field, modeled on real Brazilian public-data
 * sources so the D7 domain/source-compatibility claims are concrete: an
 * IBGE administrative hierarchy (UF → município, with `cameraFraming` on the
 * UF level) → an H3 spatial-index grid carrying a `nominal` land-use metric
 * with `categories`, a SICAR rural-parcel geography, a POI collection, a
 * demografia dataset with a density metric and a named temporal `field`, an
 * infrastructure dataset with a distance metric, and an IPEA socioeconomic
 * dataset using the index/ratio/rate kinds.
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
      cameraFraming: {
        bbox: [-74.0, -34.0, -28.8, 5.3],
        center: [-51.9, -14.2],
        zoom: 3.5,
      },
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
    {
      id: 'metric-classe-uso-solo',
      label: 'Classe de Uso do Solo',
      description: 'Classificação categórica do uso predominante do solo.',
      kind: 'nominal',
      categories: [
        {
          id: 'urbano',
          label: 'Urbano',
          order: 1,
          colorToken: 'display.categorical.1',
        },
        {
          id: 'rural',
          label: 'Rural',
          order: 2,
          colorToken: 'display.categorical.2',
        },
        {
          id: 'preservacao',
          label: 'Área de Preservação',
          order: 3,
          colorToken: 'display.categorical.3',
        },
      ],
      nullPolicy: 'hide',
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
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
        extent: [
          { code: '35', label: 'São Paulo' },
          { code: '31', label: 'Minas Gerais' },
        ],
      },
      temporal: {
        dimensionStatus: 'described',
        temporalGrain: 'P1Y',
        extent: [{ start: '2010-01-01', end: '2022-12-31' }],
        temporalHistory: 'snapshot',
        field: 'ano_referencia',
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
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
      },
      temporal: {
        dimensionStatus: 'described',
        temporalGrain: 'P1Y',
        temporalHistory: 'revised',
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
        dimensionStatus: 'described',
        spatialGeometry: 'point',
      },
      temporal: {
        dimensionStatus: 'unknown',
      },
    },
    {
      id: 'dataset-uso-solo-h3',
      label: 'Uso do Solo (Grade H3)',
      description: 'População estimada por célula da malha H3.',
      geographyIds: ['geo-h3-grid'],
      metricIds: ['metric-populacao', 'metric-classe-uso-solo'],
      source: 'ibge',
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
      },
      temporal: {
        dimensionStatus: 'described',
        temporalGrain: 'P1Y',
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
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
      },
      temporal: {
        dimensionStatus: 'not_applicable',
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
      domain: { mode: 'runtime' },
    },
    {
      id: 'filter-ano',
      label: 'Ano de referência',
      property: 'ano',
      kind: 'temporal',
      sourceDatasetId: 'dataset-demografia-municipio',
      operators: ['gte', 'lte'],
      domain: { mode: 'runtime' },
    },
    {
      id: 'filter-populacao',
      label: 'População',
      property: 'populacao',
      kind: 'numeric',
      sourceDatasetId: 'dataset-demografia-municipio',
      metricId: 'metric-populacao',
      operators: ['gte', 'lte'],
      domain: { mode: 'runtime' },
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
