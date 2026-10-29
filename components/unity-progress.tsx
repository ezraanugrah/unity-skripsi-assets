"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { slides } from "@/lib/storyboards";
import { initialProgress, isSceneStatus, parseProgress, scenes, sceneStatuses, UNITY_PROGRESS_KEY, type ProgressMap, type SceneId, type SceneProgress } from "@/lib/unity-progress";

function ScriptEditor({ script, index, onChange, onRemove }: {
  script: SceneProgress["scripts"][number]; index: number;
  onChange: (script: SceneProgress["scripts"][number]) => void; onRemove: () => void;
}) {
  const source = useRef<HTMLTextAreaElement>(null);
  const [copyMessage, setCopyMessage] = useState("");
  async function copyCode() {
    try { await navigator.clipboard.writeText(script.code); setCopyMessage("Source code berhasil disalin."); }
    catch { source.current?.focus(); source.current?.select(); setCopyMessage("Salin otomatis tidak tersedia. Teks dipilih; gunakan Ctrl/Cmd+C."); }
  }
  return <fieldset className="script-editor"><legend>Script {index + 1}</legend>
    <label>Nama script C# {index + 1}<input value={script.name} placeholder="NamaScript.cs" onChange={event => onChange({ ...script, name: event.target.value })} /></label>
    <label>Source code C# {index + 1}<textarea ref={source} className="source-editor" value={script.code} spellCheck={false} rows={10} placeholder="Tempel source C# dari Unity di sini…" onChange={event => { onChange({ ...script, code: event.target.value }); setCopyMessage(""); }} /></label>
    <div className="progress-actions"><button type="button" onClick={copyCode} disabled={!script.code}>Salin source code {index + 1}</button><button type="button" onClick={onRemove}>Hapus script {index + 1}</button></div>
    <p className="progress-feedback" role="status">{copyMessage}</p>
  </fieldset>;
}

