/**
 * Exports the necessary classes from the sequelize-typescript package.
 */
/**
 * Registers the VECTOR, HALFVEC and SPARSEVEC data types on Sequelize. Since
 * pgvector 0.3 the import itself registers them; `registerType` is deprecated.
 */
import 'pgvector/sequelize';

import type { DataType as DataTypeInterface, SyncOptions } from 'sequelize';
import { DataType as SequelizeDataType } from 'sequelize-typescript';

export type { SyncOptions };
export type { ModelCtor, SequelizeOptions } from 'sequelize-typescript';
export {
  // Hook decorators
  AfterBulkCreate,
  AfterBulkDestroy,
  AfterBulkRestore,
  AfterBulkSync,
  AfterBulkUpdate,
  AfterConnect,
  AfterCreate,
  AfterDefine,
  AfterDestroy,
  AfterFind,
  AfterInit,
  AfterRestore,
  AfterSave,
  AfterUpdate,
  AfterUpsert,
  AfterValidate,
  BeforeBulkCreate,
  BeforeBulkDestroy,
  BeforeBulkRestore,
  BeforeBulkSync,
  BeforeBulkUpdate,
  BeforeConnect,
  BeforeCount,
  BeforeCreate,
  BeforeDefine,
  BeforeDestroy,
  BeforeFind,
  BeforeFindAfterExpandIncludeAll,
  BeforeFindAfterOptions,
  BeforeInit,
  BeforeRestore,
  BeforeSave,
  BeforeUpdate,
  BeforeUpsert,
  BeforeValidate,
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
  ValidationFailed,
} from 'sequelize-typescript';

/**
 * Extend DataType to include VECTOR type from pgvector
 */
export const DataType = SequelizeDataType as typeof SequelizeDataType & {
  VECTOR: (dimensions: number) => DataTypeInterface;
};
