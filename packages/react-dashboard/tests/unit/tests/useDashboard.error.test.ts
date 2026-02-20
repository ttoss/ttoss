describe('useDashboard error path', () => {
  test('should throw when context is undefined', () => {
    jest.isolateModules(() => {
      jest.doMock('react', () => {
        const actual = jest.requireActual('react');
        return {
          ...actual,
          useContext: jest.fn(() => {
            return undefined;
          }),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useDashboard } = require('src/DashboardProvider');

      expect(() => {
        useDashboard();
      }).toThrow('useDashboard must be used within a DashboardProvider');
    });
  });
});
