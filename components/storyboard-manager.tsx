"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { character, imagePath, slides, storyboards, type Storyboard } from "@/lib/storyboards";
import { isStatus, parseStatuses, statusLabels, STORAGE_KEY, type Status, type StatusMap } from "@/lib/storyboard-status";

type Filter = "all" | Status;
function StatusSelect({ item, value, onChange, disabled }: { item: Storyboard; value: Status; onChange: (id: string, status: Status) => void; disabled: boolean }) {
  return <label className={`status-control status-${value}`}><span className="status-dot" /><select aria-label={`Status ${item.title}`} value={value} disabled={disabled} onChange={event => { if (isStatus(event.target.value)) onChange(item.id, event.target.value); }}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>;
}

function Preview({ initialId, statuses, onChange, onClose, ready }: { initialId: string; statuses: StatusMap; onChange: (id: string, status: Status) => void; onClose: () => void; ready: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() => storyboards.findIndex(item => item.id === initialId));
  const item = storyboards[index];
  useEffect(() => {
    const node = dialog.current;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => { node?.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, []);
  return <dialog ref={dialog} className="preview" aria-labelledby="preview-title" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if ((event.target as HTMLElement).closest("select")) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(value => Math.max(0, value - 1)); }
    if (event.key === "ArrowRight") { event.preventDefault(); setIndex(value => Math.min(storyboards.length - 1, value + 1)); }
  }}>
    <div className="preview-shell">
      <header className="preview-header"><div><p className="eyebrow">{item.kind === "slide" ? "STORYBOARD" : "REFERENSI KARAKTER"}</p><h2 id="preview-title">{item.title}</h2></div><button autoFocus className="close-button" onClick={onClose} aria-label="Tutup pratinjau">✕ <span>Tutup</span></button></header>
      <div className="preview-image"><Image key={item.id} src={imagePath(item)} alt={`Pratinjau ${item.title}`} fill sizes="100vw" quality={90} priority style={{ objectFit: "contain" }} /></div>
      <footer className="preview-footer"><div><p className="file-label">{item.filename}</p>{item.kind === "slide" ? <StatusSelect item={item} value={statuses[item.id] ?? "todo"} onChange={onChange} disabled={!ready} /> : <span className="reference-tag">Referensi · tidak dihitung dalam progres</span>}</div><nav className="preview-nav" aria-label="Navigasi pratinjau"><button className="nav-button" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Gambar sebelumnya">←</button><span aria-live="polite">{index + 1} / {storyboards.length}</span><button className="nav-button" disabled={index === storyboards.length - 1} onClick={() => setIndex(index + 1)} aria-label="Gambar berikutnya">→</button></nav><p className="keyboard-hint">← → Navigasi <span>·</span> Esc Tutup</p></footer>
    </div>
  </dialog>;
}

