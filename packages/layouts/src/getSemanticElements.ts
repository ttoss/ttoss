import * as React from 'react';

const semanticComponents = {
  Header: 'header',
  Footer: 'footer',
  Main: 'main',
} as const;

type SemanticComponents = keyof typeof semanticComponents;

type SemanticTags = (typeof semanticComponents)[SemanticComponents];

type SemanticElements = {
  [key in SemanticTags]:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal
    | null
    | undefined;
};

/**
 * It's not worth to use React hooks here because children props always
 * change when the parent component re-renders.
 */
export const getSematicElements = ({
  children,
}: {
  children: React.ReactNode;
}): SemanticElements => {
  const semanticElements = {} as SemanticElements;

  React.Children.forEach(children, (child) => {
    const displayName = (child as any)?.type?.displayName as
      | SemanticComponents
      | undefined;

    if (!displayName) {
      return;
    }

    if (semanticComponents[displayName]) {
      semanticElements[semanticComponents[displayName]] = child;
    }
  });

  return semanticElements;
};
