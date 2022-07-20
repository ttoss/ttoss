import * as React from 'react';
import { InnerHTML } from './InnerHTML';

export const Algorithm = ({ algorithm }: { algorithm: string }) => {
  return <InnerHTML html={algorithm} />;
};
