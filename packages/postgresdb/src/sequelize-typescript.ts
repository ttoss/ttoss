/**
 * Exports the necessary classes from the sequelize-typescript package.
 */
import pgvector from 'pgvector/sequelize';
import type { DataType as DataTypeInterface } from 'sequelize';
import { DataType as SequelizeDataType, Sequelize } from 'sequelize-typescript';

pgvector.registerType(Sequelize);

export type { ModelCtor, SequelizeOptions } from 'sequelize-typescript';
export {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DeletedAt,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
  Model,
  PrimaryKey,
  Sequelize,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

/**
 * Extend DataType to include VECTOR type from pgvector
 */
export const DataType = SequelizeDataType as typeof SequelizeDataType & {
  VECTOR: (dimensions: number) => DataTypeInterface;
};
