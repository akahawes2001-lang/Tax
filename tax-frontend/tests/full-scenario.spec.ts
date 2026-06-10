import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Полный сценарий расчёта налогов', () => {
    test('Семья из трёх человек: доходы, авто, собака, аренда, вклад, продажа', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // 1. Доходы
        await expect(page.getByRole('heading', { name: 'Доходы' })).toBeVisible({ timeout: 10000 });

        await page.locator('text=2025').first().click();
        await page.getByRole('option', { name: '2026' }).click();

        await page.getByLabel('Ежемесячный доход (зарплата)').fill('2500');

        await page.locator('input[type="date"]').first().fill('2016-05-15');
        await page.getByRole('button', { name: 'Добавить' }).first().click();

        await page.getByLabel('Инвалид I/II группы (вычет 306 руб./мес.)').check();

        await page.getByRole('button', { name: 'Рассчитать подоходный налог' }).click();
        await expect(page.getByText(/Итого налог:/)).toBeVisible({ timeout: 10000 });

        const taxText = await page.locator('text=Итого налог:').textContent();
        expect(taxText).toMatch(/3\s*324[.,]\s*36/);

        await page.getByRole('button', { name: 'Далее' }).click();

        // 2. Удержания (новый шаг)
        await expect(page.getByRole('heading', { name: 'Удержания' })).toBeVisible();
        await page.getByRole('button', { name: 'Далее' }).click();

        // 3. Животные
        await expect(page.getByRole('heading', { name: 'Домашние животные (собаки)' })).toBeVisible();

        await page.getByRole('combobox', { name: 'Порода' }).fill('Немецкая овчарка');
        await page.getByText('Немецкая овчарка').click();
        await page.getByRole('button', { name: '+ Добавить собаку' }).click();

        await expect(page.getByText('Немецкая овчарка')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Рассчитать налог на собак' }).click();
        await expect(page.getByText('Расчёт выполнен успешно')).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: 'Далее' }).click();
        await expect(page.getByRole('heading', { name: 'Транспортные средства' })).toBeVisible();

        // Lada Vesta
        const brandCombo = page.getByRole('combobox', { name: 'Марка' });
        await brandCombo.waitFor({ state: 'visible', timeout: 10000 });
        await brandCombo.fill('Lada');
        await page.getByRole('option', { name: 'Lada' }).click();

        const modelCombo = page.getByRole('combobox', { name: 'Модель' });
        await modelCombo.waitFor({ state: 'visible', timeout: 5000 });
        await modelCombo.fill('Vesta');
        await page.getByRole('option', { name: 'Vesta (седан)' }).click();

        await page.getByRole('spinbutton', { name: 'Год выпуска' }).fill('2020');
        await page.getByRole('spinbutton', { name: 'Год расчёта' }).fill('2026');
        await page.getByTestId('transport-add-button').click();

        // Электромобиль
        await page.getByTestId('transport-type-select').click();
        await page.getByRole('option', { name: 'Электромобиль' }).click();
        await page.getByRole('spinbutton', { name: 'Год выпуска' }).fill('2024');
        await page.getByTestId('transport-add-button').click();

        await expect(page.getByTestId('transport-total-tax')).toContainText('75.00');

        await page.getByRole('button', { name: 'Далее' }).click();
        await expect(page.getByRole('heading', { name: 'Инвестиции и накопления' })).toBeVisible();

        await page.getByLabel('Сумма вклада').fill('100000');
        await page.getByLabel('Годовая ставка, %').fill('14');
        await page.getByLabel('Срок (дней)').fill('180');
        await page.getByRole('button', { name: 'Рассчитать налог на проценты' }).click();
        await expect(page.getByText(/Налог:\s*897[.,]53/)).toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: 'Далее' }).click();
        await expect(page.getByRole('heading', { name: 'Прочие доходы' })).toBeVisible();

        // Аренда
        await page.getByRole('tab', { name: 'Аренда' }).click();
        await page.getByLabel('Населённый пункт').click();
        await page.getByRole('option', { name: 'Минск' }).click();
        await page.getByRole('spinbutton', { name: 'Количество месяцев' }).fill('6');
        await page.getByRole('button', { name: 'Рассчитать' }).first().click();
        await expect(page.getByText(/Сумма налога за 6 мес.:\s*318[.,]00\s*руб/)).toBeVisible({ timeout: 5000 });

        // Продажа имущества
        await page.getByRole('tab', { name: 'Продажа имущества' }).click();
        await page.locator('text=Автомобиль').first().click();
        await page.getByRole('option', { name: 'Автомобиль' }).click();
        await page.getByRole('spinbutton', { name: 'Цена продажи' }).fill('80000');
        await page.getByLabel('Применить имущественный вычет').check();
        await page.getByTestId('sale-calculate-button').click();
        await expect(page.getByText('Расчёт выполнен успешно')).toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: 'Далее' }).click();
        await expect(page.getByRole('heading', { name: 'Сводный отчёт' })).toBeVisible();

        // === Подробный вывод в консоль ===
        console.log('=== ДЕТАЛИЗАЦИЯ НАЛОГОВ ===');
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
            const cells = rows.nth(i).locator('td');
            const name = await cells.nth(0).textContent();
            const category = await cells.nth(1).textContent();
            const amount = await cells.nth(2).textContent();
            console.log(`${name?.trim()} | ${category?.trim()} | ${amount?.trim()}`);
        }

        const totalTaxLine = page.getByText(/Всего налогов:/);
        await expect(totalTaxLine).toBeVisible({ timeout: 5000 });
        const totalTaxText = await totalTaxLine.textContent();
        console.log('=== ИТОГО ===');
        console.log(totalTaxText?.trim());

        await expect(totalTaxLine).toContainText('13301.89');
    });
});