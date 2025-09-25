const { test, expect } = require('@playwright/test');const { test, expect } = require('@playwright/test');const { test, expect } = require('@playwright/test');const { test, expect } = require('@playwright/test');



test.describe('Nurse Workflow Tests', () => {

  test.beforeEach(async ({ page }) => {

    // Navigate to the application (will redirect to login if not authenticated)test.describe('Nurse Workflow Tests', () => {

    await page.goto('http://localhost:3000');

  });  test.beforeEach(async ({ page }) => {



  test('Nurse login and home page redirect', async ({ page }) => {    // Navigate to the application (will redirect to login if not authenticated)test.describe('Nurse Workflow Tests', () => {test.describe('Nurse Workflow Tests', () => {

    // Should be redirected to login page

    await expect(page).toHaveURL('http://localhost:3000/login');    await page.goto('http://localhost:3000');



    // Fill in nurse credentials  });  test.beforeEach(async ({ page }) => {  test.beforeEach(async ({ page }) => {

    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');



    // Submit login form  test('Nurse login and home page redirect', async ({ page }) => {    // Navigate to the application (will redirect to login if not authenticated)    // Navigate to the application

    await page.click('button[type="submit"]');

    // Should be redirected to login page

    // Verify nurse is redirected to home page

    await expect(page).toHaveURL('http://localhost:3000/');    await expect(page).toHaveURL('http://localhost:3000/login');    await page.goto('http://localhost:3000');    await page.goto('http://localhost:3000');



    // Verify nurse-specific content is visible

    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();

    await expect(page.locator('text=Patient Search')).toBeVisible();    // Fill in nurse credentials  });  });

  });

    await page.fill('input[name="username"]', 'nurse');

  test('Nurse home page layout - search and assessments side by side', async ({ page }) => {

    // Login as nurse first    await page.fill('input[name="password"]', 'nurse');

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');    // Submit login form  test('Nurse login and home page redirect', async ({ page }) => {  test('Nurse login and home page redirect', async ({ page }) => {



    // Verify the layout - search card should be col-lg-3 and assessments col-lg-9    await page.click('button[type="submit"]');

    const searchCard = page.locator('text=Patient Search').locator('xpath=ancestor::div[contains(@class, "col-lg-3")]');

    await expect(searchCard).toBeVisible();    // Should be redirected to login page    // Click login link (assuming there's a login link on the home page)



    // Check if current assessments section exists    // Verify nurse is redirected to home page

    const assessmentsSection = page.locator('text=Your Current Assessments');

    if (await assessmentsSection.isVisible()) {    await expect(page).toHaveURL('http://localhost:3000/');    await expect(page).toHaveURL('http://localhost:3000/login');    await page.click('text=Login');

      // Should be in col-lg-9

      const assessmentsCard = assessmentsSection.locator('xpath=ancestor::div[contains(@class, "col-lg-9")]');

      await expect(assessmentsCard).toBeVisible();

    // Verify nurse-specific content is visible

      console.log('Layout verified: Search (1/3) and Assessments (2/3) side by side');

    }    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();

  });

    await expect(page.locator('text=nurse')).toBeVisible();    // Fill in nurse credentials    // Wait for login form to appear

  test('Nurse logout functionality', async ({ page }) => {

    // Login as nurse first    await expect(page.locator('text=Patient Search')).toBeVisible();

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');  });    await page.fill('input[name="username"]', 'nurse');    await page.waitForSelector('form[action="/login"]');

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');



    // Verify logged in  test('Nurse home page displays current assessments', async ({ page }) => {    await page.fill('input[name="password"]', 'nurse');

    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();

    // Login as nurse first

    // Click logout button

    await page.click('button:has-text("Logout")');    await page.goto('http://localhost:3000/login');    // Fill in nurse credentials



    // Should be redirected to login page    await page.fill('input[name="username"]', 'nurse');

    await expect(page).toHaveURL('http://localhost:3000/login');

    await page.fill('input[name="password"]', 'nurse');    // Submit login form    await page.fill('input[name="username"]', 'nurse');

    console.log('Successfully logged out');

  });    await page.click('button[type="submit"]');

});
    await page.click('button[type="submit"]');    await page.fill('input[name="password"]', 'password');

    // Check if current assessments section exists

    const assessmentsSection = page.locator('text=Your Current Assessments');

    const isVisible = await assessmentsSection.isVisible();

    // Verify nurse is redirected to home page    // Submit login form

    if (isVisible) {

      // Verify the assessments table structure    await expect(page).toHaveURL('http://localhost:3000/');    await page.click('button[type="submit"]');

      await expect(page.locator('th:has-text("Visit Date")')).toBeVisible();

      await expect(page.locator('th:has-text("Patient")')).toBeVisible();

      await expect(page.locator('th:has-text("Status")')).toBeVisible();

      await expect(page.locator('th:has-text("Actions")')).toBeVisible();    // Verify nurse-specific content is visible    // Verify nurse is redirected to home page



      // Check for action buttons    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();    await expect(page).toHaveURL('http://localhost:3000/');

      const startButtons = page.locator('text=Start');

      const continueButtons = page.locator('text=Continue');    await expect(page.locator('text=nurse')).toBeVisible();



      const startCount = await startButtons.count();    await expect(page.locator('text=Patient Search')).toBeVisible();    // Verify nurse-specific content is visible

      const continueCount = await continueButtons.count();

  });    await expect(page.locator('text=Welcome')).toContainText('nurse');

      console.log(`Found ${startCount} Start buttons and ${continueCount} Continue buttons`);

    } else {    await expect(page.locator('text=Patient Search')).toBeVisible();

      console.log('No current assessments found for this nurse');

    }  test('Nurse home page displays current assessments', async ({ page }) => {  });

  });

    // Login as nurse first

  test('Nurse can access patient search', async ({ page }) => {

    // Login as nurse first    await page.goto('http://localhost:3000/login');  test('Nurse home page displays current assessments', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');    await page.fill('input[name="username"]', 'nurse');    // Login as nurse first

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');    await page.fill('input[name="password"]', 'nurse');    await page.click('text=Login');



    // Click on Patient Search card    await page.click('button[type="submit"]');    await page.waitForSelector('form[action="/login"]');

    await page.click('text=Search Patient');

    await page.fill('input[name="username"]', 'nurse');

    // Verify navigation to patient search page

    await expect(page).toHaveURL('http://localhost:3000/nurse/search-patient');    // Check if current assessments section exists    await page.fill('input[name="password"]', 'password');



    // Verify search form is present    const assessmentsSection = page.locator('text=Your Current Assessments');    await page.click('button[type="submit"]');

    await expect(page.locator('input[placeholder*="SSN"]')).toBeVisible();

    await expect(page.locator('button:has-text("Search")')).toBeVisible();    const isVisible = await assessmentsSection.isVisible();

  });

    // Check if current assessments section exists

  test('Nurse assessment workflow', async ({ page }) => {

    // Login as nurse first    if (isVisible) {    const assessmentsSection = page.locator('text=Your Current Assessments');

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');      // Verify the assessments table structure    const isVisible = await assessmentsSection.isVisible();

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');      await expect(page.locator('th:has-text("Visit Date")')).toBeVisible();



    // Check if there are any assessments to work with      await expect(page.locator('th:has-text("Patient")')).toBeVisible();    if (isVisible) {

    const startButton = page.locator('text=Start').first();

    const continueButton = page.locator('text=Continue').first();      await expect(page.locator('th:has-text("Status")')).toBeVisible();      // Verify the assessments table structure



    if (await startButton.isVisible()) {      await expect(page.locator('th:has-text("Actions")')).toBeVisible();      await expect(page.locator('th:has-text("Visit Date")')).toBeVisible();

      // Click Start button for a new assessment

      await startButton.click();      await expect(page.locator('th:has-text("Patient")')).toBeVisible();



      // Verify navigation to assessment page      // Check for action buttons      await expect(page.locator('th:has-text("Status")')).toBeVisible();

      await expect(page).toHaveURL(/\/nurse\/assessment\/\w+/);

      const startButtons = page.locator('text=Start');      await expect(page.locator('th:has-text("Actions")')).toBeVisible();

      // Verify assessment form elements are present

      await expect(page.locator('text=Patient Information')).toBeVisible();      const continueButtons = page.locator('text=Continue');



      console.log('Successfully started a new assessment');      // Check for action buttons

    } else if (await continueButton.isVisible()) {

      // Click Continue button for existing assessment      const startCount = await startButtons.count();      const startButtons = page.locator('text=Start');

      await continueButton.click();

      const continueCount = await continueButtons.count();      const continueButtons = page.locator('text=Continue');

      // Verify navigation to assessment page

      await expect(page).toHaveURL(/\/nurse\/assessment\/\w+/);



      console.log('Successfully continued an existing assessment');      console.log(`Found ${startCount} Start buttons and ${continueCount} Continue buttons`);      const startCount = await startButtons.count();

    } else {

      console.log('No assessments available to test workflow');    } else {      const continueCount = await continueButtons.count();

    }

  });      console.log('No current assessments found for this nurse');



  test('Nurse can view all assessments', async ({ page }) => {    }      console.log(`Found ${startCount} Start buttons and ${continueCount} Continue buttons`);

    // Login as nurse first

    await page.goto('http://localhost:3000/login');  });    } else {

    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');      console.log('No current assessments found for this nurse');

    await page.click('button[type="submit"]');

  test('Nurse can access patient search', async ({ page }) => {    }

    // Check if "View All Assessments" link exists

    const viewAllLink = page.locator('text=View All Assessments');    // Login as nurse first  });



    if (await viewAllLink.isVisible()) {    await page.goto('http://localhost:3000/login');

      await viewAllLink.click();

    await page.fill('input[name="username"]', 'nurse');  test('Nurse can access patient search', async ({ page }) => {

      // Verify navigation to assessments list page

      await expect(page).toHaveURL('http://localhost:3000/nurse/my-assessments');    await page.fill('input[name="password"]', 'nurse');    // Login as nurse first



      // Verify page content    await page.click('button[type="submit"]');    await page.click('text=Login');

      await expect(page.locator('text=Assessment History')).toBeVisible();

    await page.waitForSelector('form[action="/login"]');

      console.log('Successfully accessed all assessments page');

    } else {    // Click on Patient Search card    await page.fill('input[name="username"]', 'nurse');

      console.log('View All Assessments link not found');

    }    await page.click('text=Search Patient');    await page.fill('input[name="password"]', 'password');

  });

    await page.click('button[type="submit"]');

  test('Responsive design - mobile view', async ({ page }) => {

    // Set viewport to mobile size    // Verify navigation to patient search page

    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page).toHaveURL('http://localhost:3000/nurse/search-patient');    // Click on Patient Search card

    // Login as nurse

    await page.goto('http://localhost:3000/login');    await page.click('text=Search Patient');

    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');    // Verify search form is present

    await page.click('button[type="submit"]');

    await expect(page.locator('input[placeholder*="SSN"]')).toBeVisible();    // Verify navigation to patient search page

    // Verify mobile layout - cards should stack vertically

    const searchCard = page.locator('text=Patient Search').locator('xpath=ancestor::div[contains(@class, "col-")]');    await expect(page.locator('button:has-text("Search")')).toBeVisible();    await expect(page).toHaveURL('http://localhost:3000/nurse/search-patient');

    const searchClasses = await searchCard.getAttribute('class');

  });

    // On mobile, should be full width (col-12)

    expect(searchClasses).toContain('col-12');    // Verify search form is present



    console.log('Mobile responsive design verified');  test('Nurse assessment workflow', async ({ page }) => {    await expect(page.locator('input[placeholder*="SSN"]')).toBeVisible();

  });

    // Login as nurse first    await expect(page.locator('button:has-text("Search")')).toBeVisible();

  test('Nurse logout functionality', async ({ page }) => {

    // Login as nurse first    await page.goto('http://localhost:3000/login');  });

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');    await page.fill('input[name="password"]', 'nurse');  test('Nurse assessment workflow', async ({ page }) => {



    // Verify logged in    await page.click('button[type="submit"]');    // Login as nurse first

    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();

    await page.click('text=Login');

    // Click logout button

    await page.click('button:has-text("Logout")');    // Check if there are any assessments to work with    await page.waitForSelector('form[action="/login"]');



    // Should be redirected to login page    const startButton = page.locator('text=Start').first();    await page.fill('input[name="username"]', 'nurse');

    await expect(page).toHaveURL('http://localhost:3000/login');

    const continueButton = page.locator('text=Continue').first();    await page.fill('input[name="password"]', 'password');

    console.log('Successfully logged out');

  });    await page.click('button[type="submit"]');

});
    if (await startButton.isVisible()) {

      // Click Start button for a new assessment    // Check if there are any assessments to work with

      await startButton.click();    const startButton = page.locator('text=Start').first();

    const continueButton = page.locator('text=Continue').first();

      // Verify navigation to assessment page

      await expect(page).toHaveURL(/\/nurse\/assessment\/\w+/);    if (await startButton.isVisible()) {

      // Click Start button for a new assessment

      // Verify assessment form elements are present      await startButton.click();

      await expect(page.locator('text=Patient Information')).toBeVisible();

      // Verify navigation to assessment page

      console.log('Successfully started a new assessment');      await expect(page).toHaveURL(/\/nurse\/assessment\/\d+/);

    } else if (await continueButton.isVisible()) {

      // Click Continue button for existing assessment      // Verify assessment form elements are present

      await continueButton.click();      await expect(page.locator('text=Patient Information')).toBeVisible();



      // Verify navigation to assessment page      console.log('Successfully started a new assessment');

      await expect(page).toHaveURL(/\/nurse\/assessment\/\w+/);    } else if (await continueButton.isVisible()) {

      // Click Continue button for existing assessment

      console.log('Successfully continued an existing assessment');      await continueButton.click();

    } else {

      console.log('No assessments available to test workflow');      // Verify navigation to assessment page

    }      await expect(page).toHaveURL(/\/nurse\/assessment\/\d+/);

  });

      console.log('Successfully continued an existing assessment');

  test('Nurse can view all assessments', async ({ page }) => {    } else {

    // Login as nurse first      console.log('No assessments available to test workflow');

    await page.goto('http://localhost:3000/login');    }

    await page.fill('input[name="username"]', 'nurse');  });

    await page.fill('input[name="password"]', 'nurse');

    await page.click('button[type="submit"]');  test('Nurse can view all assessments', async ({ page }) => {

    // Login as nurse first

    // Check if "View All Assessments" link exists    await page.click('text=Login');

    const viewAllLink = page.locator('text=View All Assessments');    await page.waitForSelector('form[action="/login"]');

    await page.fill('input[name="username"]', 'nurse');

    if (await viewAllLink.isVisible()) {    await page.fill('input[name="password"]', 'password');

      await viewAllLink.click();    await page.click('button[type="submit"]');



      // Verify navigation to assessments list page    // Check if "View All Assessments" link exists

      await expect(page).toHaveURL('http://localhost:3000/nurse/my-assessments');    const viewAllLink = page.locator('text=View All Assessments');



      // Verify page content    if (await viewAllLink.isVisible()) {

      await expect(page.locator('text=Assessment History')).toBeVisible();      await viewAllLink.click();



      console.log('Successfully accessed all assessments page');      // Verify navigation to assessments list page

    } else {      await expect(page).toHaveURL('http://localhost:3000/nurse/my-assessments');

      console.log('View All Assessments link not found');

    }      // Verify page content

  });      await expect(page.locator('text=Assessment History')).toBeVisible();



  test('Responsive design - mobile view', async ({ page }) => {      console.log('Successfully accessed all assessments page');

    // Set viewport to mobile size    } else {

    await page.setViewportSize({ width: 375, height: 667 });      console.log('View All Assessments link not found');

    }

    // Login as nurse  });

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'nurse');  test('Responsive design - mobile view', async ({ page }) => {

    await page.fill('input[name="password"]', 'nurse');    // Set viewport to mobile size

    await page.click('button[type="submit"]');    await page.setViewportSize({ width: 375, height: 667 });



    // Verify mobile layout - cards should stack vertically    // Login as nurse

    const searchCard = page.locator('text=Patient Search').locator('xpath=ancestor::div[contains(@class, "col-")]');    await page.click('text=Login');

    const searchClasses = await searchCard.getAttribute('class');    await page.waitForSelector('form[action="/login"]');

    await page.fill('input[name="username"]', 'nurse');

    // On mobile, should be full width (col-12)    await page.fill('input[name="password"]', 'password');

    expect(searchClasses).toContain('col-12');    await page.click('button[type="submit"]');



    console.log('Mobile responsive design verified');    // Verify mobile layout - cards should stack vertically

  });    const searchCard = page.locator('text=Patient Search').locator('xpath=ancestor::div[contains(@class, "col-")]');

    const searchClasses = await searchCard.getAttribute('class');

  test('Nurse logout functionality', async ({ page }) => {

    // Login as nurse first    // On mobile, should be full width (col-12)

    await page.goto('http://localhost:3000/login');    expect(searchClasses).toContain('col-12');

    await page.fill('input[name="username"]', 'nurse');

    await page.fill('input[name="password"]', 'nurse');    console.log('Mobile responsive design verified');

    await page.click('button[type="submit"]');  });

});
    // Verify logged in
    await expect(page.locator('text=Welcome, Nurse One')).toBeVisible();

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should be redirected to login page
    await expect(page).toHaveURL('http://localhost:3000/login');

    console.log('Successfully logged out');
  });
});