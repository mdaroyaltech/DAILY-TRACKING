import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

const toINR = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(n || 0);

const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

function fuzzyScore(query, target) {
    if (!query || !target) return 0;
    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    if (t === q) return 100;
    if (t.startsWith(q)) return 90;
    if (t.includes(q)) return 80;
    if (q.length <= 20 && t.length <= 20) {
        const dist = levenshtein(q, t);
        const maxLen = Math.max(q.length, t.length);
        const similarity = 1 - dist / maxLen;
        if (similarity >= 0.6) return Math.round(similarity * 70);
    }
    const qChars = new Set(q.split(""));
    const tChars = new Set(t.split(""));
    const overlap = [...qChars].filter((c) => tChars.has(c)).length;
    const overlapScore = overlap / Math.max(qChars.size, tChars.size);
    return overlapScore >= 0.5 ? Math.round(overlapScore * 50) : 0;
}

function levenshtein(a, b) {
    const m = a.length,
        n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

function Highlight({ text, query }) {
    if (!query || !text) return <span>{text}</span>;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const idx = t.indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    return (
        <span>
            {text.slice(0, idx)}
            <mark
                style={{
                    background: "rgba(13,148,136,.18)",
                    color: "var(--teal)",
                    borderRadius: 3,
                    padding: "0 2px",
                    fontWeight: 700,
                }}
            >
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </span>
    );
}

function Pill({ label, value, color, bg }) {
    return (
        <div className="ps-pill">
            <span className="ps-pill-label">{label}</span>
            <span className="ps-pill-value" style={{ color }}>
                {value}
            </span>
        </div>
    );
}

function TxRow({ row, type, query, idx }) {
    const name = type === "expense" ? row.paid_to : row.service;
    const isExp = type === "expense";
    const extraInfo = !isExp
        ? [row.customer_name, row.given_to_whom].filter(Boolean).join(" · ")
        : null;
    return (
        <tr className="ps-tr" style={{ animationDelay: `${idx * 28}ms` }}>
            <td className="ps-td ps-td-date">{fmtDate(row.date)}</td>
            <td className="ps-td ps-td-name">
                <div className="ps-name-cell">
                    <span className="ps-name-text">
                        <Highlight text={name} query={query} />
                    </span>
                    {extraInfo && <span className="ps-name-extra">{extraInfo}</span>}
                </div>
            </td>
            <td className="ps-td ps-td-amount">
                <span
                    className="ps-amount"
                    style={{ color: isExp ? "var(--red)" : "var(--green)" }}
                >
                    {isExp ? "−" : "+"}
                    {toINR(row.amount)}
                </span>
                {!isExp && row.qty && row.rate_per_qty && (
                    <div className="ps-amount-sub">
                        {row.qty} × {toINR(row.rate_per_qty)}
                    </div>
                )}
            </td>
            <td className="ps-td ps-td-type">
                <span className={`ps-badge ${isExp ? "ps-badge-exp" : "ps-badge-inc"}`}>
                    {isExp ? "EXPENSE" : "INCOME"}
                </span>
            </td>
            <td className="ps-td ps-td-contact">
                {!isExp && row.customer_mobile ? (
                    <span className="ps-contact">📞 {row.customer_mobile}</span>
                ) : (
                    <span className="ps-contact-empty">—</span>
                )}
            </td>
        </tr>
    );
}

/* ─── Mobile card view for small screens ─── */
function TxCard({ row, type, query, idx }) {
    const name = type === "expense" ? row.paid_to : row.service;
    const isExp = type === "expense";
    const extraInfo = !isExp
        ? [row.customer_name, row.given_to_whom].filter(Boolean).join(" · ")
        : null;
    return (
        <div className="ps-card" style={{ animationDelay: `${idx * 28}ms` }}>
            <div className="ps-card-top">
                <div className="ps-card-left">
                    <div className="ps-card-name">
                        <Highlight text={name} query={query} />
                    </div>
                    {extraInfo && <div className="ps-card-extra">{extraInfo}</div>}
                    <div className="ps-card-date">{fmtDate(row.date)}</div>
                </div>
                <div className="ps-card-right">
                    <div
                        className="ps-card-amount"
                        style={{ color: isExp ? "var(--red)" : "var(--green)" }}
                    >
                        {isExp ? "−" : "+"}
                        {toINR(row.amount)}
                    </div>
                    {!isExp && row.qty && row.rate_per_qty && (
                        <div className="ps-card-rate">
                            {row.qty} × {toINR(row.rate_per_qty)}
                        </div>
                    )}
                    <span
                        className={`ps-badge ${isExp ? "ps-badge-exp" : "ps-badge-inc"}`}
                        style={{ marginTop: 4 }}
                    >
                        {isExp ? "EXPENSE" : "INCOME"}
                    </span>
                </div>
            </div>
            {!isExp && row.customer_mobile && (
                <div className="ps-card-contact">📞 {row.customer_mobile}</div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════ */
export default function PersonSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [allExpenses, setAllExpenses] = useState([]);
    const [allIncome, setAllIncome] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSug, setShowSug] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");

    const inputRef = useRef(null);
    const sugRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError("");
            try {
                const [
                    { data: expData, error: expErr },
                    { data: incData, error: incErr },
                ] = await Promise.all([
                    supabase
                        .from("expense")
                        .select("id, date, amount, paid_to")
                        .order("date", { ascending: false }),
                    supabase
                        .from("income")
                        .select(
                            "id, date, amount, service, given_to_whom, customer_name, customer_mobile, qty, rate_per_qty"
                        )
                        .order("date", { ascending: false }),
                ]);
                if (expErr) throw expErr;
                if (incErr) throw incErr;
                setAllExpenses(expData || []);
                setAllIncome(incData || []);
            } catch (e) {
                console.error("Supabase error:", e);
                setError(
                    `Failed to load: ${e?.message || "Check Supabase connection and RLS policies."}`
                );
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(query), 280);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const allNames = useMemo(() => {
        const expNames = [
            ...new Set(allExpenses.map((r) => r.paid_to).filter(Boolean)),
        ];
        const incNames = [
            ...new Set(allIncome.map((r) => r.service).filter(Boolean)),
        ];
        return [...new Set([...expNames, ...incNames])].sort();
    }, [allExpenses, allIncome]);

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            setShowSug(false);
            return;
        }
        const scored = allNames
            .map((name) => ({ name, score: fuzzyScore(query, name) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((x) => x.name);
        setSuggestions(scored);
        setShowSug(scored.length > 0);
    }, [query, allNames]);

    useEffect(() => {
        function handler(e) {
            if (
                sugRef.current &&
                !sugRef.current.contains(e.target) &&
                e.target !== inputRef.current
            )
                setShowSug(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const SCORE_THRESHOLD = 40;

    const sortFn = (a, b) => {
        if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
        if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
        if (sortBy === "amount_desc") return b.amount - a.amount;
        if (sortBy === "amount_asc") return a.amount - b.amount;
        return 0;
    };

    const matchedExpenses = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return allExpenses
            .filter((r) => fuzzyScore(debouncedQuery, r.paid_to) >= SCORE_THRESHOLD)
            .sort(sortFn);
    }, [debouncedQuery, allExpenses, sortBy]);

    const matchedIncome = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return allIncome
            .filter(
                (r) =>
                    fuzzyScore(debouncedQuery, r.service) >= SCORE_THRESHOLD ||
                    fuzzyScore(debouncedQuery, r.customer_name) >= SCORE_THRESHOLD ||
                    fuzzyScore(debouncedQuery, r.given_to_whom) >= SCORE_THRESHOLD
            )
            .sort(sortFn);
    }, [debouncedQuery, allIncome, sortBy]);

    const totalExp = matchedExpenses.reduce(
        (s, r) => s + (Number(r.amount) || 0),
        0
    );
    const totalInc = matchedIncome.reduce(
        (s, r) => s + (Number(r.amount) || 0),
        0
    );
    const net = totalInc - totalExp;

    const displayedRows = useMemo(() => {
        if (activeTab === "expense")
            return matchedExpenses.map((r) => ({ ...r, _type: "expense" }));
        if (activeTab === "income")
            return matchedIncome.map((r) => ({ ...r, _type: "income" }));
        return [
            ...matchedExpenses.map((r) => ({ ...r, _type: "expense" })),
            ...matchedIncome.map((r) => ({ ...r, _type: "income" })),
        ].sort(sortFn);
    }, [activeTab, matchedExpenses, matchedIncome, sortBy]);

    const hasResults = debouncedQuery.trim().length > 0;
    const hasAny = matchedExpenses.length > 0 || matchedIncome.length > 0;
    const uniqueExpNames = [
        ...new Set(matchedExpenses.map((r) => r.paid_to).filter(Boolean)),
    ];
    const uniqueIncNames = [
        ...new Set(matchedIncome.map((r) => r.service).filter(Boolean)),
    ];

    /* ─── CSS ─── */
    const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg:        #f5f2ed;
  --bg2:       #ede9e2;
  --surface:   #ffffff;
  --surface2:  #faf8f5;
  --border:    #e2dcd4;
  --border2:   #d0c9be;
  --text:      #1c1a17;
  --text-med:  #5a5449;
  --text-dim:  #9a9187;
  --text-faint:#c4bdb4;
  --teal:      #0d9488;
  --teal-light:#e0f2f0;
  --teal-mid:  #99d6d0;
  --green:     #16a34a;
  --green-bg:  #dcfce7;
  --red:       #dc2626;
  --red-bg:    #fee2e2;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.ps-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ── ANIMATIONS ── */
@keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes rowSlide { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
@keyframes skel     { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes sugIn    { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

/* ══════════════════════
   HEADER
══════════════════════ */
.ps-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 28px 0 24px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
  animation: fadeIn .4s ease both;
  position: relative;
  z-index: 1;
}
.ps-header-inner {
  max-width: 1000px;
  margin: auto;
  padding: 0 24px;
}
.ps-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.ps-eyebrow::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 2px;
  background: var(--teal);
  border-radius: 2px;
}
.ps-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 900;
  line-height: 1.1;
  color: var(--text);
  margin-bottom: 22px;
}
.ps-title em { font-style: italic; color: var(--teal); }

/* ── SEARCH BOX ── */
.ps-search-wrap {
  /* KEY FIX: position:relative scopes the dropdown to this element */
  position: relative;
  max-width: 560px;
  /* z-index ensures dropdown floats above everything below */
  z-index: 200;
}
.ps-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-dim);
  pointer-events: none;
  z-index: 1;
}
.ps-search-input {
  width: 100%;
  height: 52px;
  padding: 0 48px 0 48px;
  border-radius: 14px;
  border: 2px solid var(--border2);
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 1;
}
.ps-search-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px rgba(13,148,136,.12);
}
.ps-search-input::placeholder { color: var(--text-faint); font-weight: 400; }

.ps-clear-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  transition: background .15s, color .15s;
  z-index: 2;
}
.ps-clear-btn:hover { background: var(--red-bg); color: var(--red); }

