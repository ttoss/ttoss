/**
 * The app's own file, stood in for here by the 27 capitals.
 *
 * A real deployment ships all 5.570 municipalities and the shape does not
 * change with the row count: the rows are the search index, and the key that
 * searches is the same key that frames, marks, and travels in the permalink.
 *
 * `ibge` is that key — the 7-digit municipal code, which is also what a
 * boundary mesh keys its shapes on, so a name found here addresses a shape
 * there without a second table in between. `lng`/`lat` are the seat, for the
 * case where there is no mesh to frame and the camera can only be sent to a
 * point.
 *
 * Coordinates are the urban seat, rounded; a demo does not need survey
 * precision, and `zoom` is what decides how much of the surroundings comes with
 * it. The names carry the accents the list is searched without.
 */
export interface Municipio {
  id: string;
  /** The 7-digit IBGE municipal code, and the id a boundary mesh keys on. */
  ibge: string;
  nome: string;
  uf: string;
  lng: number;
  lat: number;
}

export const MUNICIPIOS: Municipio[] = [
  {
    id: 'rio-branco',
    ibge: '1200401',
    nome: 'Rio Branco',
    uf: 'AC',
    lng: -67.81,
    lat: -9.97,
  },
  {
    id: 'maceio',
    ibge: '2704302',
    nome: 'Maceió',
    uf: 'AL',
    lng: -35.73,
    lat: -9.65,
  },
  {
    id: 'macapa',
    ibge: '1600303',
    nome: 'Macapá',
    uf: 'AP',
    lng: -51.07,
    lat: 0.03,
  },
  {
    id: 'manaus',
    ibge: '1302603',
    nome: 'Manaus',
    uf: 'AM',
    lng: -60.02,
    lat: -3.1,
  },
  {
    id: 'salvador',
    ibge: '2927408',
    nome: 'Salvador',
    uf: 'BA',
    lng: -38.5,
    lat: -12.97,
  },
  {
    id: 'fortaleza',
    ibge: '2304400',
    nome: 'Fortaleza',
    uf: 'CE',
    lng: -38.54,
    lat: -3.72,
  },
  {
    id: 'brasilia',
    ibge: '5300108',
    nome: 'Brasília',
    uf: 'DF',
    lng: -47.88,
    lat: -15.79,
  },
  {
    id: 'vitoria',
    ibge: '3205309',
    nome: 'Vitória',
    uf: 'ES',
    lng: -40.34,
    lat: -20.32,
  },
  {
    id: 'goiania',
    ibge: '5208707',
    nome: 'Goiânia',
    uf: 'GO',
    lng: -49.25,
    lat: -16.68,
  },
  {
    id: 'sao-luis',
    ibge: '2111300',
    nome: 'São Luís',
    uf: 'MA',
    lng: -44.3,
    lat: -2.53,
  },
  {
    id: 'cuiaba',
    ibge: '5103403',
    nome: 'Cuiabá',
    uf: 'MT',
    lng: -56.1,
    lat: -15.6,
  },
  {
    id: 'campo-grande',
    ibge: '5002704',
    nome: 'Campo Grande',
    uf: 'MS',
    lng: -54.62,
    lat: -20.44,
  },
  {
    id: 'belo-horizonte',
    ibge: '3106200',
    nome: 'Belo Horizonte',
    uf: 'MG',
    lng: -43.94,
    lat: -19.92,
  },
  {
    id: 'belem',
    ibge: '1501402',
    nome: 'Belém',
    uf: 'PA',
    lng: -48.5,
    lat: -1.46,
  },
  {
    id: 'joao-pessoa',
    ibge: '2507507',
    nome: 'João Pessoa',
    uf: 'PB',
    lng: -34.86,
    lat: -7.12,
  },
  {
    id: 'curitiba',
    ibge: '4106902',
    nome: 'Curitiba',
    uf: 'PR',
    lng: -49.27,
    lat: -25.43,
  },
  {
    id: 'recife',
    ibge: '2611606',
    nome: 'Recife',
    uf: 'PE',
    lng: -34.88,
    lat: -8.05,
  },
  {
    id: 'teresina',
    ibge: '2211001',
    nome: 'Teresina',
    uf: 'PI',
    lng: -42.8,
    lat: -5.09,
  },
  {
    id: 'rio-de-janeiro',
    ibge: '3304557',
    nome: 'Rio de Janeiro',
    uf: 'RJ',
    lng: -43.2,
    lat: -22.91,
  },
  {
    id: 'natal',
    ibge: '2408102',
    nome: 'Natal',
    uf: 'RN',
    lng: -35.21,
    lat: -5.79,
  },
  {
    id: 'porto-alegre',
    ibge: '4314902',
    nome: 'Porto Alegre',
    uf: 'RS',
    lng: -51.23,
    lat: -30.03,
  },
  {
    id: 'porto-velho',
    ibge: '1100205',
    nome: 'Porto Velho',
    uf: 'RO',
    lng: -63.9,
    lat: -8.76,
  },
  {
    id: 'boa-vista',
    ibge: '1400100',
    nome: 'Boa Vista',
    uf: 'RR',
    lng: -60.67,
    lat: 2.82,
  },
  {
    id: 'florianopolis',
    ibge: '4205407',
    nome: 'Florianópolis',
    uf: 'SC',
    lng: -48.55,
    lat: -27.59,
  },
  {
    id: 'sao-paulo',
    ibge: '3550308',
    nome: 'São Paulo',
    uf: 'SP',
    lng: -46.63,
    lat: -23.55,
  },
  {
    id: 'aracaju',
    ibge: '2800308',
    nome: 'Aracaju',
    uf: 'SE',
    lng: -37.07,
    lat: -10.91,
  },
  {
    id: 'palmas',
    ibge: '1721000',
    nome: 'Palmas',
    uf: 'TO',
    lng: -48.33,
    lat: -10.18,
  },
];
