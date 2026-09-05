import { test, expect } from '@playwright/test';

// Use a mocked local URL if you start next.js without backend
const NEXT_URL = 'http://localhost:3000';

test.describe('End-to-End DealFlow360 Customer Portal', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock the Auth API
    await page.route('**/api/v1/auth/login', async route => {
      const json = { access_token: 'mock-token', token_type: 'bearer', user: { id: 'c1', email: 'customer@example.com', role: 'customer' } };
      await route.fulfill({ json });
    });
    
    await page.route('**/api/v1/auth/me', async route => {
      const json = { id: 'c1', email: 'customer@example.com', role: 'customer' };
      await route.fulfill({ json });
    });

    // Mock Quotations API
    await page.route('**/api/v1/customers/me/quotations', async route => {
      const json = [
        {
          id: 'quote-123',
          deal_name: 'Acme Corp Software Renewal',
          customer_name: 'Acme Corp',
          status: 'SENT',
          subtotal: 10000,
          total_discount: 1000,
          total: 9000,
          lines: []
        }
      ];
      await route.fulfill({ json });
    });

    // Mock Specific Quote details
    await page.route('**/api/v1/portal/quotes/quote-123', async route => {
      const json = {
        id: 'quote-123',
        deal_name: 'Acme Corp Software Renewal',
        customer_name: 'Acme Corp',
        status: 'SENT',
        subtotal: 10000,
        total_discount: 1000,
        total: 9000,
        lines: [
          {
            id: 'line-1',
            product_id: 'prod-1',
            product_name: 'Enterprise License',
            quantity: 10,
            unit_price: 1000,
            discount_percent: 10,
            total_price: 9000
          }
        ]
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/v1/portal/quotes/quote-123/messages', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] });
      } else if (route.request().method() === 'POST') {
        const json = {
          id: 'msg-1',
          content: 'Test message sent',
          sender_type: 'CUSTOMER',
          created_at: new Date().toISOString()
        };
        await route.fulfill({ json });
      }
    });

    // Mock Quote confirmation
    await page.route('**/api/v1/portal/quotes/quote-123/confirm', async route => {
      const json = { message: 'Quote accepted and Order created successfully' };
      await route.fulfill({ json });
    });

    // Mock Orders API
    await page.route('**/api/v1/customers/me/orders', async route => {
      const json = [
        {
          id: 'order-123',
          quotation_id: 'quote-123',
          status: 'pending_fulfillment',
          created_at: new Date().toISOString(),
          customer_name: 'Acme Corp',
          deal_name: 'Order for Acme Corp Software Renewal'
        }
      ];
      await route.fulfill({ json });
    });

    // Mock Invoices API
    await page.route('**/api/v1/customers/me/invoices', async route => {
      await route.fulfill({ json: [] });
    });
    
    // Mock Subscriptions API
    await page.route('**/api/v1/customers/me/subscriptions', async route => {
      await route.fulfill({ json: [] });
    });
  });

  test('Customer can login, view quotation, and accept it to create an order', async ({ page }) => {
    // Navigate to Login Page
    await page.goto(`${NEXT_URL}/login`);
    
    // Fill in credentials and submit
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Check that we see active quotations count
    await expect(page.getByText('Active Quotations').locator('..').locator('.text-2xl')).toContainText('1');

    // Navigate to Quotations List
    await page.click('text=Active Quotations');
    await page.waitForURL('**/portal/quotations');
    
    // Verify the quote is listed
    await expect(page.locator('h3', { hasText: 'Acme Corp Software Renewal' })).toBeVisible();

    // View the quote details
    await page.getByRole('link', { name: /View & Negotiate/i }).click();
    await page.waitForURL('**/portal/quotations/quote-123');
    
    // Check Quote Details page structure
    await expect(page.locator('h1')).toContainText('Acme Corp Software Renewal');
    
    // Test the messaging feature (Negotiation)
    await page.fill('textarea[placeholder*="Ask about terms"]', 'Could we get a further discount?');
    await page.click('button:has-text("Send")');
    await expect(page.getByText('Test message sent')).toBeVisible();

    // Confirm the quotation
    await page.click('button:has-text("Confirm Quotation")');
    
    // Wait for the confirmation dialog
    const dialog = page.locator('div', { hasText: 'Confirm Quotation?' }).last();
    await expect(dialog).toBeVisible();
    await page.click('button:has-text("Yes, Confirm Order")');

    // The component should render the success screen
    await expect(page.locator('h1')).toContainText('Quotation Confirmed!');

    // Follow the link to view the order
    await page.click('text=View My Orders →');
    await page.waitForURL('**/portal/orders');

    // Check that the order is listed
    await expect(page.locator('h3', { hasText: 'Order for Acme Corp Software Renewal' })).toBeVisible();
    await expect(page.getByText(/pending fulfillment/i)).toBeVisible();
  });
});
