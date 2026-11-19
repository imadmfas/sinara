import { test, expect, type Page } from '@playwright/test';
import { allBranches } from '../../src/content/index';
import { allSchoolTopics } from '../../src/content/school';

const COACH = 'http://localhost:8787';
const fixture = (mode: string) => fetch(`${COACH}/__fixture/${mode}`);
const hits = async () => (await (await fetch(`${COACH}/__hits`)).json()) as string[];

function trackExternal(page: Page) {
  const ext: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173/')) ext.push(r.url()); });
  return ext;
}

test.beforeEach(async () => { await fixture('ok'); });

test('1. caregiver: 4–6 story without sound, change one choice, zero AI requests', async ({ page }) => {
  const ext = trackExternal(page);
  const before = (await hits()).length;
  await page.goto('./');
  await page.getByRole('button', { name: /٤–٦ سنوات/ }).click();
  await page.getByRole('link', { name: 'القصص والحيوانات' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('نصنع قصة معاً');
  // Sound is off by default: the caregiver read-aloud cue replaces any audio button.
  await expect(page.getByText('يقرأ المرافق النص بصوته').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /صوت الجهاز/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'عصفور', exact: true }).click();
  await page.getByRole('button', { name: 'بستان النخيل', exact: true }).click();
  await page.getByRole('button', { name: 'يغنّي', exact: true }).click();
  await page.getByRole('button', { name: /احكِ القصة/ }).click();
  const story = page.locator('.sentences');
  const first = await story.innerText();
  expect(first).toContain('بستان النخيل');
  await page.getByRole('button', { name: 'سطح البيت', exact: true }).click();
  await expect(story).not.toHaveText(first);
  await expect(story).toContainText('سطح البيت');
  await expect(page.locator('.sentences li.changed')).toHaveCount(2);
  await page.getByRole('group', { name: 'شنو تغيّر؟' }).getByRole('button', { name: 'المكان' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'أحسنت! غيّرنا المكان' })).toBeVisible();
  await expect(page.getByText('اسأله: شنو تغيّر بالقصة من غيّرنا المكان؟')).toBeVisible();
  expect(ext, 'no external requests on the preschool path').toEqual([]);
  expect((await hits()).length).toBe(before);
});

test('2. pupil: wrong option → specific feedback → retry → transfer to a new example', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /٧–٩ سنوات/ }).click();
  await page.getByRole('button', { name: 'الرياضيات' }).click();
  await page.getByRole('link', { name: 'الجمع' }).click();
  await page.locator('.choice', { hasText: 'علّمني الجمع.' }).click();
  await expect(page.locator('.feedback.retry')).toContainText('سؤال قصير جداً');
  await expect(page.locator('.feedback.retry')).toContainText('جرّب خياراً آخر');
  await page.locator('.choice', { hasText: 'تلميحاً قبل الحل' }).click();
  await expect(page.locator('.feedback.ok')).toContainText('إجابة مناسبة');
  // Transfer: a teen lesson, main question then a different example.
  await page.goto('./#/field/teaching/primary');
  const quiz = page.locator('#branch-teaching-primary-test');
  await quiz.locator('.choice', { hasText: 'ممتعاً جداً' }).click();
  await expect(quiz.locator('.feedback.retry')).toContainText('المهارة المطلوب تعلّمها');
  await quiz.locator('.choice', { hasText: 'ببطاقات، مع سؤال تحقق' }).click();
  await quiz.getByRole('button', { name: 'انتقل إلى مثال جديد' }).click();
  await expect(quiz).toContainText('مثال جديد: تدرّب طلبة التمريض');
  await quiz.locator('.choice', { hasText: 'قياس النبض، فيها ثلاثة معايير' }).click();
  await expect(quiz.locator('.feedback.ok')).toBeVisible();
  await quiz.getByRole('button', { name: 'افحص جواباً تعليمياً' }).click();
  await quiz.locator('.choice', { hasText: 'يتجاوز العشر دقائق' }).click();
  await expect(quiz.locator('li.flaw')).toBeVisible();
});

