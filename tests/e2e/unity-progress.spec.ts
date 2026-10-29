import { expect, test, type Page } from "@playwright/test";

const progressKey = "unity-implementation-progress:v1";
const notesKey = "unity-storyboard-notes:v1";
const sceneButton = (page: Page, name: string) => page.getByRole("navigation", { name: "Pilih scene Unity" }).getByRole("button", { name: new RegExp(name) });
const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const status = (page: Page) => page.getByRole("combobox", { name: "Status scene", exact: true });

async function load(page: Page) {
  await page.goto("/unity-progress");
  await expect(status(page)).toBeEnabled();
}

test.beforeEach(async ({ page }) => { await load(page); });

test("ringkasan tujuh scene dan riwayat Tidur Cepat tidak mengarang verifikasi", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Progres Implementasi Unity");
  await expect(page.getByRole("navigation", { name: "Pilih scene Unity" }).getByRole("button")).toHaveCount(7);
  await expect(page.getByRole("progressbar", { name: "Scene terverifikasi" })).toHaveAttribute("value", "0");
  await expect(status(page)).toHaveValue("pending");
  await expect(field(page, "Deskripsi interaksi")).toHaveValue("");
  await sceneButton(page, "Tidur Cepat").click();
  await expect(status(page)).toHaveValue("testing");
  await expect(field(page, "Deskripsi interaksi")).toHaveValue("Interaksi drag-and-drop tiga aktivitas.");
  await expect(field(page, "Catatan teknis")).toHaveValue(/Offset Y = -8.*bukan nilai yang sudah terbukti berhasil/);
  await expect(field(page, "Riwayat masalah dan solusi")).toHaveValue(/CS0136 dan CS0128/);
  await expect(field(page, "Nama script C# 1")).toHaveValue("DragDropTidurCepat.cs");
  await expect(field(page, "Nama script C# 2")).toHaveValue("TidurCepatManager.cs");
  await expect(field(page, "Source code C# 1")).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Selesai: Ukuran ilustrasi dikonfirmasi sesuai", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Selesai: Verifikasi posisi akhir gambar setelah drop", exact: true })).not.toBeChecked();
});

test("status scene memperbarui ringkasan dan bertahan setelah refresh", async ({ page }) => {
  await status(page).selectOption("working");
  await expect(sceneButton(page, "Bangun Pagi")).toContainText("Dalam Pengerjaan");
  await field(page, "Bukti pengujian / verifikasi").fill("Data QA contoh: hasil uji manual dicatat oleh pengguna.");
  await status(page).selectOption("verified");
  await expect(page.getByRole("progressbar", { name: "Scene terverifikasi" })).toHaveAttribute("value", "1");
  await page.reload();
  await expect(status(page)).toHaveValue("verified");
});