export default function UnityProgress() {
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);
  const [selected, setSelected] = useState<SceneId>("scene-1");
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState("Memuat progres browser…");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    try {
      // Browser-only hydration keeps the server and first client render identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(parseProgress(localStorage.getItem(UNITY_PROGRESS_KEY)));
      setFeedback("Progres siap. Perubahan disimpan otomatis di browser ini.");
    } catch {
      setFailed(true);
      setFeedback("Data progres tidak dapat dibaca. Data tersimpan tidak ditimpa; perubahan hanya menjadi draf sesi ini sampai penyimpanan dapat dibaca kembali.");
    }
    setReady(true);
  }, []);
  function update(value: SceneProgress) {
    setProgress(current => ({ ...current, [selected]: value }));
    try {
      const latest = parseProgress(localStorage.getItem(UNITY_PROGRESS_KEY));
      localStorage.setItem(UNITY_PROGRESS_KEY, JSON.stringify({ ...latest, [selected]: value }));
      setFailed(false); setFeedback("Progres berhasil disimpan di browser ini.");
    } catch { setFailed(true); setFeedback("Progres belum tersimpan. Pertahankan halaman ini dan salin perubahan penting sebelum menutupnya."); }
  }
  const scene = scenes.find(item => item.id === selected)!;
  const data = progress[selected];
  const verified = scenes.filter(item => progress[item.id].status === "verified").length;
  const completedItems = data.checklist.filter(item => item.done).length;
  return <>
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">▧</span><span>Storyboard<span className="brand-light"> Studio</span></span></Link><Link className="project-badge" href="/">← Galeri storyboard</Link></header>
    <main className="workspace progress-workspace">
      <section className="progress-intro"><p className="eyebrow">UNITY / MONITORING IMPLEMENTASI</p><h1>Progres Implementasi Unity</h1><p>Pantau tujuh scene, catat keputusan teknis, dan simpan source C# dalam satu ruang kerja.</p><p className="progress-storage">Data hanya tersimpan di browser/perangkat ini, belum sinkron antarperangkat. Source C# ditampilkan sebagai teks dan tidak dijalankan.</p></section>
      <section className="scene-overview" aria-label="Ringkasan scene Unity"><div className="scene-total"><strong>{ready ? verified : "—"}<small> / 7</small></strong><span>scene terverifikasi</span><progress value={verified} max={7} aria-label="Scene terverifikasi" /></div>{Object.entries(sceneStatuses).map(([status, label]) => <div className="scene-stat" key={status}><span>{label}</span><strong>{ready ? scenes.filter(item => progress[item.id].status === status).length : "—"}</strong></div>)}</section>
      <p className={`progress-feedback${failed ? " progress-error" : ""}`} role="status">{feedback}</p>
      <div className="scene-layout"><nav className="scene-list" aria-label="Pilih scene Unity">{scenes.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span className="scene-number">{String(item.number).padStart(2, "0")}</span><span><strong>{item.name}</strong><small>{sceneStatuses[progress[item.id].status]}</small></span></button>)}</nav>
        <section className="scene-detail" aria-labelledby="scene-title"><header className="scene-detail-heading"><div><p className="eyebrow">SCENE {scene.number} / {scene.id}</p><h2 id="scene-title">{scene.name}</h2></div><span className="reference-tag">{completedItems}/{data.checklist.length} checklist</span></header>
          <fieldset className="scene-fields" disabled={!ready} key={selected}>
            <legend className="sr-only">Detail Scene {scene.number} — {scene.name}</legend>
            <label>Status scene<select value={data.status} onChange={event => { if (isSceneStatus(event.target.value)) update({ ...data, status: event.target.value }); }}>{Object.entries(sceneStatuses).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
            {selected === "scene-7" && <p className="scene-evidence">Riwayat awal: posisi akhir setelah drop masih perlu diverifikasi. Offset Y = -8 hanya saran; belum terbukti berhasil. Scene ini belum dinyatakan selesai terverifikasi.</p>}
            <label>Deskripsi interaksi<textarea rows={3} value={data.interaction} placeholder="Tambahkan rancangan interaksi; belum ada hasil pengujian yang dicatat." onChange={event => update({ ...data, interaction: event.target.value })} /></label>
            <section className="scene-block" aria-labelledby="checklist-heading"><h3 id="checklist-heading">Checklist implementasi</h3><p>Checklist tidak otomatis mengubah status verifikasi scene.</p>{data.checklist.map((item, index) => <div className="checklist-row" key={item.id}><input type="checkbox" aria-label={`Selesai: ${item.label || `Item ${index + 1}`}`} checked={item.done} onChange={event => update({ ...data, checklist: data.checklist.map(entry => entry.id === item.id ? { ...entry, done: event.target.checked } : entry) })} /><input aria-label={`Checklist item ${index + 1}`} value={item.label} onChange={event => update({ ...data, checklist: data.checklist.map(entry => entry.id === item.id ? { ...entry, label: event.target.value } : entry) })} /><button type="button" aria-label={`Hapus checklist item ${index + 1}`} onClick={() => update({ ...data, checklist: data.checklist.filter(entry => entry.id !== item.id) })}>×</button></div>)}<button type="button" onClick={() => update({ ...data, checklist: [...data.checklist, { id: crypto.randomUUID(), label: "Item baru", done: false }] })}>+ Tambah checklist</button></section>
            <label>Catatan teknis<textarea rows={4} value={data.technicalNotes} placeholder="Konfigurasi Inspector, offset, dependensi, atau pertanyaan teknis…" onChange={event => update({ ...data, technicalNotes: event.target.value })} /></label>
            <label>Riwayat masalah dan solusi<textarea rows={4} value={data.issueHistory} placeholder="Catat masalah, solusi yang dicoba, dan hasilnya. Bedakan saran dari hasil yang sudah diuji." onChange={event => update({ ...data, issueHistory: event.target.value })} /></label>
            <label>Bukti pengujian / verifikasi<textarea rows={3} value={data.verification} placeholder="Isi hasil uji nyata, tanggal, dan kondisi pengujian sebelum menyatakan selesai terverifikasi." onChange={event => update({ ...data, verification: event.target.value })} /></label>
            {data.status === "verified" && !data.verification.trim() && <p className="scene-evidence">Status dipilih manual, tetapi bukti verifikasi belum dicatat. Dashboard tidak menguji aplikasi Unity secara otomatis.</p>}
            <section className="scene-block" aria-labelledby="storyboard-link-heading"><h3 id="storyboard-link-heading">Storyboard terkait</h3><p>Pilih pemetaan berdasarkan gambar yang sesuai. Belum ada pemetaan yang diasumsikan.</p><label>Pilih storyboard terkait<select multiple size={5} value={data.storyboardIds} onChange={event => update({ ...data, storyboardIds: Array.from(event.target.selectedOptions, option => option.value) })}>{slides.map(item => <option key={item.id} value={item.id}>{item.title} · {item.filename}</option>)}</select></label><div className="storyboard-links">{data.storyboardIds.map(id => <Link href={`/#${id}`} key={id}>Lihat {slides.find(item => item.id === id)?.title} ↗</Link>)}</div></section>
            <section className="scene-block" aria-labelledby="scripts-heading"><h3 id="scripts-heading">Script dan source C#</h3><p>Simpan versi source dari Unity. Nama file yang tercatat bukan bukti source sudah tersedia atau sudah lolos pengujian.</p>{data.scripts.length === 0 && <p>Belum ada script. Tambahkan saat implementasi tersedia.</p>}{data.scripts.map((script, index) => <ScriptEditor key={`${selected}-${script.id}`} script={script} index={index} onChange={value => update({ ...data, scripts: data.scripts.map(item => item.id === script.id ? value : item) })} onRemove={() => update({ ...data, scripts: data.scripts.filter(item => item.id !== script.id) })} />)}<button type="button" onClick={() => update({ ...data, scripts: [...data.scripts, { id: crypto.randomUUID(), name: "", code: "" }] })}>+ Tambah script C#</button></section>
          </fieldset>
        </section>
      </div>
    </main>
  </>;
}
