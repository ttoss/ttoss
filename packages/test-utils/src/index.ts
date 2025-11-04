/* eslint-disable @typescript-eslint/no-explicit-any */
import './assignWindowProperties';
import '@testing-library/jest-dom';

import { createSerializer, matchers } from '@emotion/jest';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * https://github.com/ZeeCoder/use-resize-observer/issues/40#issuecomment-991256805
 */
global.ResizeObserver = ResizeObserver;

/**
 * Export all the matchers for Jest to avoid the error:
 * > Property 'toHaveStyleRule' does not exist on type 'JestMatchers<HTMLElement>'.
 */
export * from '@emotion/jest';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Add the custom matchers provided by '@emotion/jest'
 * https://emotion.sh/docs/@emotion/jest#custom-matchers
 */
expect.extend(matchers as any);

/**
 * Output the actual styles being applied.
 * https://emotion.sh/docs/testing
 */
expect.addSnapshotSerializer(createSerializer());

/**
 * Custom render options.
 */
let options_: any = {};

export type { RenderOptions };

export const setOptions = (options: RenderOptions) => {
  options_ = options;
};

export * from '@testing-library/react';

const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
  /**
   * as any to avoid the error:
   * The inferred type of 'customRender' cannot be named without a reference to
   * '.pnpm/@testing-library+dom@10.0.0/node_modules/@testing-library/dom/types/queries'.
   * This is likely not portable. A type annotation is necessary.
   */
  return render(ui, { ...options_, ...options }) as any;
};

const customRenderHook: typeof renderHook = (callback, options) => {
  return renderHook(callback, { ...options_, ...options });
};

export { customRender as render, customRenderHook as renderHook };
