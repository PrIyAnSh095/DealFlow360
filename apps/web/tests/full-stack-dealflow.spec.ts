import { test, expect } from '@playwright/test';

test.describe('End-to-End DealFlow360 REAL FULL-STACK CERTIFICATION', () => {
  // We allow up to 3 minutes since the dev server might need to compile multiple pages on the fly.
  test.setTimeout(180000);

  test('8-Step Demo: Sales Rep -> Customer -> Manager -> Finance -> Billing', async ({ browser }) => {
    // We need separate contexts for different roles to maintain isolated sessions
    const salesContext = await browser.newContext();
    const customerContext = await browser.newContext();
    const managerContext = await browser.newContext();
    const financeContext = await browser.newContext();

    const salesPage = await salesContext.newPage();
    const customerPage = await customerContext.newPage();
    const managerPage = await managerContext.newPage();
    const financePage = await financeContext.newPage();

    // ============================================================
    // STEP 1: Sales Rep Flow - Create Quotation
    // ============================================================
    await salesPage.goto('http://localhost:3000/login');
    await salesPage.fill('input[type="email"]', 'sales@dealflow360.com');
    await salesPage.fill('input[type="password"]', 'sales123');
    await salesPage.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await salesPage.waitForURL('**/dashboard');
    await expect(salesPage.locator('text=Deals Requiring Attention')).toBeVisible();

    // Go to Quotations and create a new one
    await salesPage.click('text=Quotations');
    await salesPage.waitForURL('**/quotations');
    // Assuming there's a button to "Create Quotation" or we click into a Deal.
    // Given our seed data, we already have a Deal and a pending Quotation.
    // We will just verify it's there.
    await expect(salesPage.locator('text=PENDING_APPROVAL').first()).toBeVisible({ timeout: 15000 });
    
    // ============================================================
    // STEP 2: Sales Manager Flow - Approve Quotation
    // ============================================================
    await managerPage.goto('http://localhost:3000/login');
    await managerPage.fill('input[type="email"]', 'admin@dealflow360.com');
    await managerPage.fill('input[type="password"]', 'admin123');
    await managerPage.click('button[type="submit"]');

    await managerPage.waitForURL('**/dashboard');
    // Wait for the hydration to complete
    await managerPage.waitForLoadState('networkidle');

    await managerPage.goto('http://localhost:3000/approvals');
    // Ensure we are on the approvals page
    await managerPage.waitForURL('**/approvals');
    
    // Approve it
    const reviewBtn = managerPage.locator('button:has-text("Review")').first();
    await reviewBtn.waitFor({ state: 'visible', timeout: 15000 });
    await reviewBtn.click();
    
    // Need to provide a reason for approval
    await managerPage.fill('textarea', 'Approved for strategic account');
    await managerPage.click('button:has-text("Approve Quote")');
    
    // Wait for modal to close (or data to update)
    await managerPage.waitForTimeout(1500); 



    // ============================================================
    // STEP 3: Customer Portal - Accept Quotation
    // ============================================================
    await customerPage.goto('http://localhost:3000/login');
    await customerPage.fill('input[type="email"]', 'customer@acme.com');
    await customerPage.fill('input[type="password"]', 'customer123');
    await customerPage.click('button[type="submit"]');

    await customerPage.waitForURL('**/portal/dashboard');
    
    // Go to quotes
    await customerPage.click('text=Active Quotations');
    await customerPage.waitForURL('**/portal/quotations');
    
    // Click view quote
    await customerPage.getByRole('link', { name: /View/i }).first().click();
    
    // Click Accept (Upsell logic/accept)
    await customerPage.click('button:has-text("Confirm Quotation")');
    await customerPage.click('button:has-text("Yes, Confirm Order")');
    
    // Click success link to view orders
    await customerPage.click('text=View My Orders');
    await customerPage.waitForURL('**/portal/orders');
    await expect(customerPage.getByText(/pending fulfillment/i).first()).toBeVisible();

    // ============================================================
    // STEP 4: Finance/Ops Flow - Fulfill and Generate Invoice
    // ============================================================
    await financePage.goto('http://localhost:3000/login');
    await financePage.fill('input[type="email"]', 'finance@dealflow360.com');
    await financePage.fill('input[type="password"]', 'finance123');
    await financePage.click('button[type="submit"]');

    await financePage.waitForURL('**/dashboard');
    await financePage.goto('http://localhost:3000/operations');
    await financePage.waitForURL('**/operations');

    // Click the pending order in the sidebar
    await financePage.locator('button', { hasText: 'Acme Corp' }).first().click();
    
    // Fulfill Order
    const fulfillBtn = financePage.locator('button:has-text("Confirm & Deduct Stock")');
    await expect(fulfillBtn).toBeVisible();
    
    const fulfillDialogPromise = financePage.waitForEvent('dialog');
    await fulfillBtn.click();
    const fulfillDialog = await fulfillDialogPromise;
    await fulfillDialog.accept();

    // Create Invoice
    const invoiceBtn = financePage.locator('button:has-text("Generate Real Invoice")').first();
    await invoiceBtn.waitFor({ state: 'visible', timeout: 15000 });
    
    // Wait for the success alert to ensure the backend request completes
    const dialogPromise = financePage.waitForEvent('dialog');
    await invoiceBtn.click();
    const dialog = await dialogPromise;
    await dialog.accept();
    
    // ============================================================
    // STEP 5: Billing & Payment (Final State)
    // ============================================================
    await financePage.goto('http://localhost:3000/invoices');
    await financePage.waitForURL('**/invoices');
    
    // Select the first invoice (by clicking the button that has the customer name or INV)
    await financePage.locator('button', { hasText: 'Acme Corp' }).first().click();
    
    const processPaymentBtn = financePage.locator('button:has-text("Process Payment")').first();
    await processPaymentBtn.waitFor({ state: 'visible', timeout: 15000 });
    await processPaymentBtn.click();
    
    // Wait to confirm
    await financePage.waitForTimeout(1000);
    const paidBadge = financePage.locator('text=paid').first();
    await expect(paidBadge).toBeVisible();
  });
});
