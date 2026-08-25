import type { Catalog } from 'src/schema/types';

/**
 * A catalog exercising every field, modeled on real Brazilian public-data
 * sources so the D7 domain/source-compatibility claims are concrete: an
 * IBGE administrative hierarchy (UF → município, with `cameraFraming` on the
 * UF level) → an H3 spatial-index grid carrying a `nominal` land-use metric
 * with `categories`, a SICAR rural-parcel geography, a POI collection, a
 * demografia dataset with a density metric and a named temporal `field`, an
 * infrastructure dataset with a distance metric, and an IPEA socioeconomic
 * dataset. Also exercises the D16 additions absorbed from
 * `dataset_catalogue.json`: `title`/`slug`, `Collection.tags`,
 * `Dataset.generatedBy`/`.provenance`/`.access`, `DatasetField.role`/`.unit`,
 * and `Temporal.updateFrequency`/`.timezone`/structured `.field`.
 */
export const sampleCatalog: Catalog = {
  version: '2026-Q3',
  domain: 'br',
  collections: [
    {
      id: 'ibge',
      title: 'IBGE',
      slug: 'ibge',
      description:
        'Datasets geográficos e demográficos do Instituto Brasileiro de Geografia e Estatística.',
      organization: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
      sourceUrl: 'https://www.ibge.gov.br',
      publicReferenceUrl: 'https://servicodados.ibge.gov.br',
      tags: ['ibge', 'geografia', 'demografia', 'brasil', 'dados-publicos'],
    },
    {
      id: 'ipea',
      title: 'IPEA',
      slug: 'ipea',
      description:
        'Datasets socioeconômicos do Instituto de Pesquisa Econômica Aplicada.',
      organization: 'Instituto de Pesquisa Econômica Aplicada (IPEA)',
      sourceUrl: 'https://www.ipea.gov.br',
      tags: ['ipea', 'vulnerabilidade-social', 'dados-publicos'],
    },
    {
      id: 'sicar',
      title: 'SICAR',
      slug: 'sicar',
      description:
        'Base geográfica do Sistema Nacional de Cadastro Ambiental Rural.',
      organization: 'Serviço Florestal Brasileiro (SFB) — SICAR',
      sourceUrl: 'https://consulta.car.gov.br/geoservices',
      tags: ['sicar', 'car', 'imoveis-rurais', 'dados-publicos'],
    },
  ],
  geographies: [
    {
      id: 'geo-uf',
      title: 'Unidade da Federação',
      slug: 'unidade-da-federacao',
      description:
        'Estados e o Distrito Federal, conforme a malha territorial do IBGE.',
      kind: 'administrative',
      level: 1,
      codeScheme: 'ibge:uf',
      cameraFraming: {
        bbox: [-74.0, -34.0, -28.8, 5.3],
        cameraCenter: [-51.9, -14.2],
        cameraZoom: 3.5,
      },
    },
    {
      id: 'geo-municipio',
      title: 'Município',
      slug: 'municipio',
      description:
        'Municípios brasileiros, conforme a malha territorial do IBGE.',
      kind: 'administrative',
      level: 2,
      parentId: 'geo-uf',
      codeScheme: 'ibge:municipio',
    },
    {
      id: 'geo-h3-grid',
      title: 'Malha H3 (resolução 8)',
      description: 'Malha de indexação espacial hexagonal, resolução 8.',
      kind: 'grid',
      codeScheme: 'h3',
      resolution: 'h3:8',
    },
    {
      id: 'geo-sicar-imovel',
      title: 'Imóvel Rural (CAR)',
      description: 'Perímetro de imóveis rurais cadastrados no SICAR.',
      kind: 'custom',
      codeScheme: 'sicar:imovel',
    },
    {
      id: 'geo-poi-equipamentos',
      title: 'Equipamentos Urbanos',
      description: 'Pontos de interesse: hospitais, escolas e postos de saúde.',
      kind: 'poi',
    },
  ],
  metrics: [
    {
      id: 'metric-populacao',
      title: 'População',
      slug: 'populacao',
      description: 'População total residente.',
      kind: 'count',
      nullPolicy: 'zero',
    },
    {
      id: 'metric-densidade-populacional',
      title: 'Densidade Populacional',
      unit: 'hab/km²',
      description: 'População por área.',
      kind: 'density',
      nullPolicy: 'hide',
    },
    {
      id: 'metric-distancia-hospital',
      title: 'Distância ao Hospital mais Próximo',
      unit: 'km',
      description: 'Distância até hospital mais próximo.',
      kind: 'distance',
      formatter: 'number',
      nullPolicy: 'explain',
    },
    {
      id: 'metric-classe-uso-solo',
      title: 'Classe de Uso do Solo',
      description: 'Classificação categórica do uso predominante do solo.',
      kind: 'nominal',
      categories: [
        {
          id: 'urbano',
          title: 'Urbano',
          order: 1,
          colorToken: 'display.categorical.1',
        },
        {
          id: 'rural',
          title: 'Rural',
          order: 2,
          colorToken: 'display.categorical.2',
        },
        {
          id: 'preservacao',
          title: 'Área de Preservação',
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
      title: 'Demografia Municipal',
      slug: 'demografia-municipal',
      description: 'População e densidade populacional por município.',
      geographyIds: ['geo-municipio'],
      metricIds: ['metric-populacao', 'metric-densidade-populacional'],
      collectionId: 'ibge',
      generatedBy: 'scripts/generate-demografia-municipio.mjs',
      provenance: {
        url: 'https://servicodados.ibge.gov.br/api/v3/agregados/4709',
        notes: 'Censo 2022, agregado 4709.',
      },
      access: {
        level: 'public',
        containsPersonalData: false,
      },
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
        coverage: 'exhaustive',
        precision: 'not_applicable',
        srid: 4674,
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
        updateFrequency: 'annual',
        timezone: 'America/Sao_Paulo',
        field: { instant: 'ano_referencia' },
      },
      columns: {
        'metric-populacao': 'populacao',
        'metric-densidade-populacional': 'densidade',
      },
      fields: [
        { name: 'populacao', title: 'População', role: 'identifier' },
        {
          name: 'densidade',
          title: 'Densidade Populacional',
          unit: 'hab/km²',
        },
        { name: 'ano_referencia', title: 'Ano de Referência' },
        {
          name: 'renda_domicilio',
          title: 'Renda Domiciliar',
          sensible: true,
        },
      ],
    },
    {
      id: 'dataset-perfil-socioeconomico',
      title: 'Perfil Socioeconômico',
      description: 'Indicadores socioeconômicos por UF e município.',
      geographyIds: ['geo-uf', 'geo-municipio'],
      metricIds: ['metric-populacao'],
      collectionId: 'ipea',
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
      },
      temporal: {
        dimensionStatus: 'described',
        temporalGrain: 'P1Y',
        temporalHistory: 'revised',
        updateFrequency: 'irregular',
      },
    },
    {
      id: 'dataset-infra-distancias',
      title: 'Distâncias a Equipamentos Urbanos',
      description:
        'Distância de cada ponto de interesse ao hospital mais próximo.',
      geographyIds: ['geo-poi-equipamentos'],
      metricIds: ['metric-distancia-hospital'],
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'point',
        precision: 'rooftop',
      },
      temporal: {
        dimensionStatus: 'unknown',
      },
    },
    {
      id: 'dataset-uso-solo-h3',
      title: 'Uso do Solo (Grade H3)',
      description: 'População estimada por célula da malha H3.',
      geographyIds: ['geo-h3-grid'],
      metricIds: ['metric-populacao', 'metric-classe-uso-solo'],
      collectionId: 'ibge',
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
      title: 'Imóveis Rurais (CAR)',
      description: 'Distância de cada imóvel rural ao hospital mais próximo.',
      geographyIds: ['geo-sicar-imovel'],
      metricIds: ['metric-distancia-hospital'],
      collectionId: 'sicar',
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
        field: ['cod_uf', 'cod_imovel'],
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
      spatialGrain: { geographyId: 'geo-municipio', label: 'Município' },
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
      title: 'Região',
      slug: 'regiao',
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
      title: 'Ano de referência',
      property: 'ano',
      kind: 'temporal',
      sourceDatasetId: 'dataset-demografia-municipio',
      operators: ['gte', 'lte'],
      domain: { mode: 'runtime' },
    },
    {
      id: 'filter-populacao',
      title: 'População',
      property: 'populacao',
      kind: 'numeric',
      sourceDatasetId: 'dataset-demografia-municipio',
      metricId: 'metric-populacao',
      operators: ['gte', 'lte'],
      domain: { mode: 'runtime' },
    },
    {
      id: 'filter-distancia-hospital',
      title: 'Distância ao hospital',
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
