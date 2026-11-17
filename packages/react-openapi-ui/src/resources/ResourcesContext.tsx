import * as React from 'react';

import {
  type ApiResource,
  type OpenApiLocation,
  parseResources,
  type ParseResourcesOptions,
} from '../core/resources';
import type { OperationParams } from '../core/types';
import { useOpenApi } from '../OpenApiProvider';
import { cn } from '../ui/cn';

export type ResourcesContextValue = {
  resources: ApiResource[];
  /** Params every request of the screens receives (e.g. a parent id). */
  params: OperationParams;
  navigate: (location: OpenApiLocation) => void;
  getHref?: (location: OpenApiLocation) => string;
};

const ResourcesContext = React.createContext<ResourcesContextValue | null>(
  null
);

/** The navigation set up by `OpenApiApp`/`OpenApiView`, or null outside them. */
export const useResourcesContext = (): ResourcesContextValue | null => {
  return React.useContext(ResourcesContext);
};

/**
 * The resources of the spec in the nearest `OpenApiProvider` (see
 * `parseResources`). Inside `OpenApiApp`/`OpenApiView` it returns theirs, so
 * `options` only apply outside them. Empty while the spec loads.
 */
export const useResources = ({
  pathPrefix,
  tags,
}: ParseResourcesOptions = {}): ApiResource[] => {
  const context = useResourcesContext();
  const { spec } = useOpenApi();
  const tagsKey = tags?.join('\n');
  return React.useMemo(() => {
    if (context) {
      return context.resources;
    }
    return spec
      ? parseResources({ spec, pathPrefix, tags: tagsKey?.split('\n') })
      : [];
  }, [context, spec, pathPrefix, tagsKey]);
};

export const ResourcesProvider = ({
  params,
  navigate,
  getHref,
  pathPrefix,
  tags,
  children,
}: Omit<ResourcesContextValue, 'resources' | 'params'> &
  ParseResourcesOptions & {
    params?: OperationParams;
    children: React.ReactNode;
  }) => {
  const resources = useResources({ pathPrefix, tags });
  const paramsKey = JSON.stringify(params ?? {});
  const value = React.useMemo<ResourcesContextValue>(() => {
    return {
      resources,
      params: JSON.parse(paramsKey) as OperationParams,
      navigate,
      getHref,
    };
  }, [resources, paramsKey, navigate, getHref]);
  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
};

const isModifiedClick = (event: React.MouseEvent): boolean => {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
};

/**
 * Navigates to a location: a real link when the app gives `getHref` (so it
 * opens in a new tab with a modified click), a button otherwise. Clicks do
 * not reach a clickable table row around it.
 */
export const ResourceLink = ({
  location,
  className,
  children,
  ...rest
}: {
  location: OpenApiLocation;
  className?: string;
  children: React.ReactNode;
} & Pick<React.AriaAttributes, 'aria-current' | 'aria-label'>) => {
  const context = useResourcesContext();
  const href = context?.getHref?.(location);
  const props = {
    ...rest,
    className: cn('oa:[font-family:inherit]', className),
    onKeyDown: (event: React.KeyboardEvent) => {
      event.stopPropagation();
    },
  };
  if (href) {
    return (
      <a
        {...props}
        href={href}
        onClick={(event) => {
          event.stopPropagation();
          if (isModifiedClick(event)) {
            return;
          }
          event.preventDefault();
          context?.navigate(location);
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      {...props}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        context?.navigate(location);
      }}
    >
      {children}
    </button>
  );
};

/** Link styling for a `ResourceLink` that sits inside text. */
export const inlineLinkClassName =
  'oa:cursor-pointer oa:border-0 oa:bg-transparent oa:p-0 oa:text-sm oa:text-foreground oa:underline oa:decoration-border oa:underline-offset-4 oa:hover:decoration-foreground oa:outline-none oa:focus-visible:ring-2 oa:focus-visible:ring-ring oa:rounded-sm';
