import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import { isListable, type OpenApiLocation } from '../core/resources';
import { useOpenApi } from '../OpenApiProvider';
import { cn } from '../ui/cn';
import { messages } from './messages';
import {
  type OpenApiViewProps,
  ResourceScreen,
  SpecState,
} from './OpenApiView';
import {
  ResourceLink,
  ResourcesProvider,
  useResourcesContext,
} from './ResourcesContext';

export type OpenApiAppProps = Omit<
  OpenApiViewProps,
  'location' | 'onNavigate'
> & {
  /**
   * The current screen, when the app's router owns it (controlled). Omit to
   * let the component keep it.
   */
  location?: OpenApiLocation;
  /** The first screen when uncontrolled. Defaults to the first resource's list. */
  defaultLocation?: OpenApiLocation;
  /** Called with the next location when the user navigates. */
  onNavigate?: (location: OpenApiLocation) => void;
};

const NAV_ITEM =
  'oa:block oa:w-full oa:whitespace-nowrap oa:rounded-md oa:border-0 oa:bg-transparent oa:px-3 oa:py-2 oa:text-left oa:text-sm oa:text-muted-foreground oa:no-underline oa:outline-none oa:hover:bg-accent oa:hover:text-foreground oa:focus-visible:ring-2 oa:focus-visible:ring-ring';

const ResourceNav = ({ current }: { current?: OpenApiLocation }) => {
  const { intl } = useI18n();
  const context = useResourcesContext();
  const listed = (context?.resources ?? []).filter((resource) => {
    return isListable({ resource, params: context?.params });
  });
  return (
    <nav
      aria-label={intl.formatMessage(messages.navLabel)}
      className="oa:shrink-0 oa:md:w-52"
    >
      <ul className="oa:m-0 oa:flex oa:list-none oa:gap-1 oa:overflow-x-auto oa:p-0 oa:md:flex-col">
        {listed.map((resource) => {
          const active = current?.resource === resource.key;
          return (
            <li key={resource.key}>
              <ResourceLink
                location={{ resource: resource.key, view: 'list' }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  NAV_ITEM,
                  active && 'oa:bg-muted oa:font-medium oa:text-foreground'
                )}
              >
                {resource.label}
              </ResourceLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const AppBody = ({ location }: { location?: OpenApiLocation }) => {
  const { intl } = useI18n();
  const { spec } = useOpenApi();
  const context = useResourcesContext();
  const first = context?.resources.find((resource) => {
    return isListable({ resource, params: context.params });
  });
  const current: OpenApiLocation | undefined =
    location ?? (first ? { resource: first.key, view: 'list' } : undefined);
  return (
    <div className="oa:flex oa:flex-col oa:gap-6 oa:text-sm oa:text-foreground oa:md:flex-row">
      <ResourceNav current={current} />
      <div className="oa:min-w-0 oa:flex-1">
        {!spec && <SpecState />}
        {spec && current && <ResourceScreen location={current} />}
        {spec && !current && (
          <p className="oa:m-0 oa:text-muted-foreground">
            {intl.formatMessage(messages.noResources)}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * A complete admin generated from the OpenAPI spec: a menu with one entry per
 * resource (operations grouped by tag) and, next to it, the screen for the
 * current location — table, record, create/edit form or action form. Which
 * operation backs each screen comes from the HTTP method and path shape (see
 * `parseResources`); `x-ref` fields become pickers and links between
 * resources. Works uncontrolled, or controlled through `location` and
 * `onNavigate` so the app's router owns the URL. Must be rendered inside an
 * `OpenApiProvider`.
 */
export const OpenApiApp = ({
  location,
  defaultLocation,
  onNavigate,
  getHref,
  params,
  pathPrefix,
  tags,
}: OpenApiAppProps) => {
  const [internal, setInternal] = React.useState(defaultLocation);
  const controlled = location !== undefined;
  const navigate = React.useCallback(
    (next: OpenApiLocation) => {
      if (!controlled) {
        setInternal(next);
      }
      onNavigate?.(next);
    },
    [controlled, onNavigate]
  );
  return (
    <ResourcesProvider
      navigate={navigate}
      getHref={getHref}
      params={params}
      pathPrefix={pathPrefix}
      tags={tags}
    >
      <AppBody location={controlled ? location : internal} />
    </ResourcesProvider>
  );
};
