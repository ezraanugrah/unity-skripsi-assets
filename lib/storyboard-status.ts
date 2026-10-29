import { slides } from "./storyboards";
export const STORAGE_KEY = "unity-storyboard-status:v1";
export const statusLabels = { todo: "Belum dikerjakan", progress: "Sedang dikerjakan", done: "Selesai" } as const;
export type Status = keyof typeof statusLabels;
export type StatusMap = Record<string, Status>;
export function isStatus(value: unknown): value is Status { return value === "todo" || value === "progress" || value === "done"; }
export function parseStatuses(raw: string | null): StatusMap {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Format status tidak valid");
  const clean: StatusMap = {};
  for (const slide of slides) {
    const value = (parsed as Record<string, unknown>)[slide.id];
    if (isStatus(value)) clean[slide.id] = value;
  }
  return clean;
}
