import { test, expect } from '@playwright/test';

test('A. mobile header: logo, library link, coach; real brand label; no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  const logo = page.getByRole('img', { name: 'سِينارة' }).first();
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((i: HTMLImageElement) => i.naturalWidth > 0 && i.complete)).toBe(true);
  const lib = page.getByRole('link', { name: 'مكتبة البرومبتات', exact: true });
  await expect(lib).toBeVisible();
  const b = (await lib.boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(320);
  expect(b.height).toBeGreaterThanOrEqual(40);
  await expect(page.getByRole('button', { name: /مساعدة فَطين/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByRole('link', { name: /أحتاج نموذجاً الآن/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /تعلّم كيف تسأل/ })).toBeVisible();
  // Favicons come from the supplied master icon.
  expect(await page.locator('link[rel="icon"]').first().getAttribute('href')).toContain('favicon-32.png');
});

test('B. prompts are not in the homepage bundle; library loads manifest then a collection on demand', async ({ page }) => {
  const catalogReqs: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/catalog/')) catalogReqs.push(r.url()); });
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  expect(catalogReqs.filter((u) => !u.includes('sw') && !u.includes('workbox'))).toHaveLength(0);
  await page.getByRole('link', { name: /أحتاج نموذجاً الآن/ }).click();
  await expect(page.getByTestId('catalog-counts')).toContainText('١٢٠ موقفاً تطبيقياً');
  await expect(page.getByTestId('catalog-counts')).toContainText('و٨ محجوزة');
  expect(catalogReqs.some((u) => u.endsWith('manifest.json'))).toBe(true);
  expect(catalogReqs.some((u) => /c\d+\.json$/.test(u))).toBe(false);
});

test('C. professional: Iraqi search term → template → customise → output check → copy → Back to same results', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./#/library');
  await page.getByLabel('ابحث عن طلب').fill('مخطط منزل');
  await expect(page.locator('.lib-card').first()).toContainText('بيت مع درج مستقبلي');
  await expect(page).toHaveURL(/q=/);
  // Diacritic-insensitive: same result with tashkeel
  await page.getByLabel('ابحث عن طلب').fill('بَيْت');
  await expect(page.locator('.lib-card').first()).toContainText('بيت');
  await page.getByLabel('ابحث عن طلب').fill('مخطط منزل');
  await expect(page.locator('.lib-card').first()).toContainText('بيت مع درج مستقبلي');
  const card = page.locator('.lib-card').first();
  await card.getByRole('combobox').selectOption({ label: 'قرار بين خيارين · متوسط' });
  await page.evaluate(() => window.scrollTo(0, 400));
  const before = await page.evaluate(() => window.scrollY);
  await card.getByRole('link', { name: 'خصّصه' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('بيت مع درج مستقبلي');
  const inputs = page.getByLabel(/المعطيات/).first();
  await expect(inputs).toHaveValue(/١٠×٢٠م/);
  await inputs.fill('قطعة ١٢×٢٥م وواجهة جنوبية وأربع غرف وفناء');
  await expect(page.getByText('تعديلك').first()).toBeVisible();
  await expect(page.locator('#t-out')).toHaveValue(/١٢×٢٥م وواجهة جنوبية/);
  await expect(page.locator('.note', { hasText: 'قبل أن تستعمل الجواب' })).toContainText('حساب المساحة');
  // Manual edit is protected
  await page.locator('#t-out').fill('نسختي اليدوية');
  await page.getByLabel(/المهمة/).first().fill('مقارنة توزيعين');
  await expect(page.getByRole('alertdialog')).toContainText('احتفظ بتعديلي');
  await page.getByRole('button', { name: 'احتفظ بتعديلي' }).click();
  await expect(page.locator('#t-out')).toHaveValue('نسختي اليدوية');
  await page.getByRole('button', { name: 'أرجع إلى القالب' }).click();
  await page.getByRole('button', { name: 'نسخ' }).click();
  await expect(page.getByText('تم نسخ الطلب.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('قطعة افتراضية ١٠×٢٠م');
  await page.goBack();
  await expect(page.getByLabel('ابحث عن طلب')).toHaveValue('مخطط منزل');
  await expect(page.locator('.lib-card').first()).toContainText('بيت مع درج مستقبلي');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 60);
});

test('D. deep links: a template, a filtered library and «تعلّم كيف كُتب» survive refresh', async ({ page }) => {
  await page.goto('./#/library/SN-021-01');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('بيت مع درج مستقبلي');
  await expect(page.locator('.anatomy li')).toHaveCount(6);
  await expect(page.getByText('جواب نموذجي')).toBeVisible();
  await expect(page.getByText('مثال تعليمي').first()).toBeVisible();
  await page.goto('./#/library?q=%D9%86%D8%AE%D9%84&f=agriculture&l=%D9%85%D8%A8%D8%AA%D8%AF%D8%A6');
  await page.reload();
  await expect(page.getByLabel('المجال')).toHaveValue('agriculture');
  await expect(page.locator('.lib-card').first()).toContainText('النخيل');
  // Held variants are not offered; a direct link explains why.
  await page.goto('./#/library/SN-101-13');
  await expect(page.getByRole('alert')).toContainText('محجوزة');
  await expect(page.getByRole('button', { name: 'نسخ' })).toHaveCount(0);
});

test('E. children never see the dataset; a caregiver can continue explicitly', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /٤–٦ سنوات/ }).click();
  await page.goto('./#/library');
  await expect(page.getByText('هذه المكتبة للمعلّمين والأهل والكبار')).toBeVisible();
  await expect(page.locator('.lib-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'أنا شخص كبير، أكمل إلى المكتبة' }).click();
  await expect(page.getByTestId('catalog-counts')).toBeVisible();
});

test('F. senior: enlarge text, reach an example, copy it; finish the phone-photo lab', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./#/settings');
  await page.getByLabel(/الواجهة المبسّطة/).check();
  expect(await page.evaluate(() => document.documentElement.classList.contains('simple'))).toBe(true);
  await page.goto('./#/library?q=%D9%85%D9%88%D8%A8%D8%A7%D9%8A%D9%84');
  await expect(page.locator('.lib-card').first()).toContainText('الهاتف');
  await expect(page.locator('.lib-card', { hasText: 'تعليم الهاتف لكبير' })).toHaveCount(1);
  await page.locator('.lib-card').first().getByRole('button', { name: 'انسخ' }).click();
  await expect(page.getByText('تم نسخ الطلب.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('أعدّ');
  await page.goto('./#/lab/senior-photo');
  const pick = async (step: string, text: RegExp) => page.locator(`[data-step="${step}"] .choice`, { hasText: text }).click();
  await pick('edit', /أنا كبير في السن/);
  await pick('predict', /خطوة واحدة واضحة/);
  await pick('judge', /الثاني: خطوة واحدة/);
  await pick('problem', /حدّ في الأداة/);
  await pick('second', /أنا جدة/);
  await expect(page.getByTestId('lab-done')).toBeVisible();
});

test('G. child story: Fatin at the start and after the story; return visit continues correctly', async ({ page }) => {
  const ext: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173/')) ext.push(r.url()); });
  await page.goto('./#/kids/story');
  const fatin = page.getByRole('button', { name: /مساعدة فَطين/ });
  await fatin.click();
  await expect(page.getByRole('dialog').locator('.turn.guide').first()).toContainText('اختر حيواناً');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'عصفور', exact: true }).click();
  await page.getByRole('button', { name: 'شاطئ دجلة', exact: true }).click();
  await page.getByRole('button', { name: 'يبحث عن تمرة', exact: true }).click();
  await expect(page.locator('.reqtext')).toHaveText('احكِ لي قصة قصيرة من ثلاث جمل عن عصفور على شاطئ دجلة يبحث عن تمرة.');
  await page.getByRole('button', { name: /احكِ القصة/ }).click();
  await expect(page.locator('.caregiver-q')).toContainText('أين ذهب العصفور بعد ذلك؟');
  await fatin.click();
  await expect(page.getByRole('dialog').locator('.turn.guide').first()).toContainText('قصتنا عن العصفور على شاطئ دجلة');
  await page.keyboard.press('Escape');
  // Leave and return: the same story and guide line continue.
  await page.goto('./#/');
  await page.goto('./#/kids/story');
  await expect(page.locator('.sentences')).toContainText('شاطئ دجلة');
  await fatin.click();
  await expect(page.getByRole('dialog').locator('.turn.guide').first()).toContainText('قصتنا عن العصفور على شاطئ دجلة');
  await page.keyboard.press('Escape');
  // Follow-up uses the active animal and place.
  const fu = page.locator('[data-followup]');
  await expect(fu).toContainText('احكِ لي قصة عن عصفور يبحث عن تمرة.');
  await fu.getByRole('button', { name: /شاطئ دجلة/ }).click();
  await expect(fu).toContainText('أحسنت! صار للقصة مكان: على شاطئ دجلة.');
  // Change the place: Fatin then offers a different next change.
  await page.getByRole('button', { name: 'بستان النخيل', exact: true }).click();
  await fatin.click();
  await expect(page.getByRole('dialog').locator('.turn.guide').first()).toContainText('في بستان النخيل');
  await expect(page.getByRole('dialog').locator('.turn.guide').first()).toContainText('نغيّر شنو يسوّي');
  expect(ext).toEqual([]);
});

test('H. saved progress from the previous release survives; legacy routes still resolve', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('sinara.state', JSON.stringify({ version: 2, band: 'a23', settings: { effects: false, narration: false, calm: false, simple: false, expertise: 'beginner' }, progress: { a23: { skills: { verify: { count: 3, last: 1 } }, completed: ['house'], lastRoute: '/house', lastTitle: 'ارسم لي خريطة بيت' } }, savedDrafts: [] })));
  await page.reload();
  await expect(page.getByRole('link', { name: 'متابعة', exact: true })).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.locator('.skills li.done')).toContainText('٣');
  for (const r of ['/house', '/kids/story', '/field/engineering/architecture', '/school/a10/space', '/project/marshes', '/followup/fu-research', '/studio', '/guide']) {
    await page.goto(`./#${r}`);
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('لم نجد هذه الصفحة');
  }
});

test('I. offline: starter library works offline; full download keeps every template available', async ({ page, context }) => {
  await page.goto('./#/library');
  await expect(page.getByTestId('catalog-counts')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByTestId('catalog-counts')).toBeVisible();
  await page.getByRole('button', { name: 'نزّل المكتبة كاملة' }).click();
  await expect(page.getByText(/منزّلة كاملة/)).toBeVisible({ timeout: 20000 });
  await context.setOffline(true);
  await page.goto('./#/library?q=%D8%AE%D9%8A%D8%A7%D8%B7%D8%A9');
  await page.reload();
  await expect(page.locator('.lib-card').first()).toContainText('خياطة');
  await page.goto('./#/library/SN-111-07');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('بطاقة طلب خياطة');
  await expect(page.locator('.prompt-box')).toContainText('شكل الجواب');
  await context.setOffline(false);
});
