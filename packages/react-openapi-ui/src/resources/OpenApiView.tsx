import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import { extractRecord, recordLabel } from '../core/detail';
import {
  type ApiResource,
  findResource,
  getRecordId,
  type OpenApiLocation,
  type ParseResourcesOptions,
} from '../core/resources';
import type { OperationParams } from '../core/types';
import { OpenApiDeleteButton } from '../detail/OpenApiDeleteButton';
import { OpenApiDetail } from '../detail/OpenApiDetail';
import { OpenApiForm } from '../form/OpenApiForm';
import { useOpenApi } from '../OpenApiProvider';
import { OpenApiTable } from '../table/OpenApiTable';
import { Button, buttonClassName } from '../ui/Button';
import { Alert } from '../ui/fields';
import { Skeleton } from '../ui/Table';
import { messages } from './messages';
import {
  inlineLinkClassName,
  ResourceLink,
  ResourcesProvider,
  useResourcesContext,
} from './ResourcesContext';

export type OpenApiViewProps = ParseResourcesOptions & {
  /** The screen to show: a resource and one of its views. */
  location: OpenApiLocation;
  /** Called with the next location when the user navigates. */
  onNavigate: (location: OpenApiLocation) => void;
  /**
   * The URL of a location in the app (e.g. `formatLocation` under a base
   * path). When given, navigation renders real links, so they open in a new
   * tab with a modified click.
   */
  getHref?: (location: OpenApiLocation) => string;
  /**
   * Params every request receives, e.g. `{ project_id }` for an API whose
   * paths are nested under a parent. Params an operation does not declare are
   * ignored.
   */
  params?: OperationParams;
};

const ACTION_BUTTON = buttonClassName({ variant: 'outline', size: 'sm' });

const Message = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="oa:m-0 oa:text-sm oa:text-muted-foreground">{children}</p>
  );
};

const Unavailable = () => {
  const { intl } = useI18n();
  return <Message>{intl.formatMessage(messages.unavailable)}</Message>;
};

const BackLink = ({ location }: { location: OpenApiLocation }) => {
  const { intl } = useI18n();
  return (
    <ResourceLink
      location={location}
      className={`${inlineLinkClassName} oa:self-start oa:text-muted-foreground`}
    >
      {intl.formatMessage(messages.back)}
    </ResourceLink>
  );
};

