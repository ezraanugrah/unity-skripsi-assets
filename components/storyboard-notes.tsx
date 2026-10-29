"use client";

import { useId, useState } from "react";
import { NOTES_STORAGE_KEY, parseNotes } from "@/lib/storyboard-notes";

// Mounted only when the user opens a slide preview; key by slide ID to isolate drafts.
export default function StoryboardNotes({ slideId }: { slideId: string }) {
  const fieldId = useId();
  const [initial] = useState(() => {
    try {
      return { text: parseNotes(localStorage.getItem(NOTES_STORAGE_KEY))[slideId] ?? "", failed: false };
    } catch {
      return { text: "", failed: true };
    }
  });
  const [text, setText] = useState(initial.text);
  const [feedback, setFeedback] = useState(initial.failed
    ? "Catatan tidak dapat dibaca. Data tersimpan tidak ditimpa."
    : initial.text ? "Catatan tersimpan di browser ini." : "Tersimpan otomatis di browser ini.");
  const [failed, setFailed] = useState(initial.failed);

  function save(value: string) {
    setText(value);
    try {
      // Merge with the latest stored data so editing this slide preserves other notes.
      const notes = parseNotes(localStorage.getItem(NOTES_STORAGE_KEY));
      if (value === "") delete notes[slideId];
      else notes[slideId] = value;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      setFailed(false);
      setFeedback("Catatan berhasil disimpan di browser ini.");
    } catch {
      setFailed(true);
      setFeedback("Catatan belum tersimpan. Salin teks ini sebelum menutup preview, lalu coba simpan lagi.");
    }
  }

  return <section className="unity-notes" aria-labelledby={`${fieldId}-label`}>
    <label id={`${fieldId}-label`} htmlFor={fieldId}>Catatan Implementasi Unity</label>
    <p>Rencanakan komponen, interaksi, atau pekerjaan Unity untuk slide ini.</p>
    <textarea id={fieldId} value={text} onChange={event => save(event.target.value)}
      aria-describedby={`${fieldId}-feedback`} placeholder="Contoh: Hubungkan tombol Play ke scene utama…" rows={6} />
    <p id={`${fieldId}-feedback`} className={failed ? "notes-feedback notes-error" : "notes-feedback"} role="status">{feedback}</p>
    {failed && <button type="button" className="nav-button" onClick={() => save(text)}>Coba simpan lagi</button>}
  </section>;
}
