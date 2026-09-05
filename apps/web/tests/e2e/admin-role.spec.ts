import { test, expect } from '@playwright/test';

test.describe('Admin Role Constraints', () => {
  let adminToken = '';
  let salesToken = '';

  test.beforeAll(async ({ request }) => {
    // Ensure admin user exists and get token
    const adminRes = await request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'admin@dealflow360.com', password: 'admin' }
    });
    if (adminRes.ok()) {
      const data = await adminRes.json();
      adminToken = data.access_token;
    } else {
      // Create admin if not exists
      const registerRes = await request.post('http://localhost:8000/api/v1/auth/register', {
        data: { name: 'Admin', email: 'admin@dealflow360.com', password: 'admin', role: 'customer' } // Initially created as customer
      });
      // In a real test setup, we would seed the database with an admin directly.
      // Assuming seed data already contains admin@dealflow360.com with password 'admin'
    }
  });

  test('admin can access and modify configuration', async ({ request }) => {
    test.skip(!adminToken, 'Admin token not available. Run database seed first.');
    
    // Create Category
    const createRes = await request.post('http://localhost:8000/api/v1/admin/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: `E2E Category ${Date.now()}`,
        description: 'Test category',
        is_active: true
      }
    });
    
    expect(createRes.status()).toBe(201);
  });

  test('non-admin cannot modify configuration', async ({ request }) => {
    // Create a sales user
    const uniqueEmail = `sales_${Date.now()}@example.com`;
    const registerRes = await request.post('http://localhost:8000/api/v1/auth/register', {
      data: { name: 'Sales', email: uniqueEmail, password: 'password123', role: 'customer' }
    });
    const regData = await registerRes.json();
    salesToken = regData.access_token;

    // Try to create category as non-admin
    const createRes = await request.post('http://localhost:8000/api/v1/admin/categories', {
      headers: { Authorization: `Bearer ${salesToken}` },
      data: {
        name: `Hacked Category`,
        description: 'Test category',
        is_active: true
      }
    });
    
    // Should be Forbidden
    expect(createRes.status()).toBe(403);
  });
});
