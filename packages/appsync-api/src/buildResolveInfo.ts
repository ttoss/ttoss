import {
  type FieldNode,
  type GraphQLField,
  type GraphQLObjectType,
  type GraphQLSchema,
  Kind,
  parse,
  type SelectionNode,
  type SelectionSetNode,
} from 'graphql';

type AppSyncEventInfo = {
  fieldName: string;
  parentTypeName: string;
  variables?: Record<string, unknown>;
  selectionSetList?: string[];
  selectionSetGraphQL?: string;
};

type SelectionTree = Map<string, SelectionTree>;

const toSelectionTree = (selectionSetList: string[]): SelectionTree => {
  const root: SelectionTree = new Map();

  for (const path of selectionSetList) {
    let node = root;
    for (const key of path.split('/')) {
      if (!node.has(key)) {
        node.set(key, new Map());
      }
      node = node.get(key) as SelectionTree;
    }
  }

  return root;
};

const toSelectionSet = (tree: SelectionTree): SelectionSetNode | undefined => {
  if (tree.size === 0) {
    return undefined;
  }

  return {
    kind: Kind.SELECTION_SET,
    selections: [...tree.entries()].map(([key, children]) => {
      return {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: key },
        selectionSet: toSelectionSet(children),
      };
    }),
  };
};

const responseKeyOf = (field: FieldNode) => {
  return field.alias?.value ?? field.name.value;
};

const responseKeysOf = (selections: readonly SelectionNode[]): Set<string> => {
  const keys = new Set<string>();

  for (const selection of selections) {
    if (selection.kind === Kind.FIELD) {
      keys.add(responseKeyOf(selection));
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      for (const key of responseKeysOf(selection.selectionSet.selections)) {
        keys.add(key);
      }
    }
  }

  return keys;
};

const listedFieldsMissingFrom = ({
  selections,
  tree,
}: {
  selections: SelectionNode[];
  tree: SelectionTree;
}): FieldNode[] => {
  const selected = responseKeysOf(selections);

  return [...tree.entries()]
    .filter(([key]) => {
      return !selected.has(key);
    })
    .map(([key, children]) => {
      return {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: key },
        selectionSet: toSelectionSet(children),
      };
    });
};

/**
 * `selectionSetGraphQL` leaves named fragment spreads unexpanded and the event
 * carries no fragment definitions, while graphql-compose's
 * `getProjectionFromAST` recurses forever on a spread it cannot resolve. So
 * every spread is dropped and replaced by the fields `selectionSetList` (which
 * does expand fragments) lists at the same path. `selectionSetList` names
 * aliased fields by their alias, so a field reached only through a spread is
 * projected under its alias.
 */
const resolveSpreads = ({
  selectionSet,
  tree,
}: {
  selectionSet: SelectionSetNode;
  tree: SelectionTree | undefined;
}): SelectionSetNode => {
  const resolveSelection = (selection: SelectionNode): SelectionNode[] => {
    if (selection.kind === Kind.FRAGMENT_SPREAD) {
      return [];
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return [
        {
          ...selection,
          selectionSet: resolveSpreads({
            selectionSet: selection.selectionSet,
            tree,
          }),
        },
      ];
    }

    if (!selection.selectionSet) {
      return [selection];
    }

    return [
      {
        ...selection,
        selectionSet: resolveSpreads({
          selectionSet: selection.selectionSet,
          tree: tree?.get(responseKeyOf(selection)),
        }),
      },
    ];
  };

  const hasSpread = selectionSet.selections.some((selection) => {
    return selection.kind === Kind.FRAGMENT_SPREAD;
  });

  const selections = selectionSet.selections.flatMap(resolveSelection);

  if (hasSpread && tree) {
    selections.push(...listedFieldsMissingFrom({ selections, tree }));
  }

  return { ...selectionSet, selections };
};

/**
 * The string may or may not wrap the selection in the resolved field itself.
 * `selectionSetList` never includes it, so a lone top-level field with the
 * resolved field's name that the list does not list is that wrapper.
 */
const unwrapResolvedField = ({
  selectionSet,
  fieldName,
  tree,
}: {
  selectionSet: SelectionSetNode;
  fieldName: string;
  tree: SelectionTree | undefined;
}): SelectionSetNode => {
  const [onlySelection] = selectionSet.selections;

  if (
    selectionSet.selections.length !== 1 ||
    onlySelection.kind !== Kind.FIELD ||
    onlySelection.name.value !== fieldName ||
    !onlySelection.selectionSet ||
    tree?.has(responseKeyOf(onlySelection))
  ) {
    return selectionSet;
  }

  return onlySelection.selectionSet;
};

const toFieldNode = (info: AppSyncEventInfo): FieldNode | undefined => {
  if (!info.selectionSetGraphQL) {
    return undefined;
  }

  const [operation] = parse(info.selectionSetGraphQL).definitions;

  if (operation?.kind !== Kind.OPERATION_DEFINITION) {
    return undefined;
  }

  const tree = info.selectionSetList
    ? toSelectionTree(info.selectionSetList)
    : undefined;

  const selectionSet = unwrapResolvedField({
    selectionSet: operation.selectionSet,
    fieldName: info.fieldName,
    tree,
  });

  return {
    kind: Kind.FIELD,
    name: { kind: Kind.NAME, value: info.fieldName },
    selectionSet: resolveSpreads({ selectionSet, tree }),
  };
};

/**
 * Returns the AppSync event's `info` extended with the `GraphQLResolveInfo`
 * fields graphql-compose reads to compute a resolver's `projection`
 * (`fieldNodes`, `fragments`, `returnType`), plus `parentType` and `schema`.
 * Without them `projection` is always `{}`, and `composeWithConnection` never
 * calls its count resolver, reporting `count: 0`.
 *
 * Fails safe: when `selectionSetGraphQL` is absent or cannot be parsed, the
 * original `info` is returned unchanged, so a field resolves exactly as it
 * did before rather than every `addResolver` field throwing at once.
 */
export const buildResolveInfo = <TInfo extends AppSyncEventInfo>({
  info,
  schema,
  parentType,
  field,
}: {
  info: TInfo;
  schema: GraphQLSchema;
  parentType: GraphQLObjectType;
  field: GraphQLField<unknown, unknown>;
}): TInfo => {
  let fieldNode: FieldNode | undefined;

  try {
    fieldNode = toFieldNode(info);
  } catch {
    return info;
  }

  if (!fieldNode) {
    return info;
  }

  return {
    ...info,
    fieldNodes: [fieldNode],
    fragments: {},
    returnType: field.type,
    parentType,
    schema,
    variableValues: info.variables ?? {},
  };
};