/* ══════════════════════════════════════════════
   DROPDOWN — KEY FIX: position absolute, high z-index
   Positioned relative to .ps-search-wrap
══════════════════════════════════════════════ */
.ps-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  z-index: 9999;           /* always on top */
  overflow: hidden;
  animation: sugIn .18s ease both;
  /* NO pointer-events interference with parent content */
}
.ps-sug-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  transition: background .12s;
  font-weight: 500;
}
.ps-sug-item:last-child { border-bottom: none; }
.ps-sug-item:hover { background: var(--teal-light); }
.ps-sug-hint {
  font-size: 10px;
  color: var(--text-faint);
  margin-left: auto;
  font-weight: 500;
  letter-spacing: .04em;
}

/* ── DATA INFO ROW ── */
.ps-data-info {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ps-data-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border2);
}

/* ══════════════════════
   MAIN WRAP
══════════════════════ */
.ps-wrap {
  max-width: 1000px;
  margin: auto;
  padding: 0 24px;
  /* IMPORTANT: no z-index here — dropdown from header floats above naturally */
}
@media(max-width: 480px) { .ps-wrap { padding: 0 14px; } }

/* ── IDLE STATE ── */
.ps-idle {
  text-align: center;
  padding: 72px 24px;
  animation: fadeIn .4s ease both;
}
.ps-idle-icon { font-size: 52px; margin-bottom: 16px; display: block; }
.ps-idle-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.ps-idle-sub {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.7;
}

