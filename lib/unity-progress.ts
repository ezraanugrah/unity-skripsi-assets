import { slides } from "./storyboards";

export const UNITY_PROGRESS_KEY = "unity-implementation-progress:v1";
export const sceneStatuses = {
  pending: "Belum Dimulai", working: "Dalam Pengerjaan",
  testing: "Perlu Pengujian", verified: "Selesai Terverifikasi",
} as const;
export type SceneStatus = keyof typeof sceneStatuses;
export type ChecklistItem = { id: string; label: string; done: boolean };
export type SceneScript = { id: string; name: string; code: string };
export type SceneProgress = {
  status: SceneStatus; interaction: string; checklist: ChecklistItem[];
  technicalNotes: string; issueHistory: string; verification: string;
  scripts: SceneScript[]; storyboardIds: string[];
};
export const scenes = [
  { id: "scene-1", number: 1, name: "Bangun Pagi" },
  { id: "scene-2", number: 2, name: "Beribadah" },
  { id: "scene-3", number: 3, name: "Berolahraga" },
  { id: "scene-4", number: 4, name: "Makan Sehat dan Bergizi" },
  { id: "scene-5", number: 5, name: "Gemar Belajar" },
  { id: "scene-6", number: 6, name: "Bermasyarakat" },
  { id: "scene-7", number: 7, name: "Tidur Cepat" },
] as const;
export type SceneId = typeof scenes[number]["id"];
export type ProgressMap = Record<SceneId, SceneProgress>;
export function isSceneStatus(value: unknown): value is SceneStatus {
  return typeof value === "string" && Object.hasOwn(sceneStatuses, value);
}
export function initialProgress(): ProgressMap {
  const result = {} as ProgressMap;
  for (const scene of scenes) result[scene.id] = {
    status: scene.number === 7 ? "testing" : "pending",
    interaction: scene.number === 7 ? "Interaksi drag-and-drop tiga aktivitas." : "",
    checklist: scene.number === 7 ? [
      { id: "illustration-size", label: "Ukuran ilustrasi dikonfirmasi sesuai", done: true },
      { id: "drop-position", label: "Verifikasi posisi akhir gambar setelah drop", done: false },
      { id: "three-activities", label: "Uji drag-and-drop ketiga aktivitas di Unity", done: false },
    ] : [
      { id: "interaction", label: "Implementasikan interaksi scene", done: false },
      { id: "unity-testing", label: "Uji interaksi dan tampilan di Unity", done: false },
    ],
    technicalNotes: scene.number === 7
      ? "Ukuran ilustrasi pernah dikonfirmasi sudah sesuai. Posisi akhir gambar setelah drop masih memerlukan verifikasi. Offset Y = -8 adalah saran terakhir, bukan nilai yang sudah terbukti berhasil." : "",
    issueHistory: scene.number === 7
      ? "Riwayat: pernah dilakukan perbaikan error C# CS0136 dan CS0128. Detail perubahan source dan hasil pengujian akhir belum tersedia; jangan dianggap sebagai bukti seluruh scene telah terverifikasi." : "",
    verification: "",
    scripts: scene.number === 7 ? [
      { id: "drag-drop", name: "DragDropTidurCepat.cs", code: "" },
      { id: "manager", name: "TidurCepatManager.cs", code: "" },
    ] : [],
    storyboardIds: [],
  };
  return result;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string"; }
function uniqueIds(items: { id: string }[]) { return new Set(items.map(item => item.id)).size === items.length; }

export function parseProgress(raw: string | null): ProgressMap {
  const result = initialProgress();
  if (raw === null) return result;
  const data: unknown = JSON.parse(raw);
  if (!record(data)) throw new Error("Format progres tidak valid");
  for (const scene of scenes) {
    const value = data[scene.id];
    if (value === undefined) continue;
    if (!record(value) || !isSceneStatus(value.status)
      || !text(value.interaction) || !text(value.technicalNotes) || !text(value.issueHistory) || !text(value.verification)
      || !Array.isArray(value.checklist) || !value.checklist.every(item => record(item) && text(item.id) && item.id.length > 0 && text(item.label) && typeof item.done === "boolean")
      || !uniqueIds(value.checklist)
      || !Array.isArray(value.scripts) || !value.scripts.every(script => record(script) && text(script.id) && script.id.length > 0 && text(script.name) && text(script.code))
      || !uniqueIds(value.scripts)
      || !Array.isArray(value.storyboardIds) || !value.storyboardIds.every(id => slides.some(slide => slide.id === id))
      || new Set(value.storyboardIds).size !== value.storyboardIds.length) {
      throw new Error(`Data ${scene.id} tidak valid`);
    }
    // Copy only validated fields; never merge untrusted object keys into state.
    result[scene.id] = {
      status: value.status, interaction: value.interaction, technicalNotes: value.technicalNotes,
      issueHistory: value.issueHistory, verification: value.verification,
      checklist: value.checklist.map(item => ({ id: item.id, label: item.label, done: item.done })),
      scripts: value.scripts.map(script => ({ id: script.id, name: script.name, code: script.code })),
      storyboardIds: [...value.storyboardIds],
    };
  }
  return result;
}
