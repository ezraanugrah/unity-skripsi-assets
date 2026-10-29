import { expect, test, type Page } from "@playwright/test";

const notesKey = "unity-storyboard-notes:v1";
const noteField = (page: Page) => page.getByRole("textbox", { name: "Catatan Implementasi Unity", exact: true });

async function openSlide(page: Page, number = "02") {
  await page.getByRole("button", { name: `Buka pratinjau Slide ${number}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Slide ${number}`, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    page: document.documentElement.scrollWidth <= window.innerWidth,
    dialogs: Array.from(document.querySelectorAll("dialog[open]")).every(dialog => dialog.scrollWidth <= dialog.clientWidth),
  }))).toEqual({ page: true, dialogs: true });
}

// Playwright's page fixture creates a fresh browser context for every test.
test.beforeEach(async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  // Wait for browser hydration rather than using fixed delays.
  await expect(page.getByRole("combobox", { name: "Status Slide 02", exact: true })).toBeEnabled();
  expect(await page.evaluate(key => localStorage.getItem(key), notesKey)).toBeNull();
});

test("halaman utama berhasil dimuat", async ({ page }) => {
  await expect(page).toHaveTitle("Storyboard Studio — Unity Skripsi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dari storyboard,menjadi pengalaman.");
  await expect(page.getByRole("progressbar", { name: "Slide selesai" })).toHaveAttribute("value", "0");
});

test("galeri menampilkan 19 slide berurutan dan satu referensi karakter", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Rangkaian cerita 19 slide", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Buka pratinjau Slide \d{2}$/ })).toHaveCount(19);
  await expect(page.getByRole("heading", { level: 3, name: /^Slide \d{2}$/ })).toHaveText(
    Array.from({ length: 19 }, (_, index) => `Slide ${String(index + 2).padStart(2, "0")}`),
  );
  await expect(page.getByRole("button", { name: "Buka pratinjau karakter pemandu", exact: true })).toHaveCount(1);
});

test("preview storyboard menampilkan gambar dan dapat ditutup", async ({ page }) => {
  const dialog = await openSlide(page);
  const image = dialog.getByRole("img", { name: "Pratinjau Slide 02", exact: true });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await dialog.getByRole("button", { name: "Tutup pratinjau", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("navigasi Next dan Previous berpindah slide dengan batas yang benar", async ({ page }) => {
  const dialog = await openSlide(page);
  await expect(dialog.getByRole("button", { name: "Gambar sebelumnya", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Gambar berikutnya", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 03");
  await page.getByRole("button", { name: "Gambar sebelumnya", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 02");
  await page.getByRole("button", { name: "Tutup pratinjau", exact: true }).click();
  await page.getByRole("button", { name: "Buka pratinjau karakter pemandu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Gambar berikutnya", exact: true })).toBeDisabled();
});

test("keyboard ArrowRight, ArrowLeft, dan Escape mengendalikan preview", async ({ page }) => {
  await openSlide(page);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 03");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 02");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("tombol panah dalam textarea tidak memindahkan slide", async ({ page }) => {
  await openSlide(page, "03");
  await noteField(page).fill("QA: Tambahkan komponen Canvas.");
  await noteField(page).press("ArrowLeft");
  await noteField(page).press("ArrowRight");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 03");
  await expect(noteField(page)).toHaveValue("QA: Tambahkan komponen Canvas.");
});

test("catatan Unity dapat ditulis, diedit, dan disimpan pada ID stabil", async ({ page }) => {
  const dialog = await openSlide(page);
  await expect(noteField(page)).toHaveValue("");
  await noteField(page).fill("QA: Hubungkan tombol Play.");
  await expect(dialog.getByRole("status")).toHaveText("Catatan berhasil disimpan di browser ini.");
  await noteField(page).fill("QA revisi: Hubungkan tombol Play ke scene utama.");
  await expect(noteField(page)).toHaveValue("QA revisi: Hubungkan tombol Play ke scene utama.");
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}"), notesKey)).toEqual({
    "slide-2": "QA revisi: Hubungkan tombol Play ke scene utama.",
  });
});

test("catatan tetap tersedia setelah refresh", async ({ page }) => {
  await openSlide(page);
  await noteField(page).fill("QA: Tambahkan transisi scene.");
  await page.reload();
  await openSlide(page);
  await expect(noteField(page)).toHaveValue("QA: Tambahkan transisi scene.");
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText("Catatan tersimpan di browser ini.");
});

test("catatan antar-slide tidak tertukar setelah navigasi dan refresh", async ({ page }) => {
  await openSlide(page);
  await noteField(page).fill("QA slide 02: Tombol Play.");
  await page.getByRole("button", { name: "Gambar berikutnya", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Slide 03");
  await expect(noteField(page)).toHaveValue("");
  await noteField(page).fill("QA slide 03: Kontrol audio.");
  await page.reload();
  await openSlide(page);
  await expect(noteField(page)).toHaveValue("QA slide 02: Tombol Play.");
  await page.getByRole("button", { name: "Gambar berikutnya", exact: true }).click();
  await expect(noteField(page)).toHaveValue("QA slide 03: Kontrol audio.");
});

for (const width of [320, 390, 768]) {
  test(`layout mobile ${width}px tidak mengalami horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await expectNoHorizontalOverflow(page);
    await openSlide(page);
    await noteField(page).fill("Catatan QA responsif. ".repeat(30));
    await expectNoHorizontalOverflow(page);
    await expect(noteField(page)).toBeInViewport();
    await page.getByRole("button", { name: "Tutup pratinjau", exact: true }).click();
    await page.getByRole("button", { name: "Buka pratinjau karakter pemandu", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveAccessibleName("Karakter pemandu");
    await expectNoHorizontalOverflow(page);
  });
}