/* ── SUMMARY PILLS ── */
.ps-summary {
  display: grid;
  /* Responsive: 5 pills on wide, wraps on narrow */
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
  animation: fadeUp .35s ease both;
}
.ps-pill {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: box-shadow .2s, transform .2s;
}
.ps-pill:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.ps-pill-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.ps-pill-value {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  /* color set via inline style */
}
@media(max-width: 480px) {
  .ps-summary { grid-template-columns: repeat(2, 1fr); }
  .ps-pill-value { font-size: 16px; }
}

/* ── MATCHED NAME CHIPS ── */
.ps-names-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  animation: fadeUp .38s ease .05s both;
}
.ps-names-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-dim);
  flex-shrink: 0;
}
.ps-name-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: 20px;
  background: var(--teal-light);
  color: var(--teal);
  border: 1.5px solid var(--teal-mid);
  cursor: pointer;
  transition: background .15s, transform .12s;
  white-space: nowrap;
  max-width: calc(100% - 70px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ps-name-chip:hover { background: var(--teal-mid); transform: translateY(-1px); }
.ps-name-chip.red {
  background: var(--red-bg);
  color: var(--red);
  border-color: #fca5a5;
}
.ps-name-chip.red:hover { background: #fca5a5; }

/* ── TOOLBAR ── */
.ps-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  animation: fadeUp .4s ease .08s both;
}
.ps-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg2);
  padding: 4px;
  border-radius: 10px;
  flex-wrap: wrap;
}
.ps-tab {
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  color: var(--text-dim);
  background: transparent;
  transition: background .15s, color .15s, box-shadow .15s;
  letter-spacing: .03em;
  white-space: nowrap;
}
.ps-tab.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
.ps-tab.active.exp { color: var(--red); }
.ps-tab.active.inc { color: var(--green); }