test('3. adult: house scenario, area check, stairs revision, copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./#/house');
  for (const d of ['أرض ١٠ × ٢٠ متراً', 'الشارع من جهة الشمال', 'طابق واحد', 'ثلاث غرف نوم', 'فناء داخلي']) await page.getByRole('button', { name: d }).click();
  await expect(page.locator('.bubble-row.big .qmark')).toHaveAttribute('aria-label', /أضاء 5/);
  await page.getByLabel(/اطلب جدول مساحات/).check();
  await page.getByRole('button', { name: 'اعرض الجواب التعليمي' }).click();
  await expect(page.locator('table.areas tfoot')).toContainText('٢٠٠');
  await page.getByRole('button', { name: /١٩٠/ }).click();
  await expect(page.locator('.feedback.retry')).toContainText('اجمع مرة ثانية');
  await page.getByRole('button', { name: /٢٠٠/ }).click();
  await expect(page.locator('.feedback.ok').first()).toContainText('١٠ × ٢٠ = ٢٠٠');
  await page.getByRole('button', { name: 'تابع' }).click();
  await page.locator('.choice', { hasText: 'ألوان الواجهة' }).click();
  await expect(page.locator('.feedback.retry')).toContainText('مبكر');
  await page.locator('.choice', { hasText: 'أين نحجز مكان الدرج' }).click();
  await page.getByRole('button', { name: 'اعرض التصوّر المعدّل' }).click();
  await expect(page.locator('tr.changed')).toHaveCount(3);
  await expect(page.locator('table.areas').nth(1)).toContainText('بيت الدرج');
  await page.getByRole('button', { name: 'تحقق من المجموع مرة ثانية' }).click();
  await expect(page.getByText('زاد الدرج ١٠')).toBeVisible();
  await expect(page.getByText('مهندس إنشائي').first()).toBeVisible();
  await page.getByRole('button', { name: 'اعرض الطلب النهائي' }).click();
  await page.getByRole('button', { name: 'نسخ' }).click();
  await expect(page.getByText('تم نسخ الطلب.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('مجموعه ٢٠٠ متر مربع');
});

test('4. studio: branches differ, service changes fields, missing input and clipboard refusal recover', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }); });
  await page.goto('./#/studio?field=engineering&branch=architecture');
  await page.getByRole('button', { name: 'ولّد الطلب' }).click();
  const a = await page.locator('#output').inputValue();
  await page.goto('./#/studio?field=agriculture&branch=irrigation');
  await page.reload();
  await page.getByRole('button', { name: 'ولّد الطلب' }).click();
  const b = await page.locator('#output').inputValue();
  expect(a).toContain('ثلاث غرف نوم');
  expect(b).toContain('ساعات تشغيل مضخة');
  expect(a).not.toEqual(b);
  // Service-specific fields
  await page.getByLabel('الخدمة').selectOption('compare');
  await expect(page.getByLabel(/الخيارات/)).toBeVisible();
  await expect(page.getByLabel(/معايير المقارنة/)).toBeVisible();
  await page.getByRole('button', { name: 'أعد التوليد من المدخلات' }).click();
  await expect(page.getByRole('alert')).toContainText('أكمل هذه الخانات');
  await page.getByLabel(/الخيارات/).fill('ري بالتنقيط أو ري بالمرشات');
  await page.getByLabel(/معايير المقارنة/).fill('استهلاك الماء، الكلفة');
  await page.getByRole('button', { name: 'أعد التوليد من المدخلات' }).click();
  await expect(page.locator('#output')).toHaveValue(/قارن بهذه المعايير فقط: استهلاك الماء/);
  // Manual edit is protected from silent overwrite
  await page.locator('#output').fill('تعديلي اليدوي');
  await page.getByLabel(/قيد أو شرط/).fill('صفحة واحدة');
  await page.getByRole('button', { name: 'أعد التوليد من المدخلات' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('ستستبدل تعديلك');
  await page.getByRole('button', { name: 'احتفظ بتعديلي' }).click();
  await expect(page.locator('#output')).toHaveValue('تعديلي اليدوي');
  // Clipboard refusal → selected fallback text
  await page.getByRole('button', { name: 'نسخ' }).click();
  await expect(page.getByText('تعذّر النسخ التلقائي')).toBeVisible();
  await expect(page.locator('.copy-fallback')).toBeVisible();
  // Missing task
  await page.getByRole('button', { name: 'إعادة ضبط' }).click();
  await page.getByRole('button', { name: 'ولّد الطلب' }).click();
  await expect(page.getByRole('alert')).toContainText('اكتب مهمتك أولاً');
  await expect(page.locator('#goal')).toBeFocused();
});