test("deskripsi, checklist, catatan, riwayat dan source C# dapat diedit dan dipulihkan", async ({ page }) => {
  await field(page, "Deskripsi interaksi").fill("QA: Tombol untuk membuka aktivitas.");
  await field(page, "Catatan teknis").fill("QA: Gunakan Canvas dan EventSystem.");
  await field(page, "Riwayat masalah dan solusi").fill("QA: Tombol tidak aktif; hubungkan listener.");
  await field(page, "Checklist item 1").fill("Hubungkan tombol UI");
  await page.getByRole("checkbox", { name: "Selesai: Hubungkan tombol UI", exact: true }).check();
  await page.getByRole("button", { name: "+ Tambah script C#", exact: true }).click();
  await field(page, "Nama script C# 1").fill("BangunPagiManager.cs");
  await field(page, "Source code C# 1").fill("public class BangunPagiManager { }");
  await expect(page.getByText("Progres berhasil disimpan di browser ini.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(field(page, "Deskripsi interaksi")).toHaveValue("QA: Tombol untuk membuka aktivitas.");
  await expect(field(page, "Catatan teknis")).toHaveValue("QA: Gunakan Canvas dan EventSystem.");
  await expect(field(page, "Riwayat masalah dan solusi")).toHaveValue("QA: Tombol tidak aktif; hubungkan listener.");
  await expect(page.getByRole("checkbox", { name: "Selesai: Hubungkan tombol UI", exact: true })).toBeChecked();
  await expect(field(page, "Nama script C# 1")).toHaveValue("BangunPagiManager.cs");
  await expect(field(page, "Source code C# 1")).toHaveValue("public class BangunPagiManager { }");
});

test("catatan, status dan source C# terisolasi antar-scene", async ({ page }) => {
  await field(page, "Catatan teknis").fill("QA untuk scene pertama");
  await page.getByRole("button", { name: "+ Tambah script C#", exact: true }).click();
  await field(page, "Source code C# 1").fill("public class SceneSatu { }");
  await status(page).selectOption("working");
  await sceneButton(page, "Beribadah").click();
  await expect(field(page, "Catatan teknis")).toHaveValue("");
  await expect(status(page)).toHaveValue("pending");
  await expect(field(page, "Source code C# 1")).toHaveCount(0);
  await field(page, "Catatan teknis").fill("QA untuk scene kedua");
  await page.reload();
  await expect(field(page, "Catatan teknis")).toHaveValue("QA untuk scene pertama");
  await expect(field(page, "Source code C# 1")).toHaveValue("public class SceneSatu { }");
  await sceneButton(page, "Beribadah").click();
  await expect(field(page, "Catatan teknis")).toHaveValue("QA untuk scene kedua");
});

test("source C# disalin sebagai teks tanpa dieksekusi", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "+ Tambah script C#", exact: true }).click();
  const code = '// <script>document.title = "EXECUTED"</script>\npublic class QA { }';
  await field(page, "Source code C# 1").fill(code);
  await page.getByRole("button", { name: "Salin source code 1", exact: true }).click();
  await expect(page.getByText("Source code berhasil disalin.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  await expect(page).toHaveTitle("Progres Implementasi Unity — Storyboard Studio");
});

test("pemetaan storyboard stabil dan catatan storyboard lama tetap utuh", async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ "slide-2": "Catatan storyboard QA lama" })), notesKey);
  await page.getByRole("listbox", { name: "Pilih storyboard terkait", exact: true }).selectOption(["slide-2", "slide-20"]);
  await field(page, "Catatan teknis").fill("QA: Pemetaan scene pertama");
  await page.reload();
  const link = page.getByRole("link", { name: "Lihat Slide 20 ↗", exact: true });
  await expect(link).toHaveAttribute("href", "/#slide-20");
  await link.click();
  await expect(page).toHaveURL(/\/#slide-20$/);
  await expect(page.getByRole("heading", { name: "Slide 20", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Buka pratinjau Slide 02", exact: true }).click();
  await expect(field(page, "Catatan Implementasi Unity")).toHaveValue("Catatan storyboard QA lama");
  await page.getByRole("button", { name: "Tutup pratinjau", exact: true }).click();
  await page.getByRole("link", { name: "Progres Unity ↗", exact: true }).click();
  await expect(field(page, "Catatan teknis")).toHaveValue("QA: Pemetaan scene pertama");
});

for (const invalid of ['{"scene-1":{"status":"unknown"}}', '{"scene-7":{"scripts":"invalid"}}', 'broken-json']) {
  test(`data localStorage rusak tidak ditimpa: ${invalid}`, async ({ page }) => {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: progressKey, value: invalid });
    await page.reload();
    await expect(page.getByText(/Data progres tidak dapat dibaca/)).toBeVisible();
    await field(page, "Catatan teknis").fill("Draf QA sementara");
    await expect(page.getByText(/Progres belum tersimpan/)).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe(invalid);
  });
}

test("kegagalan penyimpanan memberi peringatan dan mempertahankan draf", async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("QA quota", "QuotaExceededError"); }; });
  await field(page, "Catatan teknis").fill("Draf QA saat penyimpanan penuh");
  await expect(page.getByText(/Progres belum tersimpan/)).toBeVisible();
  await expect(field(page, "Catatan teknis")).toHaveValue("Draf QA saat penyimpanan penuh");
});

test("dashboard mobile dan editor source tidak memiliki horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await sceneButton(page, "Tidur Cepat").click();
  await field(page, "Source code C# 1").fill("// ".concat("source_".repeat(100)));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(field(page, "Source code C# 1")).toBeInViewport();
});