.ps-sort-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ps-sort-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-dim);
  white-space: nowrap;
}
.ps-select {
  background: var(--bg2);
  border: 1.5px solid var(--border2);
  border-radius: 8px;
  padding: 7px 28px 7px 10px;
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  color: var(--text);
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  max-width: 180px;
}
.ps-select:focus { border-color: var(--teal); }

@media(max-width: 560px) {
  .ps-toolbar { flex-direction: column; align-items: flex-start; }
  .ps-sort-wrap { width: 100%; }
  .ps-select { flex: 1; max-width: 100%; }
  .ps-tabs { width: 100%; }
  .ps-tab { flex: 1; text-align: center; padding: 7px 8px; font-size: 11px; }
}

/* ── COUNT BADGE ── */
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
  background: var(--teal-light);
  color: var(--teal);
  margin-left: 5px;
  vertical-align: middle;
}

/* ══════════════════════
   TABLE (desktop ≥ 600px)
══════════════════════ */
.ps-table-wrap {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  animation: fadeUp .42s ease .1s both;
}
.ps-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 520px;
}
.ps-table thead th {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 10px 16px;
  text-align: left;
  background: var(--bg2);
  border-bottom: 1.5px solid var(--border);
  white-space: nowrap;
}
.ps-table thead th.right { text-align: right; }
.ps-tr {
  animation: rowSlide .25s ease both;
  border-bottom: 1px solid var(--border);
  transition: background .1s;
}
.ps-tr:last-child { border-bottom: none; }
.ps-tr:hover { background: var(--surface2); }
.ps-td { padding: 11px 16px; vertical-align: middle; }
.ps-td-date { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
.ps-td-name {}
.ps-td-amount { text-align: right; }
.ps-td-type {}
.ps-td-contact { font-size: 11px; color: var(--text-dim); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ps-name-cell { display: flex; flex-direction: column; gap: 2px; }
.ps-name-text { font-weight: 600; font-size: 13px; }
.ps-name-extra { font-size: 11px; color: var(--text-dim); font-weight: 400; }

.ps-amount {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.ps-amount-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

.ps-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: .06em;
  white-space: nowrap;
}
.ps-badge-exp { background: var(--red-bg); color: var(--red); }
.ps-badge-inc { background: var(--green-bg); color: var(--green); }

.ps-contact {}
.ps-contact-empty { color: var(--text-faint); }

/* hide table on mobile, show cards */
@media(max-width: 599px) { .ps-table-desktop { display: none; } }
@media(min-width: 600px) { .ps-cards-mobile { display: none; } }

/* ══════════════════════
   MOBILE CARD LIST
══════════════════════ */
.ps-cards-list { display: flex; flex-direction: column; gap: 0; }
.ps-card {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  animation: rowSlide .25s ease both;
  transition: background .1s;
}
.ps-card:last-child { border-bottom: none; }
.ps-card:hover { background: var(--surface2); }
.ps-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ps-card-left { flex: 1; min-width: 0; }
.ps-card-right { flex-shrink: 0; text-align: right; }
.ps-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.ps-card-extra {
  font-size: 11px;
  color: var(--text-dim);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-card-date { font-size: 11px; color: var(--text-faint); }
.ps-card-amount {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 4px;
}
.ps-card-rate { font-size: 10px; color: var(--text-dim); margin-bottom: 4px; }
.ps-card-contact {
  margin-top: 8px;
  font-size: 11px;
  color: var(--teal);
  font-weight: 500;
}

/* ── TABLE FOOTER ── */
.ps-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface2);
  border-top: 1.5px solid var(--border);
  font-size: 12px;
  color: var(--text-dim);
  flex-wrap: wrap;
  gap: 8px;
}
.ps-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ps-footer-sep { color: var(--border2); }

/* ── NO RESULTS ── */
.ps-no-results {
  text-align: center;
  padding: 48px 16px;
  font-size: 14px;
  color: var(--text-dim);
  animation: fadeIn .3s ease both;
}

/* ── SKELETON ── */
.skel {
  display: block;
  border-radius: 6px;
  background: var(--border);
  animation: skel 1.4s ease infinite;
}

/* ── SCROLL HINT (mobile) ── */
.ps-scroll-hint {
  display: none;
  font-size: 10px;
  color: var(--text-dim);
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
  text-align: center;
  letter-spacing: .05em;
}
@media(max-width: 700px) { .ps-scroll-hint { display: block; } }
`;

    return (
        <>
            <style>{CSS}</style>
            <Navbar />
            <div className="ps-root">

                {/* ── HEADER ── */}
                <div className="ps-header">
                    <div className="ps-header-inner">
                        <div className="ps-eyebrow">Person Search</div>
                        <h1 className="ps-title">
                            Search by <em>Name</em>
                        </h1>

                        {/* Search with dropdown scoped inside this relative wrapper */}
                        <div className="ps-search-wrap">
                            <svg
                                className="ps-search-icon"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>

                            <input
                                ref={inputRef}
                                className="ps-search-input"
                                type="text"
                                placeholder="Type a name… (e.g. Sadhik, Sadik, Raj)"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowSug(true);
                                }}
                                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                                autoComplete="off"
                                spellCheck={false}
                            />

                            {query && (
                                <button
                                    className="ps-clear-btn"
                                    onClick={() => {
                                        setQuery("");
                                        setDebouncedQuery("");
                                        setSuggestions([]);
                                        setShowSug(false);
                                        inputRef.current?.focus();
                                    }}
                                    aria-label="Clear search"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* DROPDOWN — scoped inside .ps-search-wrap, z-index:9999 */}
                            {showSug && suggestions.length > 0 && (
                                <div className="ps-suggestions" ref={sugRef}>
                                    {suggestions.map((name) => (
                                        <div
                                            key={name}
                                            className="ps-sug-item"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setQuery(name);
                                                setDebouncedQuery(name);
                                                setShowSug(false);
                                            }}
                                        >
                                            <span>👤</span>
                                            <Highlight text={name} query={query} />
                                            <span className="ps-sug-hint">Select →</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Loading skeleton */}
                        {loading && (
                            <div
                                style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}
                            >
                                {[120, 90, 70].map((w, i) => (
                                    <span key={i} className="skel" style={{ width: w, height: 11 }} />
                                ))}
                            </div>
                        )}

                        {/* Data info */}
                        {!loading && !error && (
                            <div className="ps-data-info">
                                <span>📂</span>
                                <span>
                                    <strong style={{ color: "var(--text)" }}>
                                        {allExpenses.length.toLocaleString()}
                                    </strong>{" "}
                                    expenses
                                </span>
                                <span className="ps-data-dot" />
                                <span>
                                    <strong style={{ color: "var(--text)" }}>
                                        {allIncome.length.toLocaleString()}
                                    </strong>{" "}
                                    income records loaded
                                </span>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div
                                style={{
                                    marginTop: 10,
                                    fontSize: 12,
                                    color: "var(--red)",
                                    background: "var(--red-bg)",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #fca5a5",
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="ps-wrap">

                    {/* Idle state */}
                    {!hasResults && (
                        <div className="ps-idle">
                            <span className="ps-idle-icon">🔍</span>
                            <div className="ps-idle-title">Search for anyone</div>
                            <div className="ps-idle-sub">
                                Type a name to find matching expenses or income.
                                <br />
                                Fuzzy search —{" "}
                                <strong>Sadhik, Sadik, Shadik</strong> will all match.
                            </div>
                        </div>
                    )}

                    {hasResults && (
                        <>
                            {/* Summary pills */}
                            {hasAny && (
                                <div className="ps-summary">
                                    <div className="ps-pill">
                                        <span className="ps-pill-label">Expenses</span>
                                        <span className="ps-pill-value" style={{ color: "var(--red)" }}>
                                            {matchedExpenses.length}
                                        </span>
                                    </div>
                                    <div className="ps-pill">
                                        <span className="ps-pill-label">Total Spent</span>
                                        <span className="ps-pill-value" style={{ color: "var(--red)" }}>
                                            {toINR(totalExp)}
                                        </span>
                                    </div>
                                    <div className="ps-pill">
                                        <span className="ps-pill-label">Income</span>
                                        <span className="ps-pill-value" style={{ color: "var(--green)" }}>
                                            {matchedIncome.length}
                                        </span>
                                    </div>
                                    <div className="ps-pill">
                                        <span className="ps-pill-label">Total Received</span>
                                        <span className="ps-pill-value" style={{ color: "var(--green)" }}>
                                            {toINR(totalInc)}
                                        </span>
                                    </div>
                                    <div className="ps-pill">
                                        <span className="ps-pill-label">Net Balance</span>
                                        <span
                                            className="ps-pill-value"
                                            style={{ color: net >= 0 ? "var(--teal)" : "var(--red)" }}
                                        >
                                            {(net >= 0 ? "+" : "") + toINR(net)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Matched name chips */}
                            {(uniqueExpNames.length > 0 || uniqueIncNames.length > 0) && (
                                <div className="ps-names-bar">
                                    <span className="ps-names-label">Matched</span>
                                    {uniqueExpNames.map((n) => (
                                        <span
                                            key={`e-${n}`}
                                            className="ps-name-chip red"
                                            title={n}
                                            onClick={() => {
                                                setQuery(n);
                                                setDebouncedQuery(n);
                                            }}
                                        >
                                            💸 {n}
                                        </span>
                                    ))}
                                    {uniqueIncNames.map((n) => (
                                        <span
                                            key={`i-${n}`}
                                            className="ps-name-chip"
                                            title={n}
                                            onClick={() => {
                                                setQuery(n);
                                                setDebouncedQuery(n);
                                            }}
                                        >
                                            💰 {n}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Toolbar */}
                            {hasAny && (
                                <div className="ps-toolbar">
                                    <div className="ps-tabs">
                                        <button
                                            className={`ps-tab${activeTab === "all" ? " active" : ""}`}
                                            onClick={() => setActiveTab("all")}
                                        >
                                            All
                                            <span className="count-badge">
                                                {matchedExpenses.length + matchedIncome.length}
                                            </span>
                                        </button>
                                        <button
                                            className={`ps-tab${activeTab === "expense" ? " active exp" : ""}`}
                                            onClick={() => setActiveTab("expense")}
                                        >
                                            Expenses
                                            <span
                                                className="count-badge"
                                                style={{ background: "var(--red-bg)", color: "var(--red)" }}
                                            >
                                                {matchedExpenses.length}
                                            </span>
                                        </button>
                                        <button
                                            className={`ps-tab${activeTab === "income" ? " active inc" : ""}`}
                                            onClick={() => setActiveTab("income")}
                                        >
                                            Income
                                            <span
                                                className="count-badge"
                                                style={{
                                                    background: "var(--green-bg)",
                                                    color: "var(--green)",
                                                }}
                                            >
                                                {matchedIncome.length}
                                            </span>
                                        </button>
                                    </div>

                                    <div className="ps-sort-wrap">
                                        <span className="ps-sort-label">Sort</span>
                                        <select
                                            className="ps-select"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="date_desc">Date ↓ Newest</option>
                                            <option value="date_asc">Date ↑ Oldest</option>
                                            <option value="amount_desc">Amount ↓ High</option>
                                            <option value="amount_asc">Amount ↑ Low</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* No results */}
                            {!hasAny && (
                                <div className="ps-no-results">
                                    No results for{" "}
                                    <strong style={{ color: "var(--text)" }}>
                                        "{debouncedQuery}"
                                    </strong>
                                </div>
                            )}

                            {/* Results table + cards */}
                            {hasAny && displayedRows.length > 0 && (
                                <div className="ps-table-wrap">

                                    {/* ── DESKTOP TABLE ── */}
                                    <div className="ps-table-desktop">
                                        <div className="ps-table-scroll">
                                            <table className="ps-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Name</th>
                                                        <th className="right">Amount</th>
                                                        <th>Type</th>
                                                        <th>Contact</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {displayedRows.map((row, i) => (
                                                        <TxRow
                                                            key={`${row._type}-${row.id}`}
                                                            row={row}
                                                            type={row._type}
                                                            query={debouncedQuery}
                                                            idx={i}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* ── MOBILE CARD LIST ── */}
                                    <div className="ps-cards-mobile">
                                        <div className="ps-cards-list">
                                            {displayedRows.map((row, i) => (
                                                <TxCard
                                                    key={`${row._type}-${row.id}`}
                                                    row={row}
                                                    type={row._type}
                                                    query={debouncedQuery}
                                                    idx={i}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="ps-table-footer">
                                        <span>
                                            <strong>{displayedRows.length}</strong> transactions
                                            {debouncedQuery && (
                                                <>
                                                    {" "}
                                                    for{" "}
                                                    <strong>"{debouncedQuery}"</strong>
                                                </>
                                            )}
                                        </span>
                                        <div className="ps-footer-right">
                                            {activeTab !== "income" && matchedExpenses.length > 0 && (
                                                <span style={{ color: "var(--red)" }}>
                                                    Spent:{" "}
                                                    <strong>{toINR(totalExp)}</strong>
                                                </span>
                                            )}
                                            {activeTab === "all" &&
                                                matchedExpenses.length > 0 &&
                                                matchedIncome.length > 0 && (
                                                    <span className="ps-footer-sep">|</span>
                                                )}
                                            {activeTab !== "expense" && matchedIncome.length > 0 && (
                                                <span style={{ color: "var(--green)" }}>
                                                    Received:{" "}
                                                    <strong>{toINR(totalInc)}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}