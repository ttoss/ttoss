/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/no-mocks-import */
import { InterfaceTypeComposer, schemaComposer } from 'graphql-compose';
import { UserTC, findByIdResolver } from './__mocks__/UserTC';
import { getNodeFieldConfig } from 'src/composeWithRelay/nodeFieldConfig';
import { getNodeInterface } from 'src/composeWithRelay/nodeInterface';
import { toGlobalId } from '@ttoss/ids';

describe('nodeFieldConfig', () => {
  const typeToFindByIdMap = {
    User: {
      resolver: findByIdResolver,
      tc: UserTC,
    },
  };

  const nodeInterface = getNodeInterface(schemaComposer);

  const config: any = getNodeFieldConfig(typeToFindByIdMap, nodeInterface);

  test('should have type GraphQLInterfaceType', () => {
    expect(config).toBeTruthy();
    expect(config.type).toBeInstanceOf(InterfaceTypeComposer);
    expect(config.type.getTypeName()).toBe('Node');
  });

  test('should have args with id', () => {
    expect(config.args.id.type).toBe('ID!');
  });

  test('should have resolve function', () => {
    expect(config.resolve).toBeDefined();
    expect(config.resolve.call).toBeDefined();
    expect(config.resolve.apply).toBeDefined();
  });

  test('should return null if args.id not defined', () => {
    const source = {};
    const args = {};
    const context = {};
    const info = {};
    expect(config.resolve(source, args, context, info)).toBeNull();
  });

  test('should return null if findById not defined for type', () => {
    const source = {};
    const args = { id: toGlobalId('UnexistedType', '1') };
    const context = {};
    const info = {};
    expect(config.resolve(source, args, context, info)).toBeNull();
  });

  test('should return Promise if type exists, but id not exist', () => {
    const source = {};
    const args = { id: toGlobalId('User', '666') };
    const context = {};
    const info = {};
    expect(config.resolve(source, args, context, info)).toBeInstanceOf(Promise);
  });

  test('should return Promise with user data', async () => {
    const source = {};
    const args = { id: toGlobalId('User', '1') };
    const context = {};
    const info = {};
    const res: any = await config.resolve(source, args, context, info);
    expect(res.name).toBe('Pavel');
  });
});
