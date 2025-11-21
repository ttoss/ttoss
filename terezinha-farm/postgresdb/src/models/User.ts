import { Column, DataType, HasOne, Model, Table } from '@ttoss/postgresdb';

import { Farm } from './Farm';

@Table({
  tableName: 'users',
  modelName: 'users',
  indexes: [],
})
export class User extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @HasOne(
    () => {
      return Farm;
    },
    { foreignKey: 'user_id' }
  )
  declare farm: Farm;
}
