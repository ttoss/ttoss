import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  initialize,
  Model,
  Table,
} from '@ttoss/postgresdb';

@Table({
  tableName: 'users',
  modelName: 'users',
  indexes: [],
})
class User extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare name: string;

  @Column({
    type: DataType.VECTOR(3),
    allowNull: true,
  })
  declare embedding: string;
}

@Table({
  tableName: 'products',
  modelName: 'products',
})
class Product extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare slug: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare price: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare beforeCreateCalled: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare beforeUpdateCalled: boolean;

  @BeforeCreate
  static setSlugOnCreate(instance: Product) {
    instance.beforeCreateCalled = true;
    if (instance.name && !instance.slug) {
      instance.slug = instance.name.toLowerCase().replace(/\s+/g, '-');
    }
  }

  @BeforeUpdate
  static updateSlugOnUpdate(instance: Product) {
    instance.beforeUpdateCalled = true;
    if (instance.changed('name') && instance.name) {
      instance.slug = instance.name.toLowerCase().replace(/\s+/g, '-');
    }
  }
}

export const models = {
  User,
  Product,
};

export { initialize };
