import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { Sequelize } from 'sequelize';

import { initialize, models } from '../../models/dist';

jest.setTimeout(60000);

let sequelize: Sequelize;
let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.1-pg18-trixie'
  ).start();

  const db = await initialize({
    models,
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    createVectorExtension: true,
    define: {
      underscored: true,
    },
  });

  sequelize = db.sequelize;

  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
  await postgresContainer.stop();
});

describe('Hooks', () => {
  describe('@BeforeCreate', () => {
    test('should execute BeforeCreate hook when creating a product', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
      };

      const product = await models.Product.create(productData);

      // Check that the hook was called
      expect(product.beforeCreateCalled).toBe(true);
      // Check that the slug was automatically generated
      expect(product.slug).toBe('test-product');
    });

    test('should not override manually set slug in BeforeCreate hook', async () => {
      const productData = {
        name: 'Another Product',
        slug: 'custom-slug',
        price: 49.99,
      };

      const product = await models.Product.create(productData);

      expect(product.beforeCreateCalled).toBe(true);
      // Should keep the manually set slug
      expect(product.slug).toBe('custom-slug');
    });
  });

  describe('@BeforeUpdate', () => {
    test('should execute BeforeUpdate hook when updating a product name', async () => {
      // Create a product first
      const product = await models.Product.create({
        name: 'Original Name',
        price: 25.0,
      });

      // Update the product name
      await product.update({
        name: 'Updated Name',
      });

      // Reload the product to get fresh data
      await product.reload();

      // Check that the update hook was called
      expect(product.beforeUpdateCalled).toBe(true);
      // Check that the slug was updated
      expect(product.slug).toBe('updated-name');
    });

    test('should not update slug when updating other fields', async () => {
      // Create a product
      const product = await models.Product.create({
        name: 'Price Test Product',
        price: 100.0,
      });

      const originalSlug = product.slug;

      // Update only the price, not the name
      await product.update({
        price: 150.0,
      });

      await product.reload();

      // Hook should have been called
      expect(product.beforeUpdateCalled).toBe(true);
      // But slug should remain unchanged since name didn't change
      expect(product.slug).toBe(originalSlug);
    });

    test('should update slug when name is changed', async () => {
      const product = await models.Product.create({
        name: 'Initial Product',
        price: 75.0,
      });

      expect(product.slug).toBe('initial-product');

      // Update the name
      await product.update({
        name: 'Modified Product Name',
      });

      await product.reload();

      expect(product.beforeUpdateCalled).toBe(true);
      expect(product.slug).toBe('modified-product-name');
    });
  });

  describe('Multiple hooks', () => {
    test('should call both BeforeCreate and BeforeUpdate hooks independently', async () => {
      // Create
      const product = await models.Product.create({
        name: 'Hook Test',
        price: 50.0,
      });

      expect(product.beforeCreateCalled).toBe(true);
      expect(product.beforeUpdateCalled).toBe(false);
      expect(product.slug).toBe('hook-test');

      // Update
      await product.update({
        name: 'Updated Hook Test',
      });

      await product.reload();

      expect(product.beforeCreateCalled).toBe(true);
      expect(product.beforeUpdateCalled).toBe(true);
      expect(product.slug).toBe('updated-hook-test');
    });
  });
});
