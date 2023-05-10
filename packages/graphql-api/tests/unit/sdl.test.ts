import { schemaComposer } from '../schemaComposer';

test('SDL should always match snapshot', () => {
  const sdl = schemaComposer.toSDL();
  expect(sdl).toMatchSnapshot();
});
