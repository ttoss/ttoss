// import { renderHook, act } from '@testing-library/react-hooks';
// import { useGoogleMaps } from '..';

// const mapObject = { map: 'object' };
// const googleMock = {
//   maps: {
//     Map: jest.fn().mockImplementation(() => mapObject),
//   },
// };

import { GoogleMapsProvider, useGoogleMaps } from 'src/index';
import { act, render, screen } from '@ttoss/test-utils';

const mapObject = { map: 'object' };
const googleMock = {
  maps: {
    Map: jest.fn().mockImplementation(() => {
      return mapObject;
    }),
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

test('should display correct status', () => {
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

test.each([
  [
    { apiKey },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`,
  ],
  [
    {
      apiKey,
      loading: false,
    },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}`,
  ],
  [
    { apiKey, language: 'pt-BR' },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&language=pt-BR`,
  ],
  [
    { apiKey, language: 'pt-BR', libraries: ['places'] },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places&language=pt-BR`,
  ],
  [
    { apiKey, language: 'pt-BR', libraries: ['places', 'geometry'] },
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,geometry&language=pt-BR`,
  ],
])('Google Maps API src %#', (props, src) => {
  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <GoogleMapsProvider {...(props as any)}>
      <RenderStatus />
    </GoogleMapsProvider>
  );

  expect(document.querySelectorAll('script')[0].src).toEqual(src);
});
