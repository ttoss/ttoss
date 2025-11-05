/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@ttoss/test-utils/react';

import { Menu } from '../../../src/components/Menu';

describe('Menu', () => {
  test('opens when trigger is clicked', () => {
    render(
      <Menu>
        <div>Menu Content</div>
      </Menu>
    );

    // trigger button should open the menu
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
  });

  test('closes when clicking outside (mousedown)', () => {
    render(
      <Menu>
        <div>Menu Content</div>
      </Menu>
    );

    // open
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Menu Content')).toBeInTheDocument();

    // clicking outside should close (handler listens to mousedown)
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
  });

  test('toggle updates aria-expanded on trigger', () => {
    render(
      <Menu>
        <div>Menu Content</div>
      </Menu>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking inside the panel does not close it', () => {
    render(
      <Menu>
        <div>Menu Content</div>
      </Menu>
    );

    // open
    fireEvent.click(screen.getByRole('button'));
    const content = screen.getByText('Menu Content');
    expect(content).toBeInTheDocument();

    // clicking inside the panel shouldn't close it
    fireEvent.mouseDown(content);
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
  });

  test('panel is rendered into document.body (portal)', () => {
    render(
      <Menu>
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByRole('button'));
    const content = screen.getByText('Menu Content');
    // closest('body') should find the body element as the portal mount is on document.body
    expect(content.closest('body')).toBe(document.body);
  });

  test('applies width from sx prop (number) to the panel element', async () => {
    render(
      <Menu sx={{ width: 400 }}>
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByRole('button'));

    // wait for layout effect + RAF to run and inline style to be applied
    await waitFor(() => {
      const content = screen.getByText('Menu Content');
      let node = content.parentElement;
      while (node && node !== document.body) {
        // break if this element has an inline width (more robust than checking inline position)
        if (node.style && node.style.width) break;
        // fallback: also accept if the style attribute text contains "width"
        const styleAttr = node.getAttribute && node.getAttribute('style');
        if (styleAttr && /width\s*:\s*[^;]+/.test(styleAttr)) break;
        node = node.parentElement;
      }
      expect(node).toBeTruthy();
      if (!node) return;
      const inlineStyle =
        node.style.width ||
        (node.getAttribute('style') || '')
          .match(/width\s*:\s*([^;]+)/)?.[1]
          ?.trim();
      expect(inlineStyle).toBe('400px');
    });
  });

  test('does not apply inline width when sx has no width keys', async () => {
    render(
      <Menu sx={{ color: 'red' }}>
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const content = screen.getByText('Menu Content');
      let node = content.parentElement;
      while (node && node !== document.body) {
        const styleAttr = node.getAttribute && node.getAttribute('style');
        if (
          (node.style && node.style.width) ||
          (styleAttr && /width\s*:\s*[^;]+/.test(styleAttr))
        )
          break;
        node = node.parentElement;
      }
      // if we found an element with width -> fail, else pass
      if (!node) {
        expect(null).toBeNull(); // no inline width found - pass path
        return;
      }
      const found =
        node.style.width ||
        (node.getAttribute('style') || '').match(/width\s*:\s*([^;]+)/)?.[1];
      expect(found).toBeFalsy();
    });
  });

  test('applies width when sx.width is a string (keeps string)', async () => {
    render(
      <Menu sx={{ width: '300px' }}>
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const content = screen.getByText('Menu Content');
      let node = content.parentElement;
      while (node && node !== document.body) {
        if (node.style && node.style.width) break;
        const styleAttr = node.getAttribute && node.getAttribute('style');
        if (styleAttr && /width\s*:\s*[^;]+/.test(styleAttr)) break;
        node = node.parentElement;
      }
      expect(node).toBeTruthy();
      if (!node) return;
      const widthStr =
        node.style.width ||
        (node.getAttribute('style') || '')
          .match(/width\s*:\s*([^;]+)/)?.[1]
          ?.trim();
      expect(widthStr).toBe('300px');
    });
  });

  test('uses last value when sx.width is responsive array', async () => {
    render(
      <Menu sx={{ width: ['200px', 500] }}>
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const content = screen.getByText('Menu Content');
      let node = content.parentElement;
      while (node && node !== document.body) {
        if (node.style && node.style.width) break;
        const styleAttr = node.getAttribute && node.getAttribute('style');
        if (styleAttr && /width\s*:\s*[^;]+/.test(styleAttr)) break;
        node = node.parentElement;
      }
      expect(node).toBeTruthy();
      if (!node) return;
      const widthStr =
        node.style.width ||
        (node.getAttribute('style') || '')
          .match(/width\s*:\s*([^;]+)/)?.[1]
          ?.trim();
      // last responsive value was number 500, code should convert to '500px'
      expect(widthStr).toBe('500px');
    });
  });

  test('retries compute when panel width is initially 0 using RAF and sets fixed position', async () => {
    // spy and control getBoundingClientRect to simulate panel width 0 first, then non-zero
    const originalGetRect = Element.prototype.getBoundingClientRect;
    let divCallCount = 0;
    const gbcrSpy = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        const tag = this.tagName;
        if (tag === 'BUTTON') {
          return {
            left: 100,
            width: 40,
            right: 140,
            top: 100,
            bottom: 140,
            height: 40,
          } as DOMRect;
        }
        // assume panel is a DIV
        if (tag === 'DIV') {
          divCallCount += 1;
          if (divCallCount === 1) {
            // first measurement: width 0 -> triggers requestAnimationFrame retry
            return {
              left: 0,
              width: 0,
              right: 0,
              top: 0,
              bottom: 20,
              height: 20,
            } as DOMRect;
          }
          // subsequent measurement: non-zero width
          return {
            left: 120,
            width: 220,
            right: 340,
            top: 160,
            bottom: 260,
            height: 100,
          } as DOMRect;
        }
        // fallback
        return originalGetRect.call(this);
      });

    // make requestAnimationFrame synchronous for the test so compute is retried immediately
    const rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });

    try {
      render(
        <Menu>
          <div>Menu Content</div>
        </Menu>
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const content = screen.getByText('Menu Content');
        // climb ancestors to find the panel
        let node = content.parentElement;
        while (node && node !== document.body) {
          const styleAttr = node.getAttribute && node.getAttribute('style');
          if (
            (node.style && node.style.position === 'fixed') ||
            (styleAttr && /position\s*:\s*fixed/.test(styleAttr))
          ) {
            break;
          }
          node = node.parentElement;
        }
        expect(node).toBeTruthy();
        if (!node) return;
        // assert that compute persisted position: fixed and left/top set
        const pos =
          node.style.position ||
          (node.getAttribute('style') || '')
            .match(/position\s*:\s*([^;]+)/)?.[1]
            ?.trim();
        const left =
          node.style.left ||
          (node.getAttribute('style') || '')
            .match(/left\s*:\s*([^;]+)/)?.[1]
            ?.trim();
        const top =
          node.style.top ||
          (node.getAttribute('style') || '')
            .match(/top\s*:\s*([^;]+)/)?.[1]
            ?.trim();
        expect(pos).toBe('fixed');
        expect(left).toBeTruthy();
        expect(top).toBeTruthy();
      });
    } finally {
      gbcrSpy.mockRestore();
      rafSpy.mockRestore();
    }
  });

  test('places panel above when not enough space below', async () => {
    const originalGetRect = Element.prototype.getBoundingClientRect;
    const gbcrSpy = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        const tag = this.tagName;
        if (tag === 'BUTTON') {
          // button near bottom so spaceBelow small
          return {
            left: 100,
            width: 40,
            right: 140,
            top: 700,
            bottom: 740,
            height: 40,
          } as DOMRect;
        }
        if (tag === 'DIV') {
          // panel size tall so it won't fit below
          return {
            left: 0,
            width: 200,
            right: 200,
            top: 0,
            bottom: 300,
            height: 300,
          } as DOMRect;
        }
        return originalGetRect.call(this);
      });

    // make RAF synchronous
    const rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });

    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;

    try {
      // set viewport height small to force above placement without using `any`
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        configurable: true,
      });

      render(
        <Menu>
          <div>Menu Content</div>
        </Menu>
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const content = screen.getByText('Menu Content');
        let node = content.parentElement;
        while (node && node !== document.body) {
          if (node.style && node.style.position === 'fixed') break;
          const styleAttr = node.getAttribute && node.getAttribute('style');
          if (styleAttr && /position\s*:\s*fixed/.test(styleAttr)) break;
          node = node.parentElement;
        }
        expect(node).toBeTruthy();
        if (!node) return;
        // top should be above trigger (i.e., less than trigger bottom)
        const topRaw =
          node.style.top ||
          (node.getAttribute('style') || '').match(/top\s*:\s*([^;]+)/)?.[1] ||
          '0';
        const topVal = parseInt(String(topRaw).replace('px', ''), 10);
        expect(topVal).toBeLessThan(700);
      });
    } finally {
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
      });
      gbcrSpy.mockRestore();
      rafSpy.mockRestore();
    }
  });

  test('schedules RAF and cancelAnimationFrame is called on close', async () => {
    const rafMock = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => {
        return 123;
      });
    const cancelMock = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    try {
      render(
        <Menu>
          <div>Menu Content</div>
        </Menu>
      );

      // open (registers RAF and listeners)
      fireEvent.click(screen.getByRole('button'));

      // close (cleanup should call cancelAnimationFrame with the raf id)
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(cancelMock).toHaveBeenCalledWith(123);
      });
    } finally {
      rafMock.mockRestore();
      cancelMock.mockRestore();
    }
  });

  test('adds resize and scroll listeners (scroll with capture true)', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');

    try {
      render(
        <Menu>
          <div>Menu Content</div>
        </Menu>
      );

      fireEvent.click(screen.getByRole('button'));

      // listeners should be registered
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      // scroll listener should be registered with capture=true
      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    } finally {
      addSpy.mockRestore();
    }
  });
});
