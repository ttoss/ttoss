// import { renderHook, act } from '@testing-library/react-hooks';
// import { useGoogleMaps } from '..';

// const mapObject = { map: 'object' };
// const googleMock = {
//   maps: {
//     Map: jest.fn().mockImplementation(() => mapObject),
//   },
// };

import { act, render, screen } from '@ttoss/test-utils';

import { GoogleMapsProvider, useGoogleMaps } from './';

const mapObject = { map: 'object' };
const googleMock = {
  maps: {
    Map: jest.fn().mockImplementation(() => mapObject),
  },
};

beforeAll(() => {
  (global.google as unknown) = googleMock;
});

beforeEach(() => {
  document.querySelectorAll('script')[0]?.remove();
});

const RenderStatus = () => {
  const { status } = useGoogleMaps();
  return (
    <div>
      <span>{status}</span>
    </div>
  );
};

const loadEvent = new Event('load');

const apiKey = 'apiKey';

it('should display correct status', () => {
  render(
    <GoogleMapsProvider apiKey={apiKey}>
      <RenderStatus />
    </GoogleMapsProvider>
  );

  expect(screen.getByText('loading')).toBeInTheDocument();

  act(() => {
    document.querySelectorAll('script')[0].dispatchEvent(loadEvent);
  });

  expect(screen.getByText('ready')).toBeInTheDocument();
});

it.each([
  [{ apiKey }, `https://maps.googleapis.com/maps/api/js?key=${apiKey}`],
  [
    { apiKey, language: 'pt-BR' },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=pt-BR`,
  ],
  [
    { apiKey, language: 'pt-BR', libraries: ['places'] },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`,
  ],
  [
    { apiKey, language: 'pt-BR', libraries: ['places', 'geometry'] },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=pt-BR`,
  ],
])('Google Maps API src %#', (props, src) => {
  render(
    <GoogleMapsProvider {...(props as any)}>
      <RenderStatus />
    </GoogleMapsProvider>
  );

  expect(document.querySelectorAll('script')[0].src).toEqual(src);
});
