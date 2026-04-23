/**
 * Merges population CSV data (by sex and age group) into the
 * distritos-sp-populacao-idosa.minimal.json fixture.
 *
 * Naming convention (matches existing properties):
 *   pop_{faixa_etaria}_{ano}
 *   e.g. pop_00_04_2020, pop_75_mais_2025
 *
 * Mapping: cd_distrit (int) + 80000 = cod_distr in CSV
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = '/home/triangulos/Downloads/evolucao_msp_pop_sexo_idade(1).csv';
const JSON_PATH = resolve(
  __dirname,
  '../src/fixtures/distritos-sp-populacao-idosa.minimal.json'
);

// ── 1. Parse CSV ──────────────────────────────────────────────────────────────
// Structure: { [cod_distr]: { [ano]: { [idadeLabel]: totalPop } } }
const lines = readFileSync(CSV_PATH, 'latin1').split('\n');

/** @type {Record<number, Record<number, Record<string, number>>>} */
const csvData = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split(';');
  const codDistr = parseInt(parts[0]);
  const ano = parseInt(parts[2]);
  const idade = parts[4].trim(); // e.g. "00 a 04", "75 e +"
  const populacao = parseInt(parts[5]);

  if (!csvData[codDistr]) csvData[codDistr] = {};
  if (!csvData[codDistr][ano]) csvData[codDistr][ano] = {};
  csvData[codDistr][ano][idade] =
    (csvData[codDistr][ano][idade] || 0) + populacao; // sum Homens + Mulheres
}

// ── 2. Age-label → property key ───────────────────────────────────────────────
// "00 a 04" → "pop_00_04"
// "75 e +"  → "pop_75_mais"
function ageToKey(idadeLabel) {
  if (idadeLabel.includes('e +')) {
    const start = idadeLabel.split(' ')[0]; // "75"
    return `pop_${start}_mais`;
  }
  const [a, b] = idadeLabel.split(' a '); // ["00", "04"]
  return `pop_${a}_${b}`;
}

// ── 3. Update JSON ────────────────────────────────────────────────────────────
const json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

let matched = 0;
let missing = 0;

for (const feature of json.data[0].geojson.features) {
  const cdDistrit = parseInt(feature.properties.cd_distrit);
  const codDistr = cdDistrit + 80000;

  if (!csvData[codDistr]) {
    console.warn(`No CSV data found for cd_distrit=${feature.properties.cd_distrit} (cod_distr=${codDistr})`);
    missing++;
    continue;
  }

  for (const [ano, ageMap] of Object.entries(csvData[codDistr])) {
    for (const [idadeLabel, pop] of Object.entries(ageMap)) {
      const propName = `${ageToKey(idadeLabel)}_${ano}`;
      feature.properties[propName] = pop;
    }
  }

  matched++;
}

console.log(`Updated ${matched} features, ${missing} not found in CSV.`);

// ── 4. Write back ─────────────────────────────────────────────────────────────
writeFileSync(JSON_PATH, JSON.stringify(json, null, 2));
console.log('Done →', JSON_PATH);
