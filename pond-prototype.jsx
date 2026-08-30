/**
 * REFERENCE ONLY — do not import this file into the app.
 * Product prototype for layout and motion. Tokens in the live app
 * come from DESIGN.md / globals.css, not these inline hex values.
 */
import { useState, useRef, useEffect, useMemo } from "react";

/* ═══ tokens — see pond-design-system.md ═══ */
const T = {
  ink: "#1F2A28", inkSoft: "#667874",
  surface: "#FFFFFF", surface2: "#F4F7F6",
  line: "rgba(31,42,40,0.10)",
  accent: "#E4652F", accentSoft: "#FFD1A8",
  w1: "#EAF4F0", w2: "#C8E1DE", w3: "#9BC7CC",
  rCard: 12, rInput: 20, rPill: 999,
  shSm: "0 2px 8px rgba(20,50,55,0.08)",
  shLg: "0 8px 24px rgba(20,50,55,0.12)",
  display: "'Inria Serif', Georgia, serif",
  body: "'Pretendard', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};
/* type scale: display 28 · title 20 · body 16 · label 14 · caption 12 */

const CATEGORIES = [
  { id: "ai",    name: "ai art",      species: "koi",      fill: "#F2F0EA", mark: "#E4652F" },
  { id: "code",  name: "vibe coding", species: "tang",     fill: "#4E86B8", mark: "#F2C14E" },
  { id: "music", name: "music",       species: "betta",    fill: "#CFC6EC", mark: "#9C8FD4" },
  { id: "idea",  name: "ideas",       species: "goldfish", fill: "#F0913C", mark: "#D9631E" },
];
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

const DAY = 86400000;
const ago = (d) => Date.now() - d * DAY;
const uid = () => Math.random().toString(36).slice(2, 9);

const SEED = [
  { id: "n1", cat: "ai", acted: ago(0), title: "fruit as makeup", body: "banana mascara, grape shadow. shoot the purple one first.", blocks: [] },
  { id: "n2", cat: "ai", acted: ago(47), title: "bubble dream", body: "a girl dreaming with a bubble floating above her head, bright white shirt, soft chrome light.", blocks: [] },
  { id: "n3", cat: "ai", acted: ago(96), title: "ink in water", body: "filmed from directly above, very slow. 120fps cut to half speed. the bloom is the whole shot.",
    blocks: [
      { id: uid(), type: "colour", content: "#1B2A33", x: 30, y: 26, w: 110 },
      { id: uid(), type: "colour", content: "#C6D8CE", x: 156, y: 26, w: 110 },
      { id: uid(), type: "video", content: "https://youtube.com/watch?v=ink-reference", x: 30, y: 150, w: 210 },
      { id: uid(), type: "voice", content: "0:14", x: 290, y: 26, w: 190 },
    ] },
  { id: "n4", cat: "code", acted: ago(2), title: "capture speed", body: "under 400ms to first keystroke. nothing else matters if that's slow.", blocks: [] },
  { id: "n5", cat: "code", acted: ago(29), title: "one note type", body: "title + body + board. never build two kinds of note.", blocks: [] },
  { id: "n6", cat: "code", acted: ago(71), title: "hold to record", body: "tap + to type, hold + to record a voice note.", blocks: [] },
  { id: "n7", cat: "idea", acted: ago(38), title: "pigeon app", body: "people can take a picture of pigeons and adopt them.", blocks: [] },
  { id: "n8", cat: "music", acted: ago(58), title: "video moodboard", body: "pale mint, wet stone, one orange accident. reference cut pinned below.",
    blocks: [
      { id: uid(), type: "colour", content: "#EAF4F0", x: 28, y: 24, w: 100 },
      { id: uid(), type: "colour", content: "#9BC7CC", x: 142, y: 24, w: 100 },
      { id: uid(), type: "colour", content: "#E4652F", x: 256, y: 24, w: 100 },
      { id: uid(), type: "video", content: "https://youtube.com/watch?v=reference-cut", x: 28, y: 148, w: 210 },
      { id: uid(), type: "image", content: "", x: 262, y: 148, w: 200 },
    ] },
  { id: "n9", cat: "music", acted: ago(103), title: "field recording", body: "rain on the studio window. keep the traffic in.", blocks: [] },
  { id: "n10", cat: "idea", acted: ago(6), title: "one-thing shop", body: "sells a single product. it changes every month.", blocks: [] },
  { id: "n11", cat: "idea", acted: ago(132), title: "three-number report", body: "a weekly report that is three numbers and no commentary.", blocks: [] },
  { id: "n12", cat: "music", acted: ago(11), title: "no drums until chorus two", body: "downtempo. let it feel unfinished for 90 seconds.", blocks: [] },
  { id: "n13", cat: "code", acted: ago(84), title: "the net tool", body: "drag a net over fish to batch-move them to another pond.", blocks: [] },
  { id: "n14", cat: "ai", acted: ago(21), title: "bubble warrior", body: "there is a girl watching the water from inside a soap bubble.", blocks: [] },
];

const hasBoard = (n) => n.blocks.length > 0;
const daysIdle = (n) => Math.floor((Date.now() - n.acted) / DAY);
const sizeOf = (n) => 0.44 + Math.min(daysIdle(n), 90) / 90 * 0.8;

const LAYERS = [
  { k: 1.00, o: 1.00, blur: 0, speed: 1.0 },
  { k: 0.74, o: 0.68, blur: 1.4, speed: 0.66 },
  { k: 0.50, o: 0.40, blur: 3.0, speed: 0.42 },
];
const layerOf = (id) => LAYERS[(id.charCodeAt(id.length - 1) + id.length) % 3];

/* ═══ icons — use @iconify/react in the real build ═══ */
const I = {
  search: "M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z",
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 5 5.9V20H8v2h8v-2h-3v-3.1A6 6 0 0 0 18 11h-2a4 4 0 0 1-8 0H6Z",
  image: "M4 5h16v14H4V5Zm2 2v7.6l3.2-3.2 3 3L15 11l3 3V7H6Zm3 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  video: "M4 6h16v12H4V6Zm2 2v8h12V8H6Zm4 1.5 5 2.5-5 2.5v-5Z",
  colour: "M12 3c-4.4 0-8 3.3-8 7.5S7.6 18 12 18h1.5a1.5 1.5 0 0 0 1.1-2.5c-.6-.7-.2-1.5.7-1.5H17c1.7 0 3-1.4 3-3.2C20 6.6 16.4 3 12 3Zm-4.5 8a1.3 1.3 0 1 1 0-2.5 1.3 1.3 0 0 1 0 2.5Zm3-3.5a1.3 1.3 0 1 1 0-2.5 1.3 1.3 0 0 1 0 2.5Zm4 0a1.3 1.3 0 1 1 0-2.5 1.3 1.3 0 0 1 0 2.5Z",
  expand: "M4 4h7v2H6v5H4V4Zm9 0h7v7h-2V6h-5V4ZM4 13h2v5h5v2H4v-7Zm14 0h2v7h-7v-2h5v-5Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
};
const Ico = ({ d, size = 20, color = T.ink, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden><path d={d} fill={color} /></svg>
);

/* ═══ fish ═══ */
function Fish({ species, fill, mark, scale = 1, dim = false, layer }) {
  const L = layer || LAYERS[0];
  const w = 108 * scale * L.k;
  const p = { width: w, height: w * 0.6, viewBox: "0 0 180 108",
    style: { opacity: dim ? 0.1 : L.o, filter: L.blur ? `blur(${L.blur}px)` : "none", transition: "opacity 400ms ease" } };

  if (species === "koi") return (
    <svg {...p}>
      <path d="M8 54 C 26 30, 40 30, 52 54 C 40 78, 26 78, 8 54 Z" fill={fill} opacity="0.9" />
      <ellipse cx="106" cy="54" rx="60" ry="27" fill={fill} />
      <path d="M100 28 C 112 8, 126 10, 122 30 Z" fill={fill} opacity="0.85" />
      <path d="M100 80 C 112 100, 126 98, 122 78 Z" fill={fill} opacity="0.85" />
      <ellipse cx="120" cy="42" rx="19" ry="12" fill={mark} />
      <ellipse cx="82" cy="63" rx="12" ry="8" fill={mark} opacity="0.85" />
      <circle cx="158" cy="50" r="3" fill={T.ink} />
    </svg>
  );
  if (species === "goldfish") return (
    <svg {...p}>
      <path d="M4 54 C 24 18, 44 22, 56 54 C 44 86, 24 90, 4 54 Z" fill={fill} opacity="0.55" />
      <path d="M12 54 C 30 34, 46 36, 58 54 C 46 72, 30 74, 12 54 Z" fill={fill} opacity="0.8" />
      <ellipse cx="108" cy="54" rx="56" ry="34" fill={fill} />
      <path d="M104 22 C 118 4, 132 8, 126 26 Z" fill={mark} opacity="0.9" />
      <path d="M96 84 C 108 104, 122 100, 116 82 Z" fill={mark} opacity="0.8" />
      <circle cx="156" cy="47" r="3.5" fill={T.ink} />
    </svg>
  );
  if (species === "tang") return (
    <svg {...p}>
      <path d="M10 54 L 46 30 L 46 78 Z" fill={mark} />
      <path d="M46 54 C 60 12, 130 8, 158 46 C 164 54, 158 62, 150 70 C 118 100, 62 96, 46 54 Z" fill={fill} />
      <path d="M74 26 C 96 14, 124 16, 140 32 L 78 40 Z" fill={mark} opacity="0.5" />
      <circle cx="146" cy="46" r="3.5" fill={T.ink} />
    </svg>
  );
  return (
    <svg {...p}>
      <path d="M2 54 C 22 6, 44 14, 60 54 C 44 96, 22 102, 2 54 Z" fill={fill} opacity="0.5" />
      <path d="M70 46 C 84 4, 128 2, 140 30 L 76 54 Z" fill={fill} opacity="0.6" />
      <path d="M70 62 C 84 104, 126 106, 138 80 L 76 56 Z" fill={mark} opacity="0.45" />
      <ellipse cx="112" cy="54" rx="52" ry="22" fill={fill} />
      <circle cx="154" cy="50" r="3" fill={T.ink} />
    </svg>
  );
}

const PADS = [
  { x: 6, y: 18, r: 58, o: 0.3 }, { x: 24, y: 9, r: 38, o: 0.22 },
  { x: 80, y: 24, r: 50, o: 0.26 }, { x: 93, y: 66, r: 44, o: 0.18 },
  { x: 10, y: 78, r: 48, o: 0.2 }, { x: 60, y: 92, r: 36, o: 0.16 },
];
const LilyPads = () => (
  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
    {PADS.map((p, i) => (
      <g key={i} opacity={p.o} transform={`translate(${p.x}% ${p.y}%)`}>
        <circle r={p.r} fill={i % 2 ? "#6E9E74" : "#8FB98A"} />
        <path d={`M0 0 L ${p.r * .95} ${-p.r * .34} A ${p.r} ${p.r} 0 0 0 ${p.r * .95} ${p.r * .34} Z`} fill={T.w2} opacity="0.8" />
      </g>
    ))}
  </svg>
);

/* ═══ board card ═══ */
function Card({ block, onChange, onDelete, boardRef, floating }) {
  const drag = useRef(null);
  const startDrag = (e) => {
    if (!floating) return;
    e.preventDefault();
    const r = boardRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left - block.x, dy: e.clientY - r.top - block.y };
    const move = (ev) => {
      const b = boardRef.current.getBoundingClientRect();
      onChange({ ...block,
        x: Math.max(0, Math.min(ev.clientX - b.left - drag.current.dx, b.width - 80)),
        y: Math.max(0, Math.min(ev.clientY - b.top - drag.current.dy, b.height - 40)) });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const shell = floating ? { position: "absolute", left: block.x, top: block.y, width: block.w }
                         : { width: block.type === "colour" ? 110 : 200 };
  const input = { width: "100%", padding: "6px 10px", fontSize: 12, fontFamily: T.body, color: T.inkSoft, background: "transparent", border: "none", outline: "none" };

  return (
    <div style={{ ...shell, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rCard, boxShadow: T.shSm, overflow: "hidden" }}>
      <div onPointerDown={startDrag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
             padding: "5px 8px", background: T.surface2, cursor: floating ? "grab" : "default", touchAction: "none" }}>
        <span style={{ fontSize: 12, fontFamily: T.mono, color: T.inkSoft, letterSpacing: "0.08em" }}>{block.type}</span>
        <button onClick={() => onDelete(block.id)} style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1 }} aria-label="Remove">×</button>
      </div>
      {block.type === "colour" && (<>
        <div style={{ background: block.content, height: 68 }} />
        <input value={block.content} onChange={(e) => onChange({ ...block, content: e.target.value })} style={input} />
      </>)}
      {block.type === "image" && (<>
        {/^https?:\/\//.test(block.content)
          ? <img src={block.content} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
          : <div style={{ height: 92, background: T.w2, display: "grid", placeItems: "center", fontSize: 12, fontFamily: T.body, color: T.ink }}>paste an image URL</div>}
        <input value={block.content} onChange={(e) => onChange({ ...block, content: e.target.value })} placeholder="image URL" style={input} />
      </>)}
      {block.type === "video" && (<>
        <div style={{ height: 88, background: "#1B2A33", display: "grid", placeItems: "center" }}>
          <span style={{ width: 34, height: 34, borderRadius: T.rPill, background: T.accent, display: "grid", placeItems: "center", color: "#fff", fontSize: 13 }}>▶</span>
        </div>
        <input value={block.content} onChange={(e) => onChange({ ...block, content: e.target.value })} placeholder="YouTube URL" style={input} />
      </>)}
      {block.type === "voice" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px" }}>
          <span style={{ width: 26, height: 26, borderRadius: T.rPill, background: T.accent, display: "grid", placeItems: "center", color: "#fff", fontSize: 11 }}>▶</span>
          <svg width="86" height="18" viewBox="0 0 86 18">
            {Array.from({ length: 21 }).map((_, i) => (
              <rect key={i} x={i * 4} y={9 - (2 + Math.abs(Math.sin(i * 1.3)) * 7)} width="2"
                    height={4 + Math.abs(Math.sin(i * 1.3)) * 14} rx="1" fill={T.inkSoft} opacity="0.55" />
            ))}
          </svg>
          <span style={{ fontSize: 12, fontFamily: T.mono, color: T.inkSoft }}>{block.content}</span>
        </div>
      )}
    </div>
  );
}

