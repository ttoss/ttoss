import { getNodeRuntime, getNodeVersion } from '../../../src/deploy/runtime';

describe('runtime utilities', () => {
  describe('getNodeRuntime', () => {
    test('should return default runtime when no parameters provided', () => {
      expect(getNodeRuntime()).toBe('nodejs24.x');
    });

    test('should return runtime from version parameter', () => {
      expect(getNodeRuntime({ version: '20' })).toBe('nodejs20.x');
      expect(getNodeRuntime({ version: '22' })).toBe('nodejs22.x');
      expect(getNodeRuntime({ version: '24' })).toBe('nodejs24.x');
    });

    test('should return runtime parameter when provided', () => {
      expect(getNodeRuntime({ runtime: 'nodejs20.x' })).toBe('nodejs20.x');
      expect(getNodeRuntime({ runtime: 'nodejs22.x' })).toBe('nodejs22.x');
    });

    test('should prefer runtime parameter over version parameter', () => {
      expect(getNodeRuntime({ version: '20', runtime: 'nodejs22.x' })).toBe(
        'nodejs22.x'
      );
    });

    test('should handle empty object', () => {
      expect(getNodeRuntime({})).toBe('nodejs24.x');
    });
  });

  describe('getNodeVersion', () => {
    test('should return default version when no parameters provided', () => {
      expect(getNodeVersion()).toBe('24');
    });

    test('should extract version from runtime parameter', () => {
      expect(getNodeVersion({ runtime: 'nodejs20.x' })).toBe('20');
      expect(getNodeVersion({ runtime: 'nodejs22.x' })).toBe('22');
      expect(getNodeVersion({ runtime: 'nodejs24.x' })).toBe('24');
    });

    test('should handle empty object', () => {
      expect(getNodeVersion({})).toBe('24');
    });
  });
});
