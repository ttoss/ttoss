import { DEFAULT_NODE_RUNTIME, DEFAULT_NODE_VERSION } from '../config';

/**
 * Get the Node.js runtime string based on version number or runtime string.
 * @param options - Configuration options
 * @param options.version - The Node.js version (e.g., '20', '22', '24')
 * @param options.runtime - The runtime string (e.g., 'nodejs20.x')
 * @returns The runtime string (e.g., 'nodejs20.x')
 */
export const getNodeRuntime = ({
  version,
  runtime,
}: {
  version?: string;
  runtime?: string;
} = {}): string => {
  if (runtime) {
    return runtime;
  }

  const nodeVersion = version || DEFAULT_NODE_VERSION;
  return `nodejs${nodeVersion}.x`;
};

/**
 * Get the Node.js version number from runtime string.
 * @param options - Configuration options
 * @param options.runtime - The runtime string (e.g., 'nodejs20.x')
 * @returns The version number (e.g., '20')
 */
export const getNodeVersion = ({
  runtime = DEFAULT_NODE_RUNTIME,
}: {
  runtime?: string;
} = {}): string => {
  return runtime.replace('nodejs', '').replace('.x', '');
};
