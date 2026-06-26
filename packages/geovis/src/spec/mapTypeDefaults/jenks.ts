export class NumberClassError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, NumberClassError.prototype);
  }
}

export class DataArrayError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DataArrayError.prototype);
  }
}

const validateNumberClasses = (
  numberClasses: number,
  arrayLength: number
): void => {
  if (!Number.isInteger(numberClasses)) {
    throw TypeError('Number classes must be an integer');
  }
  if (numberClasses > arrayLength) {
    throw new NumberClassError('Number classes must be less than array length');
  }
  if (numberClasses <= 0) {
    throw new NumberClassError('Number classes must be greater than zero');
  }
};

const validateDataArray = (arrayLength: number): void => {
  if (arrayLength <= 0) {
    throw new DataArrayError('Data array must not be empty');
  }
};

export const jenksBuckets = (
  data: Array<number>,
  numberClasses: number
): Array<number> => {
  validateDataArray(data.length);
  validateNumberClasses(numberClasses, data.length);

  data.sort((a, b) => {
    return a - b;
  });

  const mat1: Array<Array<number>> = Array.from(Array(data.length + 1)).map(
    () => {
      return Array(numberClasses + 1);
    }
  );
  const mat2: Array<Array<number>> = Array.from(Array(data.length + 1)).map(
    () => {
      return Array(numberClasses + 1);
    }
  );

  let v = 0.0;
  for (let y = 1, yl = numberClasses + 1; y < yl; y++) {
    mat1[0][y] = 1;
    mat2[0][y] = 0;
    for (let t = 1, tl = data.length + 1; t < tl; t++) {
      mat2[t][y] = Infinity;
    }
    v = 0.0;
  }

  for (let l = 2, ll = data.length + 1; l < ll; l++) {
    let s1 = 0.0;
    let s2 = 0.0;
    let w = 0.0;
    for (let m = 1, ml = l + 1; m < ml; m++) {
      const i3 = l - m + 1;
      const val = data[i3 - 1];
      s2 += val * val;
      s1 += val;
      w += 1;
      v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      for (let p = 2, pl = numberClasses + 1; p < pl && i4 !== 0; p++) {
        if (mat2[l][p] >= v + mat2[i4][p - 1]) {
          mat1[l][p] = i3;
          mat2[l][p] = v + mat2[i4][p - 1];
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = v;
  }

  let k = data.length;
  const buckets: Array<number> = Array.from(Array(numberClasses + 1)).fill(
    0
  ) as Array<number>;

  buckets[numberClasses] = data[data.length - 1];
  buckets[0] = data[0];
  let countNum = numberClasses;

  while (countNum >= 2) {
    const id = mat1[k][countNum] - 2;
    buckets[countNum - 1] = data[id];
    const idxVal = mat1[k][countNum];
    k = idxVal - 1;
    countNum -= 1;
  }

  if (buckets[0] === buckets[1]) {
    buckets[0] = 0;
  }

  return buckets;
};