export default function StoryboardManager() {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    // Browser-only hydration: server and first client render share the same defaults.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatuses(parseStatuses(localStorage.getItem(STORAGE_KEY)));
    } catch { setNotice("Status tersimpan tidak dapat dibaca. Anda tetap dapat memperbarui progres di sesi ini."); }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try { setStatuses(parseStatuses(event.newValue)); } catch { setNotice("Data status dari tab lain tidak valid. Progres sesi ini tetap dipertahankan."); }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function updateStatus(id: string, status: Status) {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setNotice(""); }
    catch { setNotice("Browser tidak dapat menyimpan status. Perubahan hanya berlaku selama sesi ini."); }
  }
  const count = (status: Status) => slides.filter(item => (statuses[item.id] ?? "todo") === status).length;
  const done = count("done");
  const percent = Math.round(done / slides.length * 100);
  const visible = slides.filter(item => (filter === "all" || (statuses[item.id] ?? "todo") === filter) && `${item.title} ${item.filename}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <header className="topbar"><a href="#" className="brand"><span className="brand-mark" aria-hidden="true">▧</span><span>Storyboard<span className="brand-light"> Studio</span></span></a><span className="project-badge"><span className="live-dot" /> Unity Skripsi</span></header>
    <main className="workspace">
      <section className="intro"><div><p className="eyebrow">RUANG KERJA PROYEK / UNITY</p><h1>Dari storyboard,<br /><span>menjadi pengalaman.</span></h1><p className="intro-copy">Semua rancangan visual dalam satu tempat. Tinjau setiap slide<br className="desktop-break" /> dan pantau perjalanan implementasinya di Unity.</p></div><div className="project-note"><span className="note-icon" aria-hidden="true">↗</span><p>7 Kebiasaan<br /><strong>Anak Indonesia Hebat</strong></p><span>PROYEK SKRIPSI</span></div></section>
      <section className="overview" aria-label="Ringkasan progres"><div className="progress-summary"><div className="progress-heading"><span>Progres implementasi</span><span className="percent">{ready ? percent : "—"}<small>%</small></span></div><progress max={19} value={done} aria-label="Slide selesai" /><p>{ready ? done : "—"} dari 19 slide selesai<span>Teruskan langkah kecilmu.</span></p></div><div className="stat"><span className="stat-label"><i className="status-dot todo-dot" /> Belum dikerjakan</span><strong>{ready ? count("todo") : "—"}</strong></div><div className="stat"><span className="stat-label"><i className="status-dot progress-dot" /> Sedang dikerjakan</span><strong>{ready ? count("progress") : "—"}</strong></div><div className="stat"><span className="stat-label"><i className="status-dot done-dot" /> Selesai</span><strong>{ready ? done : "—"}</strong></div></section>
      <p className="storage-note">◉ Status tersimpan otomatis di browser ini <span>· Tidak tersinkron antarperangkat</span></p>
      {notice && <p className="notice" role="status">{notice}</p>}
      <section id="gallery" className="gallery-section"><div className="section-heading"><div><p className="eyebrow">01 / STORYBOARD</p><h2>Rangkaian cerita <span>19 slide</span></h2></div><label className="search"><span aria-hidden="true">⌕</span><input aria-label="Cari slide" placeholder="Cari slide atau nama file…" value={query} onChange={event => setQuery(event.target.value)} /></label></div><div className="gallery-toolbar"><div className="filters" aria-label="Filter status">{(["all", "todo", "progress", "done"] as const).map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "active" : ""}>{value === "all" ? "Semua slide" : statusLabels[value]}<span>{value === "all" ? 19 : ready ? count(value) : "—"}</span></button>)}</div><span className="sort-label">Urutan nomor ↑</span></div>
        <div className="gallery-grid">{visible.map((item, index) => <article className="story-card" key={item.id}><button className="thumbnail" onClick={() => setSelected(item.id)} aria-label={`Buka pratinjau ${item.title}`}><Image src={imagePath(item)} alt={`Storyboard ${item.title}`} width={1920} height={1080} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" priority={index < 3} /><span className="preview-cue">↗ <span>Lihat slide</span></span></button><div className="card-body"><div className="card-title"><h3>{item.title}</h3><span>{item.filename}</span></div><StatusSelect item={item} value={statuses[item.id] ?? "todo"} onChange={updateStatus} disabled={!ready} /></div></article>)}</div>
        {visible.length === 0 && <div className="empty-state"><h3>Tidak ada slide yang cocok</h3><p>Coba kata pencarian atau status yang berbeda.</p><button onClick={() => { setQuery(""); setFilter("all"); }}>Tampilkan semua slide</button></div>}
        <p className="result-count">Menampilkan {visible.length} dari 19 slide <span>· Nomor mengikuti nama file asli (2–20)</span></p>
      </section>
      <section className="reference-section"><div className="section-heading"><div><p className="eyebrow">02 / REFERENSI</p><h2>Kenali pemandunya <span>1 aset</span></h2></div></div><article className="reference-card"><button className="reference-image" onClick={() => setSelected(character.id)} aria-label="Buka pratinjau karakter pemandu"><Image src={imagePath(character)} alt="Referensi karakter pemandu" width={1920} height={1080} sizes="(max-width: 639px) 100vw, 320px" /><span className="preview-cue">↗</span></button><div className="reference-copy"><span className="reference-tag">REFERENSI KARAKTER</span><h3>Karakter pemandu</h3><p>Acuan visual karakter pendamping dalam pengalaman belajar.</p><p className="file-label">karakter pemandu.png · 1920 × 1080</p><button className="text-button" onClick={() => setSelected(character.id)}>Lihat referensi <span>↗</span></button></div></article></section>
      <footer className="page-footer"><span>Storyboard Studio <span className="footer-divider">/</span> Unity Skripsi</span><span>19 slide · 1 referensi · Semua gambar asli</span></footer>
    </main>
    {selected && <Preview key={selected} initialId={selected} statuses={statuses} onChange={updateStatus} onClose={() => setSelected(null)} ready={ready} />}
  </>;
}
