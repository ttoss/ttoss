# Plano: Simplificar mergeResolvedLayers + permitir paint customizado

## Mudanças

### 1. `src/spec/mapTypeDefaults.ts`

**a) `applyResolved` — remover verificação mapType (linhas 117-122)**

Antes:

```typescript
const layers =
  userLayers.length > 0 && spec.mapType === 'proportionalCircles'
    ? mergeResolvedLayers(userLayers, resolved.layers)
    : userLayers.length > 0
      ? userLayers
      : resolved.layers;
```

Depois:

```typescript
const layers =
  userLayers.length > 0
    ? mergeResolvedLayers(userLayers, resolved.layers)
    : resolved.layers;
```

**b) `mergeResolvedLayers` — adicionar merge de `paint` (após linha 58)**

Adicionar dentro do `if (match)`:

```typescript
if (rl.paint) {
  match.paint = { ...rl.paint, ...match.paint };
}
```

### 2. `tests/unit/tests/dotDensity.test.ts` (linhas 131-149)

Teste `'preserves user-provided layers'`:

- User layer ganhará `mapDataId` e `paint` do resolved layer
- Verificar que `id` e `sourceId` do usuário foram preservados
- Verificar que `mapDataId` e `paint` foram injetados

### 3. `tests/unit/tests/choropleth.test.ts` (linhas 615-636)

Teste `'preserves user-provided layers'`:

- User layer ganhará `mapDataId` e `activeLegendId`
- Verificar injeção dos campos

### 4. `tests/unit/tests/mapTypeDefaults.test.ts` (linhas 199-225)

Teste `'does not override user-provided layers'`:

- User layer ganhará `mapDataId` e `activeLegendId`
- Verificar injeção dos campos

## Comportamento esperado

Usuário pode fornecer layers parciais com `paint`:

```typescript
layers: [
  {
    id: 'my-dots',
    sourceId: 'points',
    geometry: 'point',
    paint: { circleColor: '#FF0000' }, // só a cor, resto vem do default
  },
];
```

Resultado: `paint = { circleColor: '#FF0000', circleRadius: 2.4, circleStrokeColor: '#FAF9F7', circleStrokeWidth: 0.5 }`
