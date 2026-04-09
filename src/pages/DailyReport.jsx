import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ── STYLES ───────────────────────────────────────────────── */
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
  --amber:     #b45309;
  --amber-bg:  #fef3c7;
  --blue:      #1d4ed8;
  --blue-bg:   #dbeafe;
  --purple:    #7c3aed;
  --purple-bg: #ede9fe;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.dr-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ── HEADER ── */
.dr-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 28px 0 22px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
}
.dr-header-inner {
  max-width: 1100px; margin: auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.dr-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--teal); margin-bottom: 5px; display: flex; align-items: center; gap: 7px;
}
.dr-eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:var(--teal); border-radius:2px; }
.dr-title { font-family:'Playfair Display',serif; font-size:clamp(22px,3vw,32px); font-weight:900; line-height:1.1; color:var(--text); }
.dr-title em { font-style:italic; color:var(--teal); }

.dr-date-wrap { display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
.dr-date-label { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--text-dim); }
.dr-date-input {
  background:var(--bg2); border:1.5px solid var(--border2); border-radius:8px;
  padding:9px 14px; font-size:14px; font-family:'DM Sans',sans-serif; font-weight:500;
  color:var(--text); outline:none; transition:border-color .2s, box-shadow .2s; min-width:160px;
}
.dr-date-input:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(13,148,136,0.1); background:var(--surface); }

/* ── LAYOUT ── */
.dr-wrap { max-width:1100px; margin:auto; padding:0 24px; }
@media(max-width:480px){ .dr-wrap{padding:0 14px;} }

/* ── SECTION TITLE ── */
.section-title {
  font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--text);
  margin-bottom:14px; display:flex; align-items:center; gap:10px;
}
.section-title::after { content:''; flex:1; height:1.5px; background:var(--border); border-radius:2px; }

/* ── EMPTY STATE ── */
.dr-empty { text-align:center; padding:60px 24px; color:var(--text-dim); }
.dr-empty-icon { font-size:44px; margin-bottom:14px; display:block; }
.dr-empty-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--text-med); margin-bottom:6px; }
.dr-empty-sub { font-size:13px; font-weight:300; color:var(--text-dim); }

/* ── STAT CARDS ── */
.stats-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px; }
.stats-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px; }
@media(max-width:640px){ .stats-grid-3{grid-template-columns:1fr 1fr;} }
@media(max-width:380px){ .stats-grid-3{grid-template-columns:1fr;} }
@media(max-width:700px){ .stats-grid-4{grid-template-columns:repeat(2,1fr);} }

.stat-card { background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:18px 20px; position:relative; overflow:hidden; box-shadow:var(--shadow-sm); transition:transform .2s,box-shadow .2s; }
.stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.stat-card-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
.accent-green  { background:var(--green); }
.accent-red    { background:var(--red); }
.accent-teal   { background:var(--teal); }
.accent-amber  { background:var(--amber); }
.accent-blue   { background:var(--blue); }
.accent-purple { background:var(--purple); }
.stat-icon-bg { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-bottom:12px; }
.stat-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:5px; }
.stat-value { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; line-height:1; }
.stat-value.sm     { font-size:22px; }
.stat-value.green  { color:var(--green); }
.stat-value.red    { color:var(--red); }
.stat-value.teal   { color:var(--teal); }
.stat-value.amber  { color:var(--amber); }
.stat-value.blue   { color:var(--blue); }
.stat-value.purple { color:var(--purple); }

/* ── FORMS TABS ── */
.forms-tabs {
  display:flex; background:var(--surface); border:1.5px solid var(--border);
  border-radius:12px 12px 0 0; overflow:hidden; margin-bottom:0;
}
.forms-tab {
  flex:1; padding:12px 8px; font-size:11px; font-weight:600; letter-spacing:.08em;
  text-transform:uppercase; text-align:center; cursor:pointer;
  border:none; font-family:'DM Sans',sans-serif; color:var(--text-dim);
  background:transparent; transition:all .18s;
  border-right:1.5px solid var(--border);
}
.forms-tab:last-child { border-right:none; }
.forms-tab.active { background:var(--teal-light); color:var(--teal); }
.forms-tab:hover:not(.active) { color:var(--text-med); background:var(--surface2); }
@media(max-width:480px){ .forms-tab{font-size:10px; padding:10px 4px;} }

.form-panel {
  background:var(--surface); border:1.5px solid var(--border); border-top:none;
  border-radius:0 0 12px 12px; padding:22px; margin-bottom:32px;
}
@media(max-width:480px){ .form-panel{padding:16px;} }

/* ── INCOME MODE TOGGLE ── */
.income-mode-row {
  display:flex; gap:0; background:var(--bg2); border:1.5px solid var(--border);
  border-radius:8px; overflow:hidden; margin-bottom:16px; width:fit-content;
}
.income-mode-btn {
  padding:7px 18px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  cursor:pointer; border:none; font-family:'DM Sans',sans-serif;
  color:var(--text-dim); background:transparent; transition:all .18s;
}
.income-mode-btn.active { background:var(--teal); color:#fff; }
.income-mode-btn:hover:not(.active) { color:var(--text-med); }

/* ── FIELDS ── */
.field-wrap { margin-bottom:12px; }
.field-label { display:block; font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-med); margin-bottom:5px; }

