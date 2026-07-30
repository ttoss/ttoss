import { validateCatalog } from 'src/validateCatalog';

describe('Cozinhas Solidárias example catalog', () => {
  test('example catalog validates against PRD-004 schema', () => {
    const exampleCatalog = {
      version: '1.0.0',
      domain: 'cozsolidarias',
      datasets: [
        {
          id: 'cozinhas-pontos',
          label: 'Cozinhas Solidárias (pontos)',
          description:
            'Cadastro de cozinhas solidárias com coordenadas geográficas',
          spatial: { status: 'described' as const, geometry: 'point' as const },
          geographyIds: ['geo-cozinha', 'geo-municipio', 'geo-estado'],
          metricIds: ['pop-habitantes'],
          source: 'cozsolidarias',
        },
        {
          id: 'municipios-contorno',
          label: 'Contornos de municípios',
          description: 'Malha municipal (polígonos) do Brasil',
          spatial: {
            status: 'described' as const,
            geometry: 'polygon' as const,
          },
          geographyIds: ['geo-municipio'],
          metricIds: ['pop-habitantes', 'cadunico-cadastrados'],
          source: 'ibge',
        },
      ],
      metrics: [
        {
          id: 'pop-habitantes',
          label: 'População residente',
          description: 'Total de habitantes (Censo 2022)',
          kind: 'count' as const,
          unit: 'pessoas',
          nullPolicy: 'zero' as const,
        },
        {
          id: 'cadunico-cadastrados',
          label: 'Pessoas no Cadastro Único',
          description: 'Total de pessoas no Cadastro Único',
          kind: 'count' as const,
          unit: 'pessoas',
          nullPolicy: 'zero' as const,
        },
      ],
      geographies: [
        {
          id: 'geo-cozinha',
          label: 'Cozinha',
          description: 'Localização de uma cozinha solidária (ponto)',
          kind: 'poi' as const,
        },
        {
          id: 'geo-municipio',
          label: 'Município',
          description: 'Limite de um município',
          kind: 'administrative' as const,
          level: 2,
          codeScheme: 'ibge:municipio',
        },
        {
          id: 'geo-estado',
          label: 'Estado',
          description: 'Unidade federativa (estado)',
          kind: 'administrative' as const,
          level: 1,
          codeScheme: 'ibge:estado',
        },
      ],
      joins: [
        {
          from: 'cozinhas-pontos',
          to: 'geo-municipio',
          on: {
            left: 'codigo_municipio_ibge',
            right: 'codigo_ibge',
          },
          cardinality: 'm:1' as const,
        },
      ],
      mapTypes: [
        {
          name: 'choropleth' as const,
          supportedGeometries: ['polygon'],
          metricKinds: ['count', 'rate'],
        },
        {
          name: 'dotDensity' as const,
          supportedGeometries: ['point'],
          metricKinds: ['count'],
        },
      ],
      filters: [],
    };

    const result = validateCatalog(exampleCatalog);

    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.catalog.version).toBe('1.0.0');
      expect(result.catalog.domain).toBe('cozsolidarias');
      expect(result.catalog.datasets).toHaveLength(2);
      expect(result.catalog.metrics).toHaveLength(2);
      expect(result.catalog.geographies).toHaveLength(3);
      expect(result.catalog.joins).toHaveLength(1);
    }
  });
});