const Heading = ({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  return (
    <div className="oa:flex oa:flex-wrap oa:items-center oa:justify-between oa:gap-4">
      <h2 className="oa:m-0 oa:text-xl oa:font-semibold">{children}</h2>
      {actions && (
        <div className="oa:flex oa:flex-wrap oa:items-center oa:gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

const Screen = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="oa:flex oa:flex-col oa:gap-5 oa:text-sm oa:text-foreground">
      {children}
    </div>
  );
};

type ScreenProps = { resource: ApiResource; params: OperationParams };

const ListScreen = ({ resource, params }: ScreenProps) => {
  const { intl } = useI18n();
  const context = useResourcesContext();
  const collectionActions = resource.actions.filter((action) => {
    return action.scope === 'collection';
  });
  if (!resource.list) {
    return <Unavailable />;
  }
  const { get } = resource;
  return (
    <Screen>
      <Heading
        actions={
          <>
            {collectionActions.map((action) => {
              return (
                <ResourceLink
                  key={action.key}
                  className={ACTION_BUTTON}
                  location={{
                    resource: resource.key,
                    view: 'action',
                    action: action.key,
                  }}
                >
                  {action.label}
                </ResourceLink>
              );
            })}
            {resource.create && (
              <ResourceLink
                className={buttonClassName({ size: 'sm' })}
                location={{ resource: resource.key, view: 'create' }}
              >
                {intl.formatMessage(messages.create)}
              </ResourceLink>
            )}
          </>
        }
      >
        {resource.label}
      </Heading>
      <OpenApiTable
        key={resource.key}
        operationId={resource.list.operation.operationId}
        params={params}
        onRowClick={
          get
            ? (record) => {
                const id = getRecordId({ resource, record });
                if (id !== undefined) {
                  context?.navigate({
                    resource: resource.key,
                    view: 'detail',
                    id,
                  });
                }
              }
            : undefined
        }
      />
    </Screen>
  );
};

const itemParams = ({
  resource,
  params,
  id,
}: ScreenProps & { id: string }): OperationParams => {
  return resource.idParam ? { ...params, [resource.idParam]: id } : params;
};

const DetailScreen = ({
  resource,
  params,
  id,
}: ScreenProps & { id: string }) => {
  const { intl } = useI18n();
  const context = useResourcesContext();
  if (!resource.get || !resource.idParam) {
    return <Unavailable />;
  }
  const { update } = resource;
  const remove = resource.delete;
  const recordParams = itemParams({ resource, params, id });
  const itemActions = resource.actions.filter((action) => {
    return action.scope === 'item';
  });
  return (
    <Screen>
      <BackLink location={{ resource: resource.key, view: 'list' }} />
      <OpenApiDetail
        key={`${resource.key}:${id}`}
        operationId={resource.get.operation.operationId}
        params={recordParams}
        actions={({ record }) => {
          return (
            <>
              {update && (
                <ResourceLink
                  className={ACTION_BUTTON}
                  location={{ resource: resource.key, view: 'edit', id }}
                >
                  {intl.formatMessage(messages.edit)}
                </ResourceLink>
              )}
              {itemActions.map((action) => {
                return (
                  <ResourceLink
                    key={action.key}
                    className={ACTION_BUTTON}
                    location={{
                      resource: resource.key,
                      view: 'action',
                      action: action.key,
                      id,
                    }}
                  >
                    {action.label}
                  </ResourceLink>
                );
              })}
              {remove && (
                <OpenApiDeleteButton
                  operationId={remove.operation.operationId}
                  params={recordParams}
                  recordName={recordLabel(record)}
                  onSuccess={() => {
                    context?.navigate({ resource: resource.key, view: 'list' });
                  }}
                />
              )}
            </>
          );
        }}
      />
    </Screen>
  );
};

const EditScreen = ({ resource, params, id }: ScreenProps & { id: string }) => {
  const { intl } = useI18n();
  const context = useResourcesContext();
  if (!resource.update || !resource.idParam) {
    return <Unavailable />;
  }
  const detail: OpenApiLocation = resource.get
    ? { resource: resource.key, view: 'detail', id }
    : { resource: resource.key, view: 'list' };
  const back = () => {
    context?.navigate(detail);
  };
  return (
    <Screen>
      <BackLink location={detail} />
      <Heading>{intl.formatMessage(messages.editTitle)}</Heading>
      <div className="oa:max-w-xl">
        <OpenApiForm
          key={`${resource.key}:${id}`}
          operationId={resource.update.operation.operationId}
          params={itemParams({ resource, params, id })}
          onSuccess={back}
          onCancel={back}
        />
      </div>
    </Screen>
  );
};

const CreateScreen = ({ resource, params }: ScreenProps) => {
  const { intl } = useI18n();
  const context = useResourcesContext();
  if (!resource.create) {
    return <Unavailable />;
  }
  const list: OpenApiLocation = { resource: resource.key, view: 'list' };
  return (
    <Screen>
      <BackLink location={list} />
      <Heading>{intl.formatMessage(messages.createTitle)}</Heading>
      <div className="oa:max-w-xl">
        <OpenApiForm
          key={resource.key}
          operationId={resource.create.operation.operationId}
          params={params}
          onSuccess={(data) => {
            const record = extractRecord(data);
            const id =
              record && resource.get
                ? getRecordId({ resource, record })
                : undefined;
            context?.navigate(
              id === undefined
                ? list
                : { resource: resource.key, view: 'detail', id }
            );
          }}
          onCancel={() => {
            context?.navigate(list);
          }}
        />
      </div>
    </Screen>
  );
};

const ActionScreen = ({
  resource,
  params,
  actionKey,
  id,
}: ScreenProps & { actionKey: string; id?: string }) => {
  const context = useResourcesContext();
  const action = resource.actions.find((candidate) => {
    return candidate.key === actionKey;
  });
  if (!action || (action.scope === 'item' && id === undefined)) {
    return <Unavailable />;
  }
  const origin: OpenApiLocation =
    id !== undefined && resource.get
      ? { resource: resource.key, view: 'detail', id }
      : { resource: resource.key, view: 'list' };
  const back = () => {
    context?.navigate(origin);
  };
  return (
    <Screen>
      <BackLink location={origin} />
      <Heading>{action.label}</Heading>
      <div className="oa:max-w-xl">
        <OpenApiForm
          key={`${action.key}:${id ?? ''}`}
          operationId={action.key}
          params={
            id === undefined ? params : itemParams({ resource, params, id })
          }
          submitLabel={action.label}
          onSuccess={back}
          onCancel={back}
        />
      </div>
    </Screen>
  );
};

/** The spec is loading, or failed to load (with a retry). */
export const SpecState = () => {
  const { intl } = useI18n();
  const { error, reload } = useOpenApi();
  if (error) {
    return (
      <div className="oa:flex oa:flex-col oa:items-start oa:gap-3">
        <Alert title={intl.formatMessage(messages.specError)}>
          {error.message}
        </Alert>
        <Button variant="outline" size="sm" onClick={reload}>
          {intl.formatMessage(messages.retry)}
        </Button>
      </div>
    );
  }
  return <Skeleton className="oa:h-7 oa:w-56" />;
};

/** The screen for a location, inside a `ResourcesProvider`. */
export const ResourceScreen = ({ location }: { location: OpenApiLocation }) => {
  const { intl } = useI18n();
  const { spec } = useOpenApi();
  const context = useResourcesContext();
  if (!spec || !context) {
    return <SpecState />;
  }
  const resource = findResource({
    resources: context.resources,
    key: location.resource,
  });
  if (!resource) {
    return (
      <Message>
        {intl.formatMessage(messages.unknownResource, {
          resource: location.resource,
        })}
      </Message>
    );
  }
  const props = { resource, params: context.params };
  switch (location.view) {
    case 'list':
      return <ListScreen {...props} />;
    case 'create':
      return <CreateScreen {...props} />;
    case 'detail':
      return <DetailScreen {...props} id={location.id} />;
    case 'edit':
      return <EditScreen {...props} id={location.id} />;
    case 'action':
      return (
        <ActionScreen {...props} actionKey={location.action} id={location.id} />
      );
  }
};

/**
 * One screen of the admin the spec describes, chosen by `location`: a
 * resource's table, a record, its create/edit form or an action form. Which
 * operation backs each screen is read from the spec by `parseResources` (no
 * `operationId` to wire), and every move between screens goes through
 * `onNavigate`, so the app's router owns the URL. Use `OpenApiApp` for the
 * same screens with a navigation menu. Must be rendered inside an
 * `OpenApiProvider`.
 */
export const OpenApiView = ({
  location,
  onNavigate,
  getHref,
  params,
  pathPrefix,
  tags,
}: OpenApiViewProps) => {
  return (
    <ResourcesProvider
      navigate={onNavigate}
      getHref={getHref}
      params={params}
      pathPrefix={pathPrefix}
      tags={tags}
    >
      <ResourceScreen location={location} />
    </ResourcesProvider>
  );
};
