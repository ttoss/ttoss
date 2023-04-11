/* eslint-disable no-console */
import React from 'react';

export const useFormGroup = (
  ref: React.MutableRefObject<HTMLDivElement | null>,
  id: string
) => {
  React.useEffect(() => {
    const formGroupEls = document.querySelectorAll(
      'div[aria-details="form-group"]'
    );

    console.log('useFormGroup::formGroupEls', formGroupEls);
    console.log('useFormGroup::ref', ref);
    console.log('useFormGroup::id', id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { maxLevel: 10, parentLevel: 1 };
};
