import { test, expect } from '@playwright/test';

test.describe('Customer Registration Flow', () => {
  test('public user can only register as customer', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');

    // Fill the registration form
    const uniqueEmail = `test_customer_${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePassword123');

    // Note: The UI doesn't expose a role dropdown anymore, which enforces the requirement on the frontend.
    // Let's submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or welcome page
    await page.waitForURL('/dashboard');

    // Check if the user is registered as customer. 
    // We can verify this via UI elements (e.g. checking the profile) or verifying the API response.
    // For now, ensuring successful login and no error is the main criteria.
    const heading = await page.textContent('h1');
    expect(heading).toContain('Dashboard');
    
    // We should ensure the role is indeed 'customer' from the local storage or UI
    const token = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(token).toContain('"role":"customer"');
  });

  test('backend rejects invalid roles for public signup', async ({ request }) => {
    const uniqueEmail = `test_hacker_${Date.now()}@example.com`;
    
    const response = await request.post('http://localhost:8000/api/v1/auth/register', {
      data: {
        name: 'Hacker',
        email: uniqueEmail,
        password: 'SecurePassword123',
        role: 'admin' // Attempting to register as admin
      }
    });

    // Should be rejected by backend Validation/RBAC
    expect(response.status()).toBe(422);
    
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('Role \\\'admin\\\' is not available for self-registration');
  });
});
