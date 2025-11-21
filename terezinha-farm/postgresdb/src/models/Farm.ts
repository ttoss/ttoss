import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from '@ttoss/postgresdb';

import { User } from './User';

@Table({
  tableName: 'farms',
  modelName: 'farms',
  indexes: [],
})
export class Farm extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => {
    return User;
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @BelongsTo(
    () => {
      return User;
    },
    { foreignKey: 'user_id' }
  )
  declare user: User;
}
