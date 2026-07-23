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
      geometry: 'polygon',
      geographyIds: ['geo-municipio'],
      metricIds: ['metric-populacao', 'metric-densidade-populacional'],
      source: 'ibge',
      temporal: { start: '2022-01-01', end: '2022-12-31' },
    },
    {
      id: 'dataset-perfil-socioeconomico',
      label: 'Perfil Socioeconômico',
      description: 'Indicadores socioeconômicos por UF e município.',
      geometry: 'polygon',
      geographyIds: ['geo-uf', 'geo-municipio'],
      metricIds: [
        'metric-idh',
        'metric-razao-urbano-rural',
        'metric-taxa-alfabetizacao',
      ],
      source: 'ipea',
    },
    {
      id: 'dataset-infra-distancias',
      label: 'Distâncias a Equipamentos Urbanos',
      description:
        'Distância de cada ponto de interesse ao hospital mais próximo.',
      geometry: 'point',
      geographyIds: ['geo-poi-equipamentos'],
      metricIds: ['metric-distancia-hospital'],
      // `source` intentionally omitted — exercises the field's optionality.
    },
    {
      id: 'dataset-uso-solo-h3',
      label: 'Uso do Solo (Grade H3)',
      description: 'População estimada por célula da malha H3.',
      geometry: 'polygon',
      geographyIds: ['geo-h3-grid'],
      metricIds: ['metric-populacao'],
      source: 'ibge',
    },
    {
      id: 'dataset-imoveis-rurais',
      label: 'Imóveis Rurais (CAR)',
      description: 'Distância de cada imóvel rural ao hospital mais próximo.',
      geometry: 'polygon',
      geographyIds: ['geo-sicar-imovel'],
      metricIds: ['metric-distancia-hospital'],
      source: 'sicar',
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
      field: 'regiao',
      kind: 'categorical',
      domain: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
    },
    { field: 'ano', kind: 'temporal' },
    { field: 'populacao_min', kind: 'numeric' },
  ],
  permissions: {
    roles: ['admin', 'viewer'],
  },
};