test('5. guide knows the lesson and choice; Back, Escape, offline, reduced motion, reopen', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/field/engineering/architecture');
  const q = page.locator('#branch-engineering-architecture-test');
  await q.locator('.choice', { hasText: 'صمّم واجهة جميلة' }).click();
  const fab = page.getByRole('button', { name: /مساعدة فَطين|فَطين/ });
  await fab.click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('العمارة');
  await dlg.getByRole('button', { name: 'ليش هذا الجواب؟' }).click();
  await expect(dlg.locator('.turn.guide').last()).toContainText('صمّم واجهة جميلة');
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  await expect(fab).toBeFocused();
  // Second lesson: context switches
  await page.goto('./#/field/agriculture/irrigation');
  await fab.click();
  await expect(page.getByRole('dialog')).toContainText('الري');
  await page.getByRole('dialog').getByRole('button', { name: 'أعطني مثالاً' }).click();
  await expect(page.getByRole('dialog').locator('.turn.guide').last()).toContainText('مضخة');
  // System Back closes the guide and keeps the lesson
  const url = page.url();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(page.url()).toBe(url);
  // Reduced motion
  expect(await page.locator('.screen').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  // Practise something, then go offline after the service worker is ready, reopen, and keep working.
  await page.locator('#branch-agriculture-irrigation-test .choice', { hasText: 'سجلّ ري أسبوعياً' }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('الري');
  await expect(page.locator('.offline-banner')).toBeVisible();
  await fab.click();
  await page.getByRole('dialog').getByRole('button', { name: 'اشرح أبسط' }).click();
  await expect(page.getByRole('dialog').locator('.turn.guide').last()).toContainText('المرشد الزراعي');
  await page.keyboard.press('Escape');
  await page.goto('./#/studio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('مولّد الطلبات');
  await page.goto('./#/progress');
  await page.getByRole('button', { name: /٢٣ سنة فأكثر/ }).click().catch(() => {});
  await context.setOffline(false);
});

test('6. live chat: never for a child band; server enforces adult session; failures fall back', async ({ page }) => {
  await page.goto('./');
  expect(await hits(), 'first visit makes no live/billable call').toEqual([]);
  await page.getByRole('button', { name: /٤–٦ سنوات/ }).click();
  await page.getByRole('button', { name: /فَطين/ }).click();
  await expect(page.getByRole('tab', { name: 'محادثة ذكية مباشرة' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  // A child changes the stored age band in the browser: the tab appears, but the server still requires an adult code.
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('sinara.state')!); s.band = 'a23'; localStorage.setItem('sinara.state', JSON.stringify(s)); });
  await page.goto('./#/guide');
  await page.reload();
  const direct = await page.evaluate(async () => (await fetch('http://localhost:8787/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], band: 'a23' }) })).status);
  expect(direct).toBe(401);
  await page.getByRole('button', { name: /فَطين/ }).click();
  await page.getByRole('tab', { name: 'محادثة ذكية مباشرة' }).click();
  await page.getByLabel('رمز البالغ').fill('guess');
  await page.getByRole('button', { name: 'تحقق' }).click();
  await expect(page.getByRole('alert')).toContainText('رُفض الرمز');
  // Adult with the code (simulated provider)
  await page.getByLabel('رمز البالغ').fill('e2e-adult');
  await page.getByRole('button', { name: 'تحقق' }).click();
  await page.getByLabel('رسالتك').fill('كيف أحسّن طلب جدول المساحات؟');
  await page.getByRole('button', { name: 'إرسال' }).click();
  await expect(page.locator('.live-reply').last()).toContainText('[اختبار محاكاة]');
  await expect(page.locator('.live-reply').last()).toContainText('رد مباشر من النموذج');
  // Provider error → recovery back to the guided coach
  await fixture('error');
  await page.getByLabel('رسالتك').fill('سؤال ثانٍ');
  await page.getByRole('button', { name: 'إرسال' }).click();
  await expect(page.getByRole('alert')).toContainText('تعذّر الحصول على رد');
  await expect(page.getByRole('button', { name: 'أعد المحاولة' })).toBeVisible();
  await page.getByRole('button', { name: 'العودة إلى مرشد الدرس' }).click();
  await expect(page.getByRole('tab', { name: 'مرشد الدرس' })).toHaveAttribute('aria-selected', 'true');
  // Rate limit is explained
  await fixture('rate');
  await page.getByRole('tab', { name: 'محادثة ذكية مباشرة' }).click();
  await page.getByLabel('رسالتك').fill('سؤال ثالث');
  await page.getByRole('button', { name: 'إرسال' }).click();
  await expect(page.getByRole('alert')).toContainText('حد الاستعمال');
});

test('7. narrow 320px phone with the keyboard open while chatting', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 420 });
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('sinara.state', JSON.stringify({ version: 2, band: 'a23', settings: {}, progress: {}, savedDrafts: [] })));
  await page.reload();
  await page.getByRole('button', { name: /فَطين/ }).click();
  await page.getByRole('tab', { name: 'محادثة ذكية مباشرة' }).click();
  await page.getByLabel('رمز البالغ').fill('e2e-adult');
  await page.getByRole('button', { name: 'تحقق' }).click();
  const box = page.getByLabel('رسالتك');
  await box.focus();
  for (const el of [box, page.getByRole('button', { name: 'إرسال' })]) {
    const b = (await el.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(320);
    expect(b.y + b.height).toBeLessThanOrEqual(420);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('8. Pages subpath, refresh on inner screens, every branch and school route renders, progress persists', async ({ page }) => {
  await page.goto('./#/field/law/reading-texts');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('قراءة النصوص');
  for (const { field, branch } of allBranches) {
    await page.goto(`./#/field/${field.id}/${branch.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(branch.name);
  }
  for (const t of allSchoolTopics) {
    await page.goto(`./#/school/a10/${t.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.name);
  }
  // A real action earns progress; a page view does not.
  await page.goto('./#/progress');
  await page.getByRole('button', { name: /١٠–١٢ سنة/ }).click();
  await expect(page.getByText('لم تتدرّب بعد').first()).toBeVisible();
  await page.goto('./#/school/a10/space');
  await page.locator('.choice', { hasText: 'تجربة أستطيع أن أعملها' }).click();
  await page.reload();
  await page.goto('./#/progress');
  await expect(page.locator('.skills li.done')).toContainText('التحقق من ادعاء');
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'متابعة' })).toBeVisible();
});

test('9. 200% text zoom keeps Arabic readable without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./#/house');
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
});
