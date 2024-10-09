import * as React from 'react';

export const useLatest = <T>(val: T): React.RefObject<T> => {
  const ref = React.useRef(val);
  ref.current = val;
  return ref;
};
