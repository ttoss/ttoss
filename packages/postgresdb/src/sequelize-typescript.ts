/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Exports the necessary classes from the sequelize-typescript package.
 */
import { inherits } from 'node:util';

import { DataTypes, Utils } from 'sequelize';

export type { ModelCtor, SequelizeOptions } from 'sequelize-typescript';
export {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
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

// Custom VECTOR data type for PostgreSQL pgvector
class VECTOR extends DataTypes.ABSTRACT {
  dimension: number;

  constructor(dimension: number) {
    super();
    this.dimension = dimension;
  }

  // Mandatory: complete definition of the new type in the database
  toSql() {
    return `VECTOR(${this.dimension})`;
  }

  // Optional: validator function
  validate(value: any) {
    return (
      Array.isArray(value) &&
      value.every((v) => {
        return typeof v === 'number';
      })
    );
  }

  // Optional: sanitizer
  _sanitize(value: any) {
    if (Array.isArray(value)) {
      return value.map((v) => {
        return parseFloat(v);
      });
    }
    return value;
  }

  // Optional: value stringifier before sending to database
  _stringify(value: any) {
    if (Array.isArray(value)) {
      return `[${value.join(',')}]`;
    }
    return value;
  }

  // Optional: parser for values received from the database
  static parse(value: string) {
    if (
      typeof value === 'string' &&
      value.startsWith('[') &&
      value.endsWith(']')
    ) {
      return value
        .slice(1, -1)
        .split(',')
        .map((v) => {
          return parseFloat(v.trim());
        });
    }
    return value;
  }
}

// Mandatory: set the type key
VECTOR.prototype.key = VECTOR.key = 'VECTOR';

// Mandatory: add the new type to DataTypes. Optionally wrap it on `Utils.classToInvokable` to
// be able to use this datatype directly without having to call `new` on it.
(DataTypes as any).VECTOR = Utils.classToInvokable(VECTOR);

// Initialize types object if it doesn't exist
if (!(DataTypes as any).VECTOR.types) {
  (DataTypes as any).VECTOR.types = {};
}

// For PostgreSQL, map the type
(DataTypes as any).VECTOR.types.postgres = ['VECTOR'];

// Create a postgres-specific child datatype
const PgTypes = (DataTypes as any).postgres;

PgTypes.VECTOR = function VECTOR(dimension: number) {
  if (!(this instanceof PgTypes.VECTOR)) {
    return new PgTypes.VECTOR(dimension);
  }
  (DataTypes as any).VECTOR.apply(this, [dimension]);
};

inherits(PgTypes.VECTOR, (DataTypes as any).VECTOR);

// Override parser for postgres
PgTypes.VECTOR.parse = VECTOR.parse;
