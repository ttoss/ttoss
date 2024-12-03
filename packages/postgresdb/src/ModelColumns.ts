import { Model } from './sequelize-typescript';

export type ModelColumns<T> = Omit<T, keyof Model> &
  Pick<Model, 'id' | 'createdAt' | 'updatedAt'>;
