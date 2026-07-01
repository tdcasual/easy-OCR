const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // Create a small test image
  const testImagePath = path.join(__dirname, '../tmp/smoke-test.png');
  fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
  // Minimal valid 1x1 PNG
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', request => console.log('REQUEST:', request.method(), request.url()));
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      console.log('RESPONSE:', response.status(), url);
      if (response.status() >= 400) {
        console.log('API ERROR BODY:', await response.text().catch(() => 'n/a'));
      }
    }
  });

  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(1500);

  // Upload file
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testImagePath);

  // Wait for job completion indicator
  await page.waitForFunction(
    () => document.body.innerText.includes('completed') || document.body.innerText.includes('Completed'),
    { timeout: 10000 }
  );
  await page.waitForTimeout(1000);

  // Verify JSON preview contains schema_version
  const pageText = await page.textContent('body');
  const hasSchemaVersion = pageText.includes('"schema_version"');
  const hasDocumentVersion = pageText.includes('"document_version"');
  const hasProblems = pageText.includes('"problems"');
  const hasAssets = pageText.includes('"assets"');

  // Extract job id from the page heading (e.g. "Job job_abc123")
  const jobMatch = pageText.match(/Job (job_[a-f0-9]+)/);
  const jobId = jobMatch ? jobMatch[1] : null;
  console.log('Extracted job id:', jobId);

  // Verify export pipeline via backend API
  const apiBase = 'http://127.0.0.1:8000/api';
  const formatsResponse = await fetch(`${apiBase}/export-formats`);
  const formats = await formatsResponse.json();
  const hasMarkdownFormat = Array.isArray(formats) && formats.some(f => f.format === 'markdown');
  console.log('Export formats include markdown:', hasMarkdownFormat);

  let exportCreated = false;
  if (jobId) {
    const exportResponse = await fetch(`${apiBase}/jobs/${jobId}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'markdown' }),
    });
    exportCreated = exportResponse.status === 201;
    if (exportCreated) {
      const artifact = await exportResponse.json();
      console.log('Export created:', artifact.export_id, artifact.format, artifact.path);
    } else {
      console.log('Export failed:', exportResponse.status, await exportResponse.text().catch(() => ''));
    }
  }

  console.log('Smoke test results:');
  console.log('  schema_version:', hasSchemaVersion);
  console.log('  document_version:', hasDocumentVersion);
  console.log('  problems:', hasProblems);
  console.log('  assets:', hasAssets);
  console.log('  export_formats:', hasMarkdownFormat);
  console.log('  export_created:', exportCreated);

  await page.screenshot({ path: 'tmp/e2e-smoke.png', fullPage: false });

  await browser.close();

  if (!hasSchemaVersion || !hasDocumentVersion || !hasProblems || !hasAssets || !hasMarkdownFormat || !exportCreated) {
    console.error('E2E smoke test failed');
    process.exit(1);
  }
  console.log('E2E smoke test passed');
})();
