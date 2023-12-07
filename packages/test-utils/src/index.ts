/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { RenderOptions, render, renderHook } from '@testing-library/react';
import { createSerializer, matchers } from '@emotion/jest';
import ResizeObserver from 'resize-observer-polyfill';
import './assignWindowProperties';
import '@testing-library/jest-dom/extend-expect';

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
let options_: {
  wrapper?: any;
} = {};

export type { RenderOptions };

export const setOptions = (options: RenderOptions) => {
  options_ = options;
};

export * from '@testing-library/react';

const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions
): /**
 * Any as return to avoid the erro:
 * The inferred type of 'customRender' cannot be named without a reference to
 * node_modules/@testing-library/dom/types/queries'.
 * This is likely not portable. A type annotation is necessary.
 */
any => {
  return render(ui, { ...options_, ...options });
};

const customRenderHook: typeof renderHook = (callback, options) => {
  return renderHook(callback, { ...options_, ...options });
};

export { customRender as render, customRenderHook as renderHook };
