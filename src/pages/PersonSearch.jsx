import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

const toINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
    const overlap = [...qChars].filter(c => tChars.has(c)).length;
    const overlapScore = overlap / Math.max(qChars.size, tChars.size);
    return overlapScore >= 0.5 ? Math.round(overlapScore * 50) : 0;
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
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
            <mark style={{ background: "rgba(13,148,136,.22)", color: "var(--teal)", borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </span>
    );
}

function Pill({ label, value, color, bg }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: bg, borderRadius: 10, padding: "10px 16px", minWidth: 110 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)" }}>{label}</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color }}>{value}</span>
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
        <tr
            style={{ animation: `rowSlide .25s ease ${idx * 30}ms both`, borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
        >
            <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(row.date)}</td>
            <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>
                <Highlight text={name} query={query} />
                {extraInfo && (
                    <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, marginTop: 2 }}>{extraInfo}</div>
                )}
            </td>
            <td style={{ padding: "10px 16px", textAlign: "right" }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: isExp ? "var(--red)" : "var(--green)" }}>
                    {isExp ? "−" : "+"}{toINR(row.amount)}
                </span>
                {!isExp && row.qty && row.rate_per_qty && (
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{row.qty} × {toINR(row.rate_per_qty)}</div>
                )}
            </td>
            <td style={{ padding: "10px 16px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: isExp ? "var(--red-bg)" : "var(--green-bg)", color: isExp ? "var(--red)" : "var(--green)", letterSpacing: ".06em" }}>
                    {isExp ? "EXPENSE" : "INCOME"}
                </span>
            </td>
            <td style={{ padding: "10px 16px", fontSize: 11, color: "var(--text-dim)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {!isExp && row.customer_mobile ? `📞 ${row.customer_mobile}` : "—"}
            </td>
        </tr>
    );
}

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
                        .select("id, date, amount, service, given_to_whom, customer_name, customer_mobile, qty, rate_per_qty")
                        .order("date", { ascending: false }),
                ]);
                if (expErr) throw expErr;
                if (incErr) throw incErr;
                setAllExpenses(expData || []);
                setAllIncome(incData || []);
            } catch (e) {
                console.error("Supabase error:", e);
                setError(`Failed to load data: ${e?.message || "Check your Supabase connection and RLS policies."}`);
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
        const expNames = [...new Set(allExpenses.map(r => r.paid_to).filter(Boolean))];
        const incNames = [...new Set(allIncome.map(r => r.service).filter(Boolean))];
        return [...new Set([...expNames, ...incNames])].sort();
    }, [allExpenses, allIncome]);

    useEffect(() => {
        if (!query.trim() || query.length < 2) { setSuggestions([]); setShowSug(false); return; }
        const scored = allNames
            .map(name => ({ name, score: fuzzyScore(query, name) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(x => x.name);
        setSuggestions(scored);
        setShowSug(scored.length > 0);
    }, [query, allNames]);

    useEffect(() => {
        function handler(e) {
            if (sugRef.current && !sugRef.current.contains(e.target) && e.target !== inputRef.current)
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
        return allExpenses.filter(r => fuzzyScore(debouncedQuery, r.paid_to) >= SCORE_THRESHOLD).sort(sortFn);
    }, [debouncedQuery, allExpenses, sortBy]);

    const matchedIncome = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return allIncome.filter(r => fuzzyScore(debouncedQuery, r.service) >= SCORE_THRESHOLD ||
            fuzzyScore(debouncedQuery, r.customer_name) >= SCORE_THRESHOLD ||
            fuzzyScore(debouncedQuery, r.given_to_whom) >= SCORE_THRESHOLD
        ).sort(sortFn);
    }, [debouncedQuery, allIncome, sortBy]);

    const totalExp = matchedExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalInc = matchedIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const net = totalInc - totalExp;

    const displayedRows = useMemo(() => {
        if (activeTab === "expense") return matchedExpenses.map(r => ({ ...r, _type: "expense" }));
        if (activeTab === "income") return matchedIncome.map(r => ({ ...r, _type: "income" }));
        return [
            ...matchedExpenses.map(r => ({ ...r, _type: "expense" })),
            ...matchedIncome.map(r => ({ ...r, _type: "income" })),
        ].sort(sortFn);
    }, [activeTab, matchedExpenses, matchedIncome, sortBy]);

    const hasResults = debouncedQuery.trim().length > 0;
    const hasAny = matchedExpenses.length > 0 || matchedIncome.length > 0;
    const uniqueExpNames = [...new Set(matchedExpenses.map(r => r.paid_to).filter(Boolean))];
    const uniqueIncNames = [...new Set(matchedIncome.map(r => r.service).filter(Boolean))];

    const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
:root {
  --bg:#f5f2ed; --bg2:#ede9e2; --surface:#ffffff; --surface2:#faf8f5;
  --border:#e2dcd4; --border2:#d0c9be; --text:#1c1a17; --text-med:#5a5449;
  --text-dim:#9a9187; --text-faint:#c4bdb4; --teal:#0d9488;
  --teal-light:#e0f2f0; --teal-mid:#99d6d0; --green:#16a34a;
  --green-bg:#dcfce7; --red:#dc2626; --red-bg:#fee2e2;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --shadow:0 4px 16px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04);
}
*{box-sizing:border-box;margin:0;padding:0;}
.ps-root{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);padding-bottom:80px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes rowSlide{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes sugIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.ps-header{background:var(--surface);border-bottom:1px solid var(--border);padding:28px 0 22px;margin-bottom:28px;box-shadow:var(--shadow-sm);animation:fadeIn .45s ease both;}
.ps-header-inner{max-width:1000px;margin:auto;padding:0 24px;}
.ps-eyebrow{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:5px;display:flex;align-items:center;gap:7px;}
.ps-eyebrow::before{content:'';display:inline-block;width:18px;height:2px;background:var(--teal);border-radius:2px;}
.ps-title{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,32px);font-weight:900;line-height:1.1;color:var(--text);margin-bottom:22px;}
.ps-title em{font-style:italic;color:var(--teal);}
.ps-search-wrap{position:relative;max-width:560px;}
.ps-search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-dim);pointer-events:none;}
.ps-search-input{width:100%;height:52px;padding:0 48px 0 48px;border-radius:14px;border:2px solid var(--border2);background:var(--surface);color:var(--text);font-size:15px;font-family:'DM Sans',sans-serif;font-weight:500;outline:none;transition:border-color .2s,box-shadow .2s;box-shadow:var(--shadow-sm);}
.ps-search-input:focus{border-color:var(--teal);box-shadow:0 0 0 4px rgba(13,148,136,.12);}
.ps-search-input::placeholder{color:var(--text-faint);font-weight:400;}
.ps-clear-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:50%;background:var(--bg2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-dim);transition:background .15s,color .15s;}
.ps-clear-btn:hover{background:var(--red-bg);color:var(--red);}
.ps-suggestions{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;box-shadow:var(--shadow);z-index:100;overflow:hidden;animation:sugIn .18s ease both;}
.ps-sug-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background .12s;}
.ps-sug-item:last-child{border-bottom:none;}
.ps-sug-item:hover{background:var(--teal-light);}
.ps-sug-hint{font-size:10px;color:var(--text-faint);margin-left:auto;font-weight:500;}
.ps-wrap{max-width:1000px;margin:auto;padding:0 24px;}
@media(max-width:480px){.ps-wrap{padding:0 14px;}}
.ps-summary{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;animation:fadeUp .35s ease both;}
.ps-names-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;animation:fadeUp .38s ease .05s both;}
.ps-names-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);}
.ps-name-chip{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:var(--teal-light);color:var(--teal);border:1px solid var(--teal-mid);cursor:pointer;transition:background .15s,transform .12s;}
.ps-name-chip:hover{background:var(--teal-mid);transform:translateY(-1px);}
.ps-name-chip.red{background:var(--red-bg);color:var(--red);border-color:#fca5a5;}
.ps-name-chip.red:hover{background:#fca5a5;}
.ps-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;animation:fadeUp .4s ease .08s both;}
.ps-tabs{display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:10px;}
.ps-tab{padding:7px 16px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;color:var(--text-dim);background:transparent;transition:background .15s,color .15s,box-shadow .15s;letter-spacing:.03em;}
.ps-tab.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-sm);}
.ps-tab.active.exp{color:var(--red);}
.ps-tab.active.inc{color:var(--green);}
.ps-sort-wrap{display:flex;align-items:center;gap:8px;}
.ps-sort-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);}
.ps-select{background:var(--bg2);border:1.5px solid var(--border2);border-radius:8px;padding:7px 28px 7px 10px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;color:var(--text);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;}
.ps-select:focus{border-color:var(--teal);}
.ps-table-wrap{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow-sm);animation:fadeUp .42s ease .1s both;}
.ps-table{width:100%;border-collapse:collapse;font-size:13px;}
.ps-table thead th{font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);padding:10px 16px;text-align:left;background:var(--bg2);border-bottom:1.5px solid var(--border);white-space:nowrap;}
.ps-table thead th.right{text-align:right;}
.ps-table tbody tr{transition:background .1s;}
.skel{display:block;border-radius:6px;background:var(--border);animation:skel 1.4s ease infinite;}
.count-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-size:10px;font-weight:800;background:var(--teal-light);color:var(--teal);margin-left:6px;vertical-align:middle;}
.ps-idle{text-align:center;padding:64px 24px;animation:fadeIn .4s ease both;}
.ps-idle-icon{font-size:52px;margin-bottom:16px;display:block;}
.ps-idle-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px;}
.ps-idle-sub{font-size:13px;color:var(--text-dim);line-height:1.6;}
.ps-no-results{text-align:center;padding:48px 16px;font-size:14px;color:var(--text-dim);}
.ps-no-results strong{color:var(--text);}
.ps-table-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface2);border-top:1.5px solid var(--border);font-size:12px;color:var(--text-dim);flex-wrap:wrap;gap:8px;}
.ps-table-footer strong{color:var(--text);}
@media(max-width:640px){.ps-summary{gap:8px;}.ps-toolbar{flex-direction:column;align-items:flex-start;}.ps-sort-wrap{width:100%;justify-content:flex-start;}}
`;

    return (
        <>
            <style>{CSS}</style>
            <Navbar />
            <div className="ps-root">
                <div className="ps-header">
                    <div className="ps-header-inner">
                        <div className="ps-eyebrow">Person Search</div>
                        <h1 className="ps-title">Search by <em>Name</em></h1>
                        <div className="ps-search-wrap">
                            <svg className="ps-search-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                ref={inputRef}
                                className="ps-search-input"
                                type="text"
                                placeholder="Type a name… (e.g. Sadhik, Sadik, Raj)"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setShowSug(true); }}
                                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                                autoComplete="off"
                                spellCheck={false}
                            />
                            {query && (
                                <button className="ps-clear-btn" onClick={() => { setQuery(""); setDebouncedQuery(""); setSuggestions([]); setShowSug(false); }}>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            {showSug && suggestions.length > 0 && (
                                <div className="ps-suggestions" ref={sugRef}>
                                    {suggestions.map(name => (
                                        <div key={name} className="ps-sug-item"
                                            onMouseDown={e => { e.preventDefault(); setQuery(name); setDebouncedQuery(name); setShowSug(false); }}>
                                            <span>👤</span>
                                            <Highlight text={name} query={query} />
                                            <span className="ps-sug-hint">Select</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {loading && (
                            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                {[140, 100, 80].map((w, i) => <span key={i} className="skel" style={{ width: w, height: 12 }} />)}
                            </div>
                        )}
                        {!loading && !error && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)" }}>
                                📂 {allExpenses.length.toLocaleString()} expenses · {allIncome.length.toLocaleString()} income records loaded
                            </div>
                        )}
                        {error && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)", background: "var(--red-bg)", padding: "8px 12px", borderRadius: 8 }}>
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ps-wrap">
                    {!hasResults && (
                        <div className="ps-idle">
                            <span className="ps-idle-icon">🔍</span>
                            <div className="ps-idle-title">Search for anyone</div>
                            <div className="ps-idle-sub">
                                Type a name to find matching expenses or income.<br />
                                Fuzzy search — <strong>Sadhik, Sadik, Shadik</strong> will all match.
                            </div>
                        </div>
                    )}

                    {hasResults && (
                        <>
                            {hasAny && (
                                <div className="ps-summary">
                                    <Pill label="Expenses" value={matchedExpenses.length} color="var(--red)" bg="var(--red-bg)" />
                                    <Pill label="Total Spent" value={toINR(totalExp)} color="var(--red)" bg="var(--red-bg)" />
                                    <Pill label="Income" value={matchedIncome.length} color="var(--green)" bg="var(--green-bg)" />
                                    <Pill label="Total Received" value={toINR(totalInc)} color="var(--green)" bg="var(--green-bg)" />
                                    <Pill
                                        label="Net Balance"
                                        value={(net >= 0 ? "+" : "") + toINR(net)}
                                        color={net >= 0 ? "var(--teal)" : "var(--red)"}
                                        bg={net >= 0 ? "var(--teal-light)" : "var(--red-bg)"}
                                    />
                                </div>
                            )}

                            {(uniqueExpNames.length > 0 || uniqueIncNames.length > 0) && (
                                <div className="ps-names-bar">
                                    <span className="ps-names-label">Matched</span>
                                    {uniqueExpNames.map(n => (
                                        <span key={`e-${n}`} className="ps-name-chip red" onClick={() => { setQuery(n); setDebouncedQuery(n); }}>💸 {n}</span>
                                    ))}
                                    {uniqueIncNames.map(n => (
                                        <span key={`i-${n}`} className="ps-name-chip" onClick={() => { setQuery(n); setDebouncedQuery(n); }}>💰 {n}</span>
                                    ))}
                                </div>
                            )}

                            {hasAny && (
                                <div className="ps-toolbar">
                                    <div className="ps-tabs">
                                        <button className={`ps-tab${activeTab === "all" ? " active" : ""}`} onClick={() => setActiveTab("all")}>
                                            All <span className="count-badge">{matchedExpenses.length + matchedIncome.length}</span>
                                        </button>
                                        <button className={`ps-tab${activeTab === "expense" ? " active exp" : ""}`} onClick={() => setActiveTab("expense")}>
                                            Expenses <span className="count-badge" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{matchedExpenses.length}</span>
                                        </button>
                                        <button className={`ps-tab${activeTab === "income" ? " active inc" : ""}`} onClick={() => setActiveTab("income")}>
                                            Income <span className="count-badge" style={{ background: "var(--green-bg)", color: "var(--green)" }}>{matchedIncome.length}</span>
                                        </button>
                                    </div>
                                    <div className="ps-sort-wrap">
                                        <span className="ps-sort-label">Sort</span>
                                        <select className="ps-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                            <option value="date_desc">Date ↓ Newest first</option>
                                            <option value="date_asc">Date ↑ Oldest first</option>
                                            <option value="amount_desc">Amount ↓ Highest first</option>
                                            <option value="amount_asc">Amount ↑ Lowest first</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!hasAny && (
                                <div className="ps-no-results">
                                    No results found — no expenses or income match <strong>"{debouncedQuery}"</strong>
                                </div>
                            )}

                            {hasAny && displayedRows.length > 0 && (
                                <div className="ps-table-wrap">
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
                                                <TxRow key={`${row._type}-${row.id}`} row={row} type={row._type} query={debouncedQuery} idx={i} />
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="ps-table-footer">
                                        <span>
                                            <strong>{displayedRows.length}</strong> transactions
                                            {debouncedQuery && <> for <strong>"{debouncedQuery}"</strong></>}
                                        </span>
                                        <span>
                                            {activeTab !== "income" && matchedExpenses.length > 0 && (
                                                <span style={{ color: "var(--red)" }}>Total Spent: <strong>{toINR(totalExp)}</strong></span>
                                            )}
                                            {activeTab === "all" && matchedExpenses.length > 0 && matchedIncome.length > 0 &&
                                                <span style={{ margin: "0 8px", color: "var(--border2)" }}>|</span>}
                                            {activeTab !== "expense" && matchedIncome.length > 0 && (
                                                <span style={{ color: "var(--green)" }}>Total Received: <strong>{toINR(totalInc)}</strong></span>
                                            )}
                                        </span>
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