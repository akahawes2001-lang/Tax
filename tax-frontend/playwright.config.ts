import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 120000,
    retries: 0,
    use: {
        headless: false,          // браузер будет виден
        slowMo: 100,             // замедление для наблюдения
        viewport: { width: 1280, height: 720 },
        actionTimeout: 15000,
        baseURL: 'http://localhost:5173',
    },
});