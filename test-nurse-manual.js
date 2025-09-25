const { chromium } = require('playwright');

async function testNurseWorkflow() {
  console.log('Starting nurse workflow test...');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');

    // Check if redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('✅ Redirected to login page as expected');

      // Fill login form
      await page.fill('input[name="username"]', 'nurse');
      await page.fill('input[name="password"]', 'nurse');
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForURL('http://localhost:3000/');
      console.log('✅ Successfully logged in as nurse');

      // Check for nurse-specific content
      const welcomeText = await page.locator('text=Welcome, Nurse One').isVisible();
      const searchCard = await page.locator('text=Patient Search').isVisible();

      if (welcomeText && searchCard) {
        console.log('✅ Nurse dashboard loaded correctly');

        // Check layout - search should be col-lg-3
        const searchColumn = await page.locator('text=Patient Search').locator('xpath=ancestor::div[contains(@class, "col-lg-3")]').isVisible();
        console.log('✅ Search card has correct 1/3 width layout');

        // Check if assessments are visible
        const assessmentsVisible = await page.locator('text=Your Current Assessments').isVisible();
        if (assessmentsVisible) {
          console.log('✅ Current assessments section is visible');

          // Check layout - assessments should be col-lg-9
          const assessmentsColumn = await page.locator('text=Your Current Assessments').locator('xpath=ancestor::div[contains(@class, "col-lg-9")]').isVisible();
          console.log('✅ Assessments section has correct 2/3 width layout');
        } else {
          console.log('ℹ️  No current assessments found for this nurse');
        }

        // Test logout
        await page.click('button:has-text("Logout")');
        await page.waitForURL('http://localhost:3000/login');
        console.log('✅ Successfully logged out');

      } else {
        console.log('❌ Nurse dashboard did not load correctly');
      }

    } else {
      console.log('❌ Not redirected to login page');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }

  console.log('Test completed!');
}

// Run the test
testNurseWorkflow().catch(console.error);