/* eslint-disable jest/no-mocks-import */
import {
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLSchema,
  graphql,
} from 'graphql-compose/lib/graphql';
import { ObjectTypeComposer, schemaComposer } from 'graphql-compose';
import { UserTC } from './__mocks__/UserTC';
import { composeWithRelay, toGlobalId } from '../../../src';

describe('composeWithRelay', () => {
  const userComposer = composeWithRelay(UserTC);
  const queryTC = composeWithRelay(schemaComposer.Query);

  describe('basic checks', () => {
    test('should return ObjectTypeComposer', () => {
      expect(userComposer).toBeInstanceOf(ObjectTypeComposer);
    });

    test('should throw error if got a not ObjectTypeComposer', () => {
      expect(() => {
        return composeWithRelay(123 as any);
      }).toThrow('should provide ObjectTypeComposer instance');
    });

    test('should throw error if ObjectTypeComposer without recordIdFn', () => {
      const tc = UserTC.clone('AnotherUserType2');
      delete tc._gqcGetRecordIdFn;
      expect(() => {
        return composeWithRelay(tc);
      }).toThrow('should have recordIdFn');
    });

    test('should thow error if typeComposer does not have findById resolver', () => {
      const tc = UserTC.clone('AnotherUserType');
      tc.removeResolver('findById');
      expect(() => {
        return composeWithRelay(tc);
      }).toThrow("does not have resolver with name 'findById'");
    });
  });

  describe('when pass RootQuery type composer', () => {
    test('should add `node` field to RootQuery', () => {
      const nodeField: any = queryTC.getField('node');
      expect(nodeField.type.getType()).toBeInstanceOf(GraphQLInterfaceType);
      expect(nodeField.type.getTypeName()).toBe('Node');
    });
  });

  describe('when pass User type composer (not RootQuery)', () => {
    test('should add or override id field', () => {
      const idField = userComposer.getFieldConfig('id');
      expect(idField.description).toContain('globally unique ID');
    });

    test('should make id field NonNull', () => {
      const idField = userComposer.getFieldConfig('id');
      expect(idField.type).toBeInstanceOf(GraphQLNonNull);
    });

    test('should resolve globalId in `user.id` field', async () => {
      queryTC.setField('user', UserTC.getResolver('findById'));
      const schema = new GraphQLSchema({
        query: queryTC.getType(),
      });
      const query = `{
        user(id: "${toGlobalId('User', 1)}") {
          id
          name
        }
      }`;
      const result: any = await graphql({ schema, source: query });
      expect(result.data.user.id).toBe(toGlobalId('User', 1));
      expect(result.data.user.name).toBe('Pavel');
    });

    test('should resolve globalId in `node.id` field', async () => {
      queryTC.setField('user', UserTC.getResolver('findById'));
      const schema = new GraphQLSchema({
        query: queryTC.getType(),
      });
      const query = `{
        node(id: "${toGlobalId('User', 1)}") {
          ...user
        }
      }
      fragment user on User {
        id
        name
      }`;
      const result: any = await graphql({ schema, source: query });
      expect(result.data.node.id).toBe(toGlobalId('User', 1));
      expect(result.data.node.name).toBe('Pavel');
    });
  });
});