/* ═══ note editor ═══ */
function Editor({ note, onChange, onClose, onActed, onDelete, narrow }) {
  const cat = catOf(note.cat);
  const [split, setSplit] = useState(hasBoard(note) ? 0.42 : 0.76);
  const wrapRef = useRef(null), boardRef = useRef(null);

  const dragDivider = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const r = wrapRef.current.getBoundingClientRect();
      setSplit(Math.max(0.14, Math.min((ev.clientY - r.top) / r.height, 0.86)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const add = (type) => {
    const d = { colour: "#9BC7CC", image: "", video: "", voice: "0:08" };
    const n = note.blocks.length;
    onChange({ ...note, blocks: [...note.blocks, { id: uid(), type, content: d[type],
      x: 24 + (n % 3) * 130, y: 24 + Math.floor(n / 3) * 118, w: type === "colour" ? 110 : 200 }] });
    if (split > 0.6) setSplit(0.42);
  };
  const update = (b) => onChange({ ...note, blocks: note.blocks.map((x) => (x.id === b.id ? b : x)) });
  const drop = (id) => onChange({ ...note, blocks: note.blocks.filter((x) => x.id !== id) });

  const iconBtn = { display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: T.rPill, background: T.accentSoft };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: T.surface, fontFamily: T.body }}>
      <div className="flex items-center justify-between" style={{ padding: "14px 24px", borderBottom: `1px solid ${T.line}`, background: T.w1 }}>
        <div className="flex items-center gap-2">
          <Fish species={cat.species} fill={cat.fill} mark={cat.mark} scale={0.26} />
          <span style={{ fontSize: 12, fontFamily: T.mono, color: T.inkSoft, letterSpacing: "0.08em" }}>
            {cat.name.toUpperCase()} · {daysIdle(note)}D
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onActed(note.id)} style={{ fontSize: 14, padding: "8px 16px", borderRadius: T.rPill, background: T.accent, color: "#fff" }}>Acted on it</button>
          <button onClick={() => onDelete(note.id)} style={{ fontSize: 14, padding: "8px 16px", borderRadius: T.rPill, border: `1px solid ${T.line}`, color: T.inkSoft }}>Release</button>
          <button onClick={onClose} style={{ fontSize: 14, padding: "8px 8px", color: T.inkSoft }}>Done</button>
        </div>
      </div>

      <div ref={wrapRef} className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto" style={{ height: `${split * 100}%`, padding: "20px 24px 0" }}>
          <input value={note.title} onChange={(e) => onChange({ ...note, title: e.target.value })}
                 placeholder="Add your original spark"
                 style={{ width: "100%", fontSize: 20, fontFamily: T.display, color: T.ink, background: "transparent", border: "none", outline: "none" }} />
          <textarea value={note.body} onChange={(e) => onChange({ ...note, body: e.target.value })}
                    placeholder="add your ideas…"
                    style={{ marginTop: 10, width: "100%", height: "78%", fontSize: 16, lineHeight: 1.65, fontFamily: T.body,
                             color: T.ink, background: "transparent", border: "none", outline: "none", resize: "none" }} />
        </div>

        <div onPointerDown={dragDivider} className="flex items-center gap-2 select-none"
             style={{ padding: "8px 24px", cursor: "row-resize", touchAction: "none", background: T.w1,
                      borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
          <span style={{ width: 32, height: 4, borderRadius: T.rPill, background: "rgba(31,42,40,0.18)" }} />
          <span style={{ marginRight: "auto", fontSize: 12, fontFamily: T.mono, color: T.inkSoft, letterSpacing: "0.08em" }}>
            BOARD{narrow ? "" : " · DRAG TO ARRANGE"}
          </span>
          {[["mic", "voice"], ["image", "image"], ["video", "video"], ["colour", "colour"]].map(([ico, type]) => (
            <button key={type} onPointerDown={(e) => e.stopPropagation()} onClick={() => add(type)} style={iconBtn} aria-label={`Add ${type}`}>
              <Ico d={I[ico]} size={20} />
            </button>
          ))}
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setSplit(split > 0.3 ? 0.14 : 0.5)}
                  style={{ ...iconBtn, background: T.surface2 }} aria-label="Expand board">
            <Ico d={I.expand} size={18} color={T.inkSoft} />
          </button>
        </div>

        <div ref={boardRef} className={`relative flex-1 overflow-auto ${narrow ? "flex flex-wrap gap-3 p-4 content-start" : ""}`}
             style={{ background: narrow ? T.surface : `radial-gradient(circle at 1px 1px, rgba(31,42,40,0.11) 1px, transparent 0) 0 0 / 24px 24px, ${T.surface}` }}>
          {note.blocks.map((b) => <Card key={b.id} block={b} boardRef={boardRef} onChange={update} onDelete={drop} floating={!narrow} />)}
          {!note.blocks.length && (
            <p style={{ position: narrow ? "static" : "absolute", left: 24, top: 20, fontSize: 14, color: T.inkSoft }}>
              Nothing pinned yet. Add a voice note, a picture, a video, or a colour.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ app ═══ */
export default function Pond() {
  const [notes, setNotes] = useState(SEED);
  const [filter, setFilter] = useState(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState("ai");
  const [seed, setSeed] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [narrow, setNarrow] = useState(false);

  const rootRef = useRef(null), pondRef = useRef(null);
  const nodes = useRef({}), motion = useRef({}), inputRef = useRef(null);

  useEffect(() => {
    const check = () => setNarrow((rootRef.current?.offsetWidth || 900) < 720);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return new Set(notes.filter((n) => (!filter || n.cat === filter) &&
      (!q || (n.title + " " + n.body).toLowerCase().includes(q))).map((n) => n.id));
  }, [notes, filter, query]);

  const daily = useMemo(() => {
    const pool = notes.filter((n) => visible.has(n.id) && daysIdle(n) >= 7);
    const ranked = [...pool].sort((a, b) => daysIdle(b) - daysIdle(a)).slice(0, 9);
    return ranked.sort(() => Math.sin(seed + ranked.length) - 0.5).slice(0, narrow ? 2 : 4);
  }, [notes, visible, seed, narrow]);

  useEffect(() => {
    notes.forEach((n, i) => {
      if (!motion.current[n.id]) {
        const L = layerOf(n.id);
        motion.current[n.id] = { x: (i * 37) % 100, y: 12 + ((i * 53) % 74), dir: i % 2 ? 1 : -1,
          speed: (0.55 + ((i * 7) % 10) / 22) * L.speed, phase: (i * 1.7) % 6.283, bob: 1.2 + ((i * 3) % 5) / 3 };
      }
    });
    let raf, last = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (t) => {
      const dt = Math.min(t - last, 50) / 1000; last = t;
      for (const id in motion.current) {
        const m = motion.current[id], el = nodes.current[id];
        if (!el) continue;
        if (!reduce) { m.x += m.dir * m.speed * dt; if (m.x > 114) m.x = -14; if (m.x < -14) m.x = 114; }
        el.style.left = m.x + "%";
        el.style.top = m.y + (reduce ? 0 : Math.sin(t / 1500 + m.phase) * m.bob) + "%";
        el.style.transform = `translate(-50%,-50%) scaleX(${m.dir})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [notes]);

  const tapWater = (e) => {
    const r = pondRef.current.getBoundingClientRect();
    const id = Math.random();
    setRipples((v) => [...v, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((v) => v.filter((p) => p.id !== id)), 900);
    setSeed((s) => s + 1);
  };

  const save = (thenOpen) => {
    const text = draft.trim();
    if (!text && !thenOpen) return;
    const id = "n" + Date.now();
    setNotes((v) => [...v, { id, cat: draftCat, acted: Date.now(), title: text, body: "", blocks: [] }]);
    setDraft(""); setWriting(false);
    if (thenOpen) setOpenId(id);
  };
  const markActed = (id) => { setNotes((v) => v.map((n) => (n.id === id ? { ...n, acted: Date.now() } : n))); setOpenId(null); };
  const remove = (id) => { setNotes((v) => v.filter((n) => n.id !== id)); delete motion.current[id]; setOpenId(null); };

  const openNote = notes.find((n) => n.id === openId);
  const gutter = narrow ? 16 : 24;

  return (
    <div ref={rootRef} className="relative w-full flex flex-col"
         style={{ height: 800, background: T.w1, color: T.ink, fontFamily: T.body }}>

      {/* search + filters */}
      <div style={{ padding: `${gutter}px ${gutter}px 0` }}>
        <div className="flex items-center" style={{ background: T.surface2, borderRadius: T.rInput, border: `1px solid ${T.line}`, padding: "0 18px" }}>
          <Ico d={I.search} size={20} color={T.inkSoft} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search the water…"
                 style={{ flex: 1, padding: "13px 12px", fontSize: 14, background: "transparent", border: "none", outline: "none", color: T.ink }} />
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ marginTop: 12, paddingBottom: 2 }}>
          <button onClick={() => setFilter(null)}
                  style={{ flexShrink: 0, padding: "8px 16px", fontSize: 14, borderRadius: T.rPill,
                           background: filter === null ? T.accent : T.surface2, color: filter === null ? "#fff" : T.inkSoft, border: `1px solid ${T.line}` }}>
            ALL
          </button>
          {CATEGORIES.map((c) => {
            const on = filter === c.id;
            return (
              <button key={c.id} onClick={() => setFilter(on ? null : c.id)}
                      className="flex items-center gap-1.5"
                      style={{ flexShrink: 0, padding: "5px 16px 5px 8px", fontSize: 14, borderRadius: T.rPill,
                               background: on ? T.accent : T.surface2, color: on ? "#fff" : T.inkSoft, border: `1px solid ${T.line}` }}>
                <Fish species={c.species} fill={c.fill} mark={c.mark} scale={0.2} />{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* catch of the day */}
      <div style={{ margin: `12px ${gutter}px`, background: T.surface, borderRadius: T.rCard, border: `1px solid ${T.line}`, boxShadow: T.shSm, overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: `1px solid ${T.line}` }}>
          <h2 style={{ fontFamily: T.display, fontSize: narrow ? 20 : 28, fontWeight: 300, letterSpacing: "-0.01em" }}>Catch of the day</h2>
          <button onClick={() => setSeed((s) => s + 1)}
                  style={{ padding: "8px 20px", fontSize: 14, borderRadius: T.rPill, background: T.accentSoft, color: T.ink }}>recast</button>
        </div>
        {daily.length ? (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))`, padding: 16 }}>
            {daily.map((n) => {
              const c = catOf(n.cat);
              return (
                <button key={n.id} onClick={() => setOpenId(n.id)} className="text-left"
                        style={{ background: T.surface2, borderRadius: T.rCard, border: `1px solid ${T.line}`, padding: 14 }}>
                  <div className="flex items-center gap-2">
                    <Fish species={c.species} fill={c.fill} mark={c.mark} scale={0.2} />
                    <span style={{ fontSize: 12, fontFamily: T.mono, color: T.accent }}>{daysIdle(n)}D</span>
                  </div>
                  <h3 style={{ marginTop: 6, fontFamily: T.display, fontSize: 20, color: T.ink }}>{n.title}</h3>
                  <p style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: T.inkSoft }}>{n.body}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ padding: 20, fontSize: 14, color: T.inkSoft }}>Nothing has been down there long enough. Come back in a week.</p>
        )}
      </div>

      {/* pond */}
      <div ref={pondRef} onClick={tapWater} className="relative flex-1 overflow-hidden"
           style={{ margin: `0 ${gutter}px ${gutter}px`, borderRadius: T.rCard,
                    background: `linear-gradient(180deg, ${T.w1} 0%, ${T.w2} 55%, ${T.w3} 100%)` }}>
        <LilyPads />
        <div className="absolute inset-0" style={{ pointerEvents: "none", boxShadow: "inset 0 0 80px rgba(40,80,85,0.12)" }} />
        {ripples.map((r) => (
          <span key={r.id} className="absolute rounded-full animate-ping"
                style={{ left: r.x - 28, top: r.y - 28, width: 56, height: 56, border: "1px solid rgba(255,255,255,0.9)", pointerEvents: "none" }} />
        ))}
        {notes.map((n) => {
          const c = catOf(n.cat), dim = !visible.has(n.id);
          return (
            <button key={n.id} ref={(el) => (nodes.current[n.id] = el)}
                    onClick={(e) => { e.stopPropagation(); if (!dim) setOpenId(n.id); }}
                    className="absolute" style={{ pointerEvents: dim ? "none" : "auto", lineHeight: 0, filter: `drop-shadow(${T.shSm})` }}
                    aria-label={n.title}>
              <span className="relative block">
                <Fish species={c.species} fill={c.fill} mark={c.mark} scale={sizeOf(n)} dim={dim} layer={layerOf(n.id)} />
                {hasBoard(n) && !dim && <span className="absolute rounded-full" style={{ right: 6, top: -5, width: 6, height: 6, background: "#fff" }} />}
              </span>
            </button>
          );
        })}
        <button onClick={(e) => { e.stopPropagation(); setWriting(true); setTimeout(() => inputRef.current?.focus(), 20); }}
                className="absolute flex items-center justify-center"
                style={{ right: 24, bottom: 24, width: 72, height: 72, borderRadius: T.rPill, background: T.accent, boxShadow: T.shLg }}
                aria-label="Write a note">
          <Ico d={I.plus} size={30} color="#fff" />
        </button>
        <p className="absolute" style={{ left: 24, bottom: 34, fontSize: 12, fontFamily: T.mono, color: T.inkSoft }}>TAP THE WATER TO RECAST</p>
      </div>

      {/* capture */}
      {writing && (
        <div className="absolute inset-0 flex flex-col justify-end" style={{ background: "rgba(25,45,45,0.32)" }}>
          <div style={{ padding: 24, background: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
                      placeholder="what just popped?"
                      style={{ width: "100%", fontSize: 16, lineHeight: 1.6, background: "transparent", border: "none", outline: "none", resize: "none", color: T.ink }} />
            <div className="flex gap-2 overflow-x-auto" style={{ padding: "10px 0" }}>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setDraftCat(c.id)}
                        style={{ flexShrink: 0, padding: "8px 16px", fontSize: 14, borderRadius: T.rPill,
                                 background: draftCat === c.id ? T.accent : T.surface2, color: draftCat === c.id ? "#fff" : T.inkSoft, border: `1px solid ${T.line}` }}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center" style={{ paddingTop: 6 }}>
              <button onClick={() => setWriting(false)} style={{ fontSize: 14, color: T.inkSoft }}>Close</button>
              <div className="flex gap-2">
                <button onClick={() => save(true)} style={{ padding: "10px 18px", fontSize: 14, borderRadius: T.rPill, border: `1px solid ${T.line}`, color: T.ink }}>Open it</button>
                <button onClick={() => save(false)} style={{ padding: "10px 26px", fontSize: 14, borderRadius: T.rPill, background: T.accent, color: "#fff" }}>Release</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openNote && (
        <Editor note={openNote} narrow={narrow}
                onChange={(n) => setNotes((v) => v.map((x) => (x.id === n.id ? n : x)))}
                onActed={markActed} onDelete={remove} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
