/* eslint-disable @typescript-eslint/no-explicit-any */
const debounce = <F extends (...args: any[]) => void>(
  fn: F,
  delay: number
): ((this: ThisParameterType<F>, ...args: Parameters<F>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null;

  function debounceFn(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    timer = setTimeout(() => fn.apply(this, args), delay);
  }

  return debounceFn;
};

export default debounce;
