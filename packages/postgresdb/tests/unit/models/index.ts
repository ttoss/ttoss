import { Column, Model, Table } from 'src/index';

@Table
export class User extends Model {
  @Column
  declare name: string;

  @Column
  declare email: string;
}
