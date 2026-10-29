import { slides } from "./storyboards";

export const NOTES_STORAGE_KEY = "unity-storyboard-notes:v1";
export type NotesMap = Record<string, string>;

export function parseNotes(raw: string | null): NotesMap {
  if (raw === null) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Format catatan tidak valid");
  }
  const notes: NotesMap = {};
  for (const slide of slides) {
    const value = (parsed as Record<string, unknown>)[slide.id];
    if (typeof value === "string") notes[slide.id] = value;
  }
  return notes;
}
