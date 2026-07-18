import * as React from 'react';

import { CATALOG } from './catalog';

/**
 * Component Lab selection state (PRD F3). The subject is either a catalog
 * component (with authorial prop selections) or an example page. Prop
 * selections reset when the component changes, so a value legal for one entity
 * never leaks onto another.
 */
export type ComponentSelection =
  | { kind: 'component'; key: string }
  | { kind: 'page'; id: string };

export interface ComponentReducerState {
  selection: ComponentSelection;
  evaluation?: string;
  consequence?: string;
}

export type ComponentAction =
  | { type: 'selectComponent'; key: string }
  | { type: 'selectPage'; id: string }
  | { type: 'setEvaluation'; value?: string }
  | { type: 'setConsequence'; value?: string };

// CATALOG is always non-empty — fsl-ui ships many `*Meta` exports, and
// catalog.test asserts it. Index directly so there's no unreachable fallback.
export const initialComponentState: ComponentReducerState = {
  selection: { kind: 'component', key: CATALOG[0].key },
};

export const componentReducer = (
  state: ComponentReducerState,
  action: ComponentAction
): ComponentReducerState => {
  switch (action.type) {
    case 'selectComponent': {
      return { selection: { kind: 'component', key: action.key } };
    }
    case 'selectPage': {
      return { selection: { kind: 'page', id: action.id } };
    }
    case 'setEvaluation': {
      return { ...state, evaluation: action.value };
    }
    case 'setConsequence': {
      return { ...state, consequence: action.value };
    }
    default: {
      return state;
    }
  }
};

export interface ComponentStore {
  selection: ComponentSelection;
  evaluation?: string;
  consequence?: string;
  selectComponent: (key: string) => void;
  selectPage: (id: string) => void;
  setEvaluation: (value?: string) => void;
  setConsequence: (value?: string) => void;
}

const ComponentStoreCtx = React.createContext<ComponentStore | null>(null);

export const ComponentStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = React.useReducer(
    componentReducer,
    initialComponentState
  );

  const value = React.useMemo<ComponentStore>(() => {
    return {
      selection: state.selection,
      evaluation: state.evaluation,
      consequence: state.consequence,
      selectComponent: (key) => {
        return dispatch({ type: 'selectComponent', key });
      },
      selectPage: (id) => {
        return dispatch({ type: 'selectPage', id });
      },
      setEvaluation: (value) => {
        return dispatch({ type: 'setEvaluation', value });
      },
      setConsequence: (value) => {
        return dispatch({ type: 'setConsequence', value });
      },
    };
  }, [state]);

  return (
    <ComponentStoreCtx.Provider value={value}>
      {children}
    </ComponentStoreCtx.Provider>
  );
};

export const useComponentStore = (): ComponentStore => {
  const store = React.useContext(ComponentStoreCtx);
  if (!store) {
    throw new Error(
      'useComponentStore must be used within a ComponentStoreProvider'
    );
  }
  return store;
};
