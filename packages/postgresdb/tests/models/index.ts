import { Column, DataType, initialize, Model, Table } from '@ttoss/postgresdb';

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

export const models = {
  User,
};

export { initialize };