.db-input, .db-select {
  width:100%; background:var(--bg2); border:1.5px solid var(--border); border-radius:8px;
  padding:10px 13px; font-size:14px; font-family:'DM Sans',sans-serif;
  color:var(--text); outline:none;
  transition:border-color .2s, background .2s, box-shadow .2s;
  appearance:none; -webkit-appearance:none;
}
.db-input::placeholder { color:var(--text-faint); }
.db-input:focus, .db-select:focus { border-color:var(--teal); background:var(--surface); box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
.db-select option { color:var(--text); }

.qty-rate-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.qty-rate-row .field-wrap { margin-bottom:0; }

.auto-amount-box {
  background:var(--teal-light); border:1.5px solid var(--teal-mid);
  border-radius:8px; padding:10px 14px;
  display:flex; align-items:center; justify-content:space-between; margin:12px 0;
}
.auto-amount-label { font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); }
.auto-amount-value { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--teal); }

/* ── BUTTONS ── */
.btn { width:100%; padding:12px; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:all .18s; margin-top:4px; }
.btn:hover { opacity:.88; transform:translateY(-1px); box-shadow:var(--shadow); }
.btn:active { transform:translateY(0); box-shadow:none; }
.btn-green { background:var(--green); color:#fff; }
.btn-red   { background:var(--red);   color:#fff; }
.btn:disabled { opacity:.35; cursor:not-allowed; transform:none !important; }

/* ── MANAGE OPTIONS ── */
.manage-opts-btn { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif; margin-bottom:10px; transition:opacity .15s; }
.manage-opts-btn:hover { opacity:.7; }
.manage-opts-panel { background:var(--bg2); border:1.5px solid var(--border); border-radius:10px; padding:14px; margin-bottom:12px; }
.manage-opts-list { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:12px; }
.opt-pill { display:flex; align-items:center; gap:5px; background:var(--surface); border:1.5px solid var(--border); border-radius:20px; padding:4px 10px 4px 12px; font-size:11px; font-weight:600; color:var(--text-med); }
.opt-pill-del { background:none; border:none; cursor:pointer; padding:2px; border-radius:50%; color:var(--text-faint); display:flex; transition:all .15s; }
.opt-pill-del:hover { color:var(--red); background:var(--red-bg); }

.svc-add-row { display:grid; grid-template-columns:1fr 80px auto; gap:7px; align-items:center; }
@media(max-width:400px){ .svc-add-row{grid-template-columns:1fr 65px auto;} }
.manage-opts-input { background:var(--surface); border:1.5px solid var(--border); border-radius:8px; padding:8px 11px; font-size:13px; font-family:'DM Sans',sans-serif; color:var(--text); outline:none; transition:border-color .2s; width:100%; }
.manage-opts-input:focus { border-color:var(--teal); }
.manage-opts-save { padding:8px 12px; background:var(--teal); color:#fff; border:none; border-radius:8px; font-size:11px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; transition:opacity .15s; }
.manage-opts-save:hover { opacity:.85; }
.manage-opts-save:disabled { opacity:.4; cursor:not-allowed; }

.opt-pill-rate { font-size:9px; font-weight:600; color:var(--green); background:var(--green-bg); padding:1px 6px; border-radius:6px; margin-left:2px; }
.opt-pill-edit-btn { background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:4px; color:var(--text-faint); display:flex; align-items:center; transition:all .15s; }
.opt-pill-edit-btn:hover { color:var(--teal); background:var(--teal-light); }
.opt-pill-editing { border-color:var(--teal) !important; background:var(--teal-light) !important; flex-wrap:wrap; gap:6px 8px; }
.opt-pill-edit-inputs { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.opt-pill-input { background:var(--surface); border:1.5px solid var(--teal-mid); border-radius:5px; padding:3px 7px; font-size:11px; font-family:'DM Sans',sans-serif; color:var(--text); outline:none; }
.opt-pill-input:focus { border-color:var(--teal); }
.opt-pill-input.name-input { width:110px; }
.opt-pill-input.rate-input { width:65px; }
.opt-pill-save { background:var(--teal); color:#fff; border:none; border-radius:5px; padding:3px 9px; font-size:10px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; }
.opt-pill-cancel { background:var(--bg2); color:var(--text-dim); border:1.5px solid var(--border); border-radius:5px; padding:3px 7px; font-size:10px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }

/* ── CHART ── */
.chart-card { background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:24px; margin-bottom:32px; box-shadow:var(--shadow-sm); }

/* ── COLLAPSE HEADER ── */
.collapse-header {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--surface); border:1.5px solid var(--border);
  border-radius:12px; padding:14px 18px;
  cursor:pointer; user-select:none;
  transition:background .18s, border-radius .2s;
  box-shadow:var(--shadow-sm);
}
.collapse-header.open { border-radius:12px 12px 0 0; border-bottom:none; }
.collapse-header:hover { background:var(--surface2); }
.ch-left { display:flex; align-items:center; gap:10px; }
.ch-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.ch-icon.income  { background:var(--green-bg); }
.ch-icon.expense { background:var(--red-bg); }
.ch-title { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:var(--text); }
.ch-count { font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--text-dim); margin-top:2px; }
.ch-right { display:flex; align-items:center; gap:14px; }
.ch-total { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; }
.ch-total.green { color:var(--green); }
.ch-total.red   { color:var(--red); }
.ch-chevron { width:20px; height:20px; transition:transform .25s; color:var(--text-dim); flex-shrink:0; }
.ch-chevron.open { transform:rotate(180deg); }

/* ── COLLAPSE BODY ── */
.collapse-body {
  background:var(--surface); border:1.5px solid var(--border); border-top:none;
  border-radius:0 0 12px 12px; overflow:hidden;
  max-height:0; transition:max-height .35s ease;
  box-shadow:var(--shadow-sm);
}
.collapse-body.open { max-height:3000px; }

/* ── TABLES ── */
.table-scroll-hint { display:none; font-size:10px; color:var(--text-dim); padding:8px 14px 0; text-align:center; letter-spacing:.05em; }
@media(max-width:580px){ .table-scroll-hint { display:block; } }
.table-inner { overflow-x:auto; padding:0 2px; }

.db-table { width:100%; border-collapse:collapse; font-size:13px; min-width:420px; }
.db-table th { font-size:9px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--text-dim); padding:9px 14px; text-align:left; background:var(--bg2); border-bottom:1.5px solid var(--border); white-space:nowrap; }
.db-table th:first-child { border-radius:7px 0 0 7px; }
.db-table th:last-child  { border-radius:0 7px 7px 0; }
.db-table th.right  { text-align:right; }
.db-table th.center { text-align:center; }
.db-table td { padding:11px 14px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
.db-table td.right  { text-align:right; }
.db-table td.center { text-align:center; }
.db-table tr:last-child td { border-bottom:none; }
.db-table tr:hover td { background:var(--surface2); }

.badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:12px; font-size:10px; font-weight:600; letter-spacing:.05em; }
.badge-income  { background:var(--green-bg); color:var(--green); }
.badge-expense { background:var(--red-bg);   color:var(--red); }
.badge-manual  { background:var(--purple-bg); color:var(--purple); }

.edit-input { background:var(--bg2); border:1.5px solid var(--teal); border-radius:6px; padding:5px 8px; width:90px; text-align:right; color:var(--text); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
.edit-trigger { display:inline-flex; align-items:center; gap:5px; cursor:pointer; color:var(--text); font-weight:500; }
.edit-trigger:hover { color:var(--teal); }
.edit-icon { width:12px; height:12px; color:var(--text-dim); }
.edit-trigger:hover .edit-icon { color:var(--teal); }
.del-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:6px; color:var(--text-faint); transition:all .18s; display:inline-flex; }
.del-btn:hover { color:var(--red); background:var(--red-bg); }

.loading-text, .empty-text { text-align:center; color:var(--text-dim); padding:36px; font-size:13px; letter-spacing:.04em; }

/* ── TABLE TOTALS ── */
.table-totals-row td { background:var(--bg2) !important; border-top:2px solid var(--border2) !important; font-weight:700 !important; padding:11px 14px !important; }
.totals-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }

/* ── COMPARE ARROWS ── */
.stat-compare { display:flex; align-items:center; gap:4px; margin-top:6px; font-size:11px; font-weight:600; }
.compare-up   { color:var(--green); }
.compare-down { color:var(--red); }
.compare-same { color:var(--text-dim); }

/* ── WHATSAPP COPY ── */
.wa-copy-btn {
  display:inline-flex; align-items:center; gap:8px;
  background:linear-gradient(135deg,#25d366,#128c7e);
  color:#fff; border:none; border-radius:10px;
  padding:10px 18px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  cursor:pointer; transition:all .2s; box-shadow:0 2px 10px rgba(37,211,102,0.3);
}
.wa-copy-btn:hover { opacity:.88; transform:translateY(-1px); }
.wa-copy-btn.copied { background:linear-gradient(135deg,#16a34a,#0d9488); }
.wa-btn-row { display:flex; justify-content:flex-end; padding:12px 14px 0; }

/* ── SECTION WRAP ── */
.section-wrap { margin-bottom:16px; }

@media(max-width:640px){
  .dr-header { padding:16px 0 12px; margin-bottom:18px; }
  .stat-card { padding:14px 16px; }
  .stat-value { font-size:22px !important; }
  .stat-value.sm { font-size:18px !important; }
  .stat-icon-bg { width:30px; height:30px; font-size:14px; margin-bottom:8px; }
  .chart-card { padding:16px; }
  .collapse-header { padding:12px 14px; }
  .ch-title { font-size:14px; }
  .ch-total { font-size:16px; }
}
`;

/* ═══════════════════════════════════════════════════════════ */
export default function DailyReport() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeForm, setActiveForm] = useState("income");
  const [prevIncomeTotal, setPrevIncomeTotal] = useState(0);
  const [prevExpenseTotal, setPrevExpenseTotal] = useState(0);
  const [waCopied, setWaCopied] = useState(false);

  /* ── COLLAPSE STATE ── */
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(true);

  /* ── SERVICE OPTIONS ── */
  const [serviceOptions, setServiceOptions] = useState([]);
  const [showManageSvc, setShowManageSvc] = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcRate, setNewSvcRate] = useState("");
  const [svcLoading, setSvcLoading] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [editSvcName, setEditSvcName] = useState("");
  const [editSvcRate, setEditSvcRate] = useState("");

  const fetchServices = async () => {
    const { data, error } = await supabase.from("service_options").select("*").order("created_at", { ascending: true });
    if (error) { console.error(error.message); return; }
    setServiceOptions(data || []);
  };
  const addService = async () => {
    const name = newSvcName.trim(); const rate = Number(newSvcRate);
    if (!name || !rate || rate <= 0) return;
    if (serviceOptions.find(o => o.name.toLowerCase() === name.toLowerCase())) { alert("Already exists!"); return; }
    setSvcLoading(true);
    const { error } = await supabase.from("service_options").insert([{ name, rate_per_qty: rate }]);
    if (error) { alert(error.message); setSvcLoading(false); return; }
    setNewSvcName(""); setNewSvcRate(""); await fetchServices(); setSvcLoading(false);
  };
  const removeService = async (opt) => {
    if (!window.confirm(`Remove "${opt.name}"?`)) return;
    setSvcLoading(true);
    await supabase.from("service_options").delete().eq("id", opt.id);
    await fetchServices(); setSvcLoading(false);
  };
  const updateService = async (opt) => {
    const name = editSvcName.trim(); const rate = Number(editSvcRate);
    if (!name || !rate || rate <= 0) return;
    setSvcLoading(true);
    const { error } = await supabase.from("service_options").update({ name, rate_per_qty: rate }).eq("id", opt.id);
    if (error) { alert(error.message); setSvcLoading(false); return; }
    if (selectedService === opt.name) { setSelectedService(name); setRatePerQty(String(rate)); }
    setEditingSvcId(null); await fetchServices(); setSvcLoading(false);
  };

  /* ── PAID-TO OPTIONS ── */
  const DEFAULT_PAID_TO = ["PACHAIYAPPAN FIN", "SAI FIN", "SOTTA FIN", "SPF FIN", "BHAVANI FIN", "JANA SETTIYAR"];
  const [paidToOptions, setPaidToOptions] = useState([]);
  const [showManageOpts, setShowManageOpts] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [optLoading, setOptLoading] = useState(false);
  const [customPaidTo, setCustomPaidTo] = useState("");

  const fetchOptions = async () => {
    const { data, error } = await supabase.from("paid_to_options").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) { setPaidToOptions(DEFAULT_PAID_TO.map(n => ({ name: n }))); }
    else { setPaidToOptions(data); }
  };
  const addOption = async () => {
    const name = newOptionName.trim().toUpperCase();
    if (!name) return;
    if (paidToOptions.find(o => o.name === name)) { alert("Already exists!"); return; }
    setOptLoading(true);
    const { error } = await supabase.from("paid_to_options").insert([{ name }]);
    if (error) { alert(error.message); setOptLoading(false); return; }
    setNewOptionName(""); await fetchOptions(); setOptLoading(false);
  };
  const removeOption = async (opt) => {
    if (!window.confirm(`Remove "${opt.name}"?`)) return;
    setOptLoading(true);
    if (opt.id) await supabase.from("paid_to_options").delete().eq("id", opt.id);
    await fetchOptions(); setOptLoading(false);
  };
  const PAID_TO_OPTIONS = [...paidToOptions.map(o => o.name), "Others"];

  /* ── INCOME FORM ── */
  const [incomeMode, setIncomeMode] = useState("service");
  const [selectedService, setSelectedService] = useState("");
  const [ratePerQty, setRatePerQty] = useState("");
  const [qty, setQty] = useState(1);
  const computedAmount = ratePerQty && qty ? Math.round(Number(ratePerQty) * Number(qty)) : 0;
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const handleServiceChange = (svcName) => {
    setSelectedService(svcName);
    const found = serviceOptions.find(s => s.name === svcName);
    setRatePerQty(found ? String(found.rate_per_qty) : ""); setQty(1);
  };

  /* ── EXPENSE FORM ── */
  const [expenseForm, setExpenseForm] = useState({ paid_to: "", amount: "" });

  /* ── FETCH DATA ── */
  const fetchData = async () => {
    if (!date) return;
    setLoading(true);
    const prevDate = new Date(date); prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split("T")[0];
    const [{ data: inc }, { data: exp }, { data: prevInc }, { data: prevExp }] = await Promise.all([
      supabase.from("income").select("*").eq("date", date).order("created_at", { ascending: false }),
      supabase.from("expense").select("*").eq("date", date).order("created_at", { ascending: false }),
      supabase.from("income").select("amount").eq("date", prevDateStr),
      supabase.from("expense").select("amount").eq("date", prevDateStr),
    ]);
    setIncomes(inc || []); setExpenses(exp || []);
    setPrevIncomeTotal((prevInc || []).reduce((s, i) => s + i.amount, 0));
    setPrevExpenseTotal((prevExp || []).reduce((s, e) => s + e.amount, 0));
    setLoading(false);
  };

  useEffect(() => { fetchData(); fetchOptions(); fetchServices(); }, [date]);

  /* ── ADD SERVICE INCOME ── */
  const addServiceIncome = async () => {
    if (!selectedService || !computedAmount) return;
    const { error } = await supabase.from("income").insert([{
      date, service: selectedService, amount: computedAmount,
      qty: Number(qty), rate_per_qty: Number(ratePerQty),
    }]);
    if (error) { alert(error.message); return; }
    setSelectedService(""); setRatePerQty(""); setQty(1); fetchData();
  };

  /* ── ADD MANUAL INCOME ── */
  const addManualIncome = async () => {
    const desc = manualDesc.trim(); const amount = Number(manualAmount);
    if (!desc || !amount || amount <= 0) return;
    const { error } = await supabase.from("income").insert([{ date, service: desc, amount }]);
    if (error) { alert(error.message); return; }
    setManualDesc(""); setManualAmount(""); fetchData();
  };

  /* ── ADD EXPENSE ── */
  const addExpense = async () => {
    let paidTo = expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;
    if (!paidTo || !expenseForm.amount) return;
    const { error } = await supabase.from("expense").insert([{ date, paid_to: paidTo, amount: Number(expenseForm.amount) }]);
    if (error) { alert(error.message); return; }
    setExpenseForm({ paid_to: "", amount: "" }); setCustomPaidTo(""); fetchData();
  };

  /* ── UPDATE / DELETE ── */
  const updateAmount = async (table, id, amount) => {
    await supabase.from(table).update({ amount: Number(amount) }).eq("id", id);
    setEditing(null); fetchData();
  };
  const deleteRow = async (table, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id); fetchData();
  };

  /* ── TOTALS ── */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const hasData = incomes.length > 0 || expenses.length > 0;
  const fmt = (n) => (n || 0).toLocaleString("en-IN");

  /* ── COMPARE HELPERS ── */
  const compareArrow = (curr, prev) => {
    if (prev === 0 && curr === 0) return null;
    const diff = curr - prev;
    const pct = prev === 0 ? 100 : Math.abs((diff / prev) * 100);
    if (diff > 0) return <span className="stat-compare compare-up">▲ {pct.toFixed(0)}% vs prev day</span>;
    if (diff < 0) return <span className="stat-compare compare-down">▼ {pct.toFixed(0)}% vs prev day</span>;
    return <span className="stat-compare compare-same">= same as prev day</span>;
  };

  /* ── WHATSAPP COPY ── */
  const copyWhatsApp = () => {
    const dateStr = new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    let lines = [
      `📊 *Daily Report — ${dateStr}*`, ``,
      `💰 *Income:* ₹${fmt(totalIncome)}`,
      `💸 *Expense:* ₹${fmt(totalExpense)}`,
      `🧮 *Balance:* ₹${fmt(balance)}`,
    ];
    if (incomes.length) { lines.push(``, `*Income:*`); incomes.forEach(i => lines.push(`  • ${i.service}  — ₹${fmt(i.amount)}`)); }
    if (expenses.length) { lines.push(``, `*Expenses:*`); expenses.forEach(e => lines.push(`  • ${e.paid_to} — ₹${fmt(e.amount)}`)); }
    navigator.clipboard.writeText(lines.join("\n")).then(() => { setWaCopied(true); setTimeout(() => setWaCopied(false), 2500); });
  };

  const pieData = [
    { name: "Expense", value: totalExpense },
    { name: "Balance", value: Math.max(0, balance) },
  ];
  const PIE_COLORS = ["#dc2626", "#0d9488"];

  /* ── RENDER ── */
  return (
    <>
      <style>{CSS}</style>
      <Navbar />
      <div className="dr-root">

        {/* HEADER */}
        <div className="dr-header">
          <div className="dr-header-inner">
            <div>
              <div className="dr-eyebrow">Daily Report</div>
              <h1 className="dr-title">View & manage <em>transactions</em></h1>
            </div>
            <div className="dr-date-wrap">
              <label className="dr-date-label">Select Date</label>
              <input type="date" className="dr-date-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="dr-wrap">

          {!date && (
            <div className="dr-empty">
              <span className="dr-empty-icon">📅</span>
              <div className="dr-empty-title">Select a date to begin</div>
              <div className="dr-empty-sub">Choose a date above to view or add transactions</div>
            </div>
          )}

          {date && (
            <>
              {/* ── STAT CARDS ── */}
              <div className="stats-grid-3" style={{ marginBottom: 28 }}>
                <StatCard label="Total Income" value={fmt(totalIncome)} valCls="green" accent="accent-green" icon="💰" iconBg="#dcfce7" compare={compareArrow(totalIncome, prevIncomeTotal)} />
                <StatCard label="Total Expense" value={fmt(totalExpense)} valCls="red" accent="accent-red" icon="💸" iconBg="#fee2e2" compare={compareArrow(totalExpense, prevExpenseTotal)} />
                <StatCard label="Balance" value={fmt(balance)} valCls={balance >= 0 ? "teal" : "red"} accent={balance >= 0 ? "accent-teal" : "accent-red"} icon="🧮" iconBg="#e0f2f0" compare={compareArrow(balance, prevIncomeTotal - prevExpenseTotal)} />
              </div>

              {/* ── QUICK ENTRY — TABBED ── */}
              <p className="section-title">Quick Entry</p>
              <div className="forms-tabs">
                {[
                  { key: "income", label: "➕ Add Income" },
                  { key: "expense", label: "➖ Add Expense" },
                ].map(t => (
                  <button key={t.key} className={`forms-tab${activeForm === t.key ? " active" : ""}`} onClick={() => setActiveForm(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── INCOME PANEL ── */}
              {activeForm === "income" && (
                <div className="form-panel">
                  <div className="income-mode-row">
                    <button className={`income-mode-btn${incomeMode === "service" ? " active" : ""}`} onClick={() => setIncomeMode("service")}>⚡ By Service</button>
                    <button className={`income-mode-btn${incomeMode === "manual" ? " active" : ""}`} onClick={() => setIncomeMode("manual")}>✏️ Manual</button>
                  </div>

                  {incomeMode === "service" && (
                    <>
                      <button className="manage-opts-btn" onClick={() => setShowManageSvc(p => !p)}>
                        ⚙️ {showManageSvc ? "Hide" : "Manage"} Services
                      </button>
                      {showManageSvc && (
                        <div className="manage-opts-panel">
                          <div className="manage-opts-list">
                            {serviceOptions.map(opt => (
                              <div className={`opt-pill${editingSvcId === opt.id ? " opt-pill-editing" : ""}`} key={opt.id}>
                                {editingSvcId === opt.id ? (
                                  <div className="opt-pill-edit-inputs">
                                    <input className="opt-pill-input name-input" value={editSvcName}
                                      onChange={e => setEditSvcName(e.target.value)}
                                      onKeyDown={e => { if (e.key === "Enter") updateService(opt); if (e.key === "Escape") setEditingSvcId(null); }}
                                      autoFocus disabled={svcLoading} placeholder="Service name" />
                                    <input className="opt-pill-input rate-input" type="number" value={editSvcRate}
                                      onChange={e => setEditSvcRate(e.target.value)}
                                      onKeyDown={e => { if (e.key === "Enter") updateService(opt); if (e.key === "Escape") setEditingSvcId(null); }}
                                      disabled={svcLoading} placeholder="₹/qty" />
                                    <button className="opt-pill-save" onClick={() => updateService(opt)} disabled={svcLoading}>{svcLoading ? "…" : "Save"}</button>
                                    <button className="opt-pill-cancel" onClick={() => setEditingSvcId(null)} disabled={svcLoading}>Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    {opt.name}
                                    <span className="opt-pill-rate">₹{opt.rate_per_qty}/qty</span>
                                    <button className="opt-pill-edit-btn" title="Edit" disabled={svcLoading}
                                      onClick={() => { setEditingSvcId(opt.id); setEditSvcName(opt.name); setEditSvcRate(String(opt.rate_per_qty)); }}>
                                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                        <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                                      </svg>
                                    </button>
                                    <button className="opt-pill-del" onClick={() => removeService(opt)} disabled={svcLoading}>
                                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="svc-add-row">
                            <input className="manage-opts-input" placeholder="Service name" value={newSvcName}
                              onChange={e => setNewSvcName(e.target.value)} onKeyDown={e => e.key === "Enter" && addService()} disabled={svcLoading} />
                            <input className="manage-opts-input" type="number" placeholder="₹/qty" value={newSvcRate}
                              onChange={e => setNewSvcRate(e.target.value)} onKeyDown={e => e.key === "Enter" && addService()} disabled={svcLoading} />
                            <button className="manage-opts-save" onClick={addService} disabled={svcLoading}>{svcLoading ? "…" : "+ Add"}</button>
                          </div>
                        </div>
                      )}

                      <div className="field-wrap">
                        <label className="field-label">Service / Work</label>
                        <select className="db-select" value={selectedService} onChange={e => handleServiceChange(e.target.value)}>
                          <option value="">Select Service</option>
                          {serviceOptions.map(s => (
                            <option key={s.id} value={s.name}>{s.name} — ₹{s.rate_per_qty}/qty</option>
                          ))}
                        </select>
                      </div>
                      <div className="qty-rate-row">
                        <div className="field-wrap">
                          <label className="field-label" style={{ color: !selectedService ? "var(--text-faint)" : undefined }}>Qty</label>
                          <input className="db-input" type="number" min="1"
                            placeholder={selectedService ? "Enter qty" : "—"}
                            value={qty} disabled={!selectedService} onChange={e => setQty(e.target.value)}
                            style={{ opacity: !selectedService ? 0.4 : 1, cursor: !selectedService ? "not-allowed" : "text" }} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label" style={{ color: !selectedService ? "var(--text-faint)" : undefined }}>Rate / qty (₹)</label>
                          <input className="db-input" type="number" placeholder="₹" value={ratePerQty}
                            disabled={!selectedService} onChange={e => setRatePerQty(e.target.value)}
                            style={{ opacity: !selectedService ? 0.4 : 1, cursor: !selectedService ? "not-allowed" : "text" }} />
                        </div>
                      </div>
                      {computedAmount > 0 && (
                        <div className="auto-amount-box">
                          <span className="auto-amount-label">{qty} × ₹{ratePerQty} =</span>
                          <span className="auto-amount-value">₹{fmt(computedAmount)}</span>
                        </div>
                      )}
                      <button className="btn btn-green" onClick={addServiceIncome} disabled={!selectedService || !computedAmount}>
                        Save Income
                      </button>
                    </>
                  )}

                  {incomeMode === "manual" && (
                    <>
                      <div className="field-wrap">
                        <label className="field-label">Description / Source</label>
                        <input className="db-input" placeholder="e.g. Cash received, Commission…"
                          value={manualDesc} onChange={e => setManualDesc(e.target.value)} />
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Amount (₹)</label>
                        <input className="db-input" type="number" placeholder="0"
                          value={manualAmount} onChange={e => setManualAmount(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addManualIncome()} />
                      </div>
                      <button className="btn btn-green" onClick={addManualIncome}
                        disabled={!manualDesc.trim() || !manualAmount || Number(manualAmount) <= 0}>
                        Save Manual Income
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── EXPENSE PANEL ── */}
              {activeForm === "expense" && (
                <div className="form-panel">
                  <div className="field-wrap">
                    <label className="field-label">Paid To</label>
                    <button className="manage-opts-btn" onClick={() => setShowManageOpts(p => !p)}>
                      ⚙️ {showManageOpts ? "Hide" : "Manage"} Options
                    </button>
                    {showManageOpts && (
                      <div className="manage-opts-panel">
                        <div className="manage-opts-list">
                          {paidToOptions.map(opt => (
                            <div className="opt-pill" key={opt.id || opt.name}>
                              {opt.name}
                              <button className="opt-pill-del" onClick={() => removeOption(opt)} disabled={optLoading}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input className="manage-opts-input" placeholder="e.g. RAJAN FIN" value={newOptionName}
                            onChange={e => setNewOptionName(e.target.value)} onKeyDown={e => e.key === "Enter" && addOption()} disabled={optLoading} />
                          <button className="manage-opts-save" onClick={addOption} disabled={optLoading}>{optLoading ? "..." : "+ Add"}</button>
                        </div>
                      </div>
                    )}
                    <select className="db-select" value={expenseForm.paid_to}
                      onChange={e => { setExpenseForm({ ...expenseForm, paid_to: e.target.value }); if (e.target.value !== "Others") setCustomPaidTo(""); }}>
                      <option value="">Select Paid To</option>
                      {PAID_TO_OPTIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  {expenseForm.paid_to === "Others" && (
                    <div className="field-wrap">
                      <label className="field-label">Custom Name</label>
                      <input className="db-input" placeholder="Enter name" value={customPaidTo} onChange={e => setCustomPaidTo(e.target.value)} />
                    </div>
                  )}
                  <div className="field-wrap">
                    <label className="field-label">Amount (₹)</label>
                    <input className="db-input" type="number" placeholder="0" value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                  </div>
                  <button className="btn btn-red" onClick={addExpense}>Save Expense</button>
                </div>
              )}

              {/* ── PIE CHART ── */}
              {hasData && (
                <div className="chart-card">
                  <p className="section-title">Daily Overview</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={95} innerRadius={45} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: "10px", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                        formatter={v => [`₹${fmt(v)}`, ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans", color: "#9a9187", paddingTop: 14 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ════════════════════════════════════════════
                  ── INCOME TABLE (COLLAPSIBLE) ──
              ════════════════════════════════════════════ */}
              <p className="section-title">Transactions</p>

              {/* WhatsApp button row */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button className={`wa-copy-btn${waCopied ? " copied" : ""}`} onClick={copyWhatsApp}>
                  {waCopied ? "✅ Copied!" : "📋 Copy for WhatsApp"}
                </button>
              </div>

              {/* Income section */}
              <div className="section-wrap">
                {/* Header */}
                <div
                  className={`collapse-header${incomeOpen ? " open" : ""}`}
                  onClick={() => setIncomeOpen(p => !p)}
                >
                  <div className="ch-left">
                    <div className="ch-icon income">💰</div>
                    <div>
                      <div className="ch-title">Income</div>
                      <div className="ch-count">{incomes.length} {incomes.length === 1 ? "entry" : "entries"}</div>
                    </div>
                  </div>
                  <div className="ch-right">
                    <div className="ch-total green">₹{fmt(totalIncome)}</div>
                    <svg className={`ch-chevron${incomeOpen ? " open" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Body */}
                <div className={`collapse-body${incomeOpen ? " open" : ""}`}>
                  <span className="table-scroll-hint">← scroll to see all columns →</span>
                  <div className="table-inner">
                    {loading ? (
                      <div className="loading-text">Loading…</div>
                    ) : incomes.length === 0 ? (
                      <div className="empty-text">No income entries for {date}</div>
                    ) : (
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Service / Description</th>
                            <th className="center">Qty</th>
                            <th className="right">Rate</th>
                            <th className="right">Amount</th>
                            <th className="center">Del</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomes.map(row => (
                            <tr key={row.id}>
                              <td>
                                <div style={{ fontWeight: 500 }}>{row.service}</div>
                                {!row.qty && (
                                  <span className="badge badge-manual" style={{ marginTop: 4, display: "inline-flex" }}>Manual</span>
                                )}
                                {row.rate_per_qty && (
                                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>₹{row.rate_per_qty}/qty</div>
                                )}
                              </td>
                              <td className="center" style={{ fontWeight: 600, color: "var(--text-med)" }}>
                                {row.qty || "—"}
                              </td>
                              <td className="right" style={{ color: "var(--text-med)" }}>
                                {row.rate_per_qty ? `₹${row.rate_per_qty}` : "—"}
                              </td>
                              <td className="right">
                                {editing === `income-${row.id}` ? (
                                  <input
                                    className="edit-input"
                                    type="number"
                                    defaultValue={row.amount}
                                    autoFocus
                                    onBlur={e => updateAmount("income", row.id, e.target.value)}
                                  />
                                ) : (
                                  <span className="edit-trigger" onClick={() => setEditing(`income-${row.id}`)}>
                                    <span style={{ fontWeight: 600 }}>₹{fmt(row.amount)}</span>
                                    <svg className="edit-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                                    </svg>
                                  </span>
                                )}
                              </td>
                              <td className="center">
                                <button className="del-btn" onClick={() => deleteRow("income", row.id)}>
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-totals-row">
                            <td colSpan={3}><span className="totals-label">Income Total</span></td>
                            <td className="right">
                              <span style={{ color: "var(--green)", fontFamily: "Playfair Display,serif", fontSize: 15 }}>
                                +₹{fmt(totalIncome)}
                              </span>
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  ── EXPENSE TABLE (COLLAPSIBLE) ──
              ════════════════════════════════════════════ */}
              <div className="section-wrap">
                {/* Header */}
                <div
                  className={`collapse-header${expenseOpen ? " open" : ""}`}
                  onClick={() => setExpenseOpen(p => !p)}
                >
                  <div className="ch-left">
                    <div className="ch-icon expense">💸</div>
                    <div>
                      <div className="ch-title">Expenses</div>
                      <div className="ch-count">{expenses.length} {expenses.length === 1 ? "entry" : "entries"}</div>
                    </div>
                  </div>
                  <div className="ch-right">
                    <div className="ch-total red">₹{fmt(totalExpense)}</div>
                    <svg className={`ch-chevron${expenseOpen ? " open" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Body */}
                <div className={`collapse-body${expenseOpen ? " open" : ""}`}>
                  <span className="table-scroll-hint">← scroll to see all columns →</span>
                  <div className="table-inner">
                    {loading ? (
                      <div className="loading-text">Loading…</div>
                    ) : expenses.length === 0 ? (
                      <div className="empty-text">No expense entries for {date}</div>
                    ) : (
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Paid To</th>
                            <th className="right">Amount</th>
                            <th className="center">Del</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map(row => (
                            <tr key={row.id}>
                              <td style={{ fontWeight: 500 }}>{row.paid_to}</td>
                              <td className="right">
                                {editing === `expense-${row.id}` ? (
                                  <input
                                    className="edit-input"
                                    type="number"
                                    defaultValue={row.amount}
                                    autoFocus
                                    onBlur={e => updateAmount("expense", row.id, e.target.value)}
                                  />
                                ) : (
                                  <span className="edit-trigger" onClick={() => setEditing(`expense-${row.id}`)}>
                                    <span style={{ fontWeight: 600 }}>₹{fmt(row.amount)}</span>
                                    <svg className="edit-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                                    </svg>
                                  </span>
                                )}
                              </td>
                              <td className="center">
                                <button className="del-btn" onClick={() => deleteRow("expense", row.id)}>
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-totals-row">
                            <td><span className="totals-label">Expense Total</span></td>
                            <td className="right">
                              <span style={{ color: "var(--red)", fontFamily: "Playfair Display,serif", fontSize: 15 }}>
                                −₹{fmt(totalExpense)}
                              </span>
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* ── BALANCE SUMMARY ── */}
              {hasData && (
                <div style={{
                  background: "var(--surface)", border: "1.5px solid var(--border)",
                  borderRadius: 12, padding: "14px 18px", marginBottom: 20,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 10, boxShadow: "var(--shadow-sm)"
                }}>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 3 }}>Income</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>+₹{fmt(totalIncome)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 3 }}>Expense</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--red)" }}>−₹{fmt(totalExpense)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 3 }}>Balance</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: balance >= 0 ? "var(--teal)" : "var(--red)" }}>
                      ₹{fmt(balance)}
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

/* ── STAT CARD ── */
const StatCard = ({ label, value, valCls, accent, icon, iconBg, small, compare }) => (
  <div className="stat-card">
    <div className={`stat-card-accent ${accent}`} />
    <div className="stat-icon-bg" style={{ background: iconBg }}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${valCls}${small ? " sm" : ""}`}>₹{value}</div>
    {compare || null}
  </div>
);