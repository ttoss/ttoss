HTMLCanvasElement.prototype.getContext = jest.fn(() => {
  return {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    lineWidth: 1,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    font: '12px sans-serif',
  } as unknown as CanvasRenderingContext2D;
});
