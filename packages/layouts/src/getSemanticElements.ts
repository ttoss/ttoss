import * as React from 'react';

const semanticComponents = {
  Header: 'header',
  Sidebar: 'sidebar',
  Footer: 'footer',
  Main: 'main',
  MainHeader: 'mainHeader',
  MainBody: 'mainBody',
  MainFooter: 'mainFooter',
} as const;

type SemanticComponents = keyof typeof semanticComponents;

type SemanticTags = (typeof semanticComponents)[SemanticComponents];

type SemanticElements = {
  [key in SemanticTags]: React.ReactNode;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
