// CashBox.jsx — Cash Box (Home Savings) Page
// ✅ App Balance = TODAY's income − TODAY's expense (live daily balance)
// ✅ Colors match Dashboard exactly (teal/green/red palette, NO amber)
//
// Supabase table needed:
//   create table cash_box_transactions (
//     id uuid default gen_random_uuid() primary key,
//     type text not null check (type in ('deposit','expense')),
//     amount numeric not null,
//     date date not null,
//     category text,
//     note text,
//     created_at timestamptz default now()
//   );
//
// App.jsx:
//   import CashBox from "./pages/CashBox";
//   <Route path="/cashbox" element={loggedIn ? <CashBox /> : <Navigate to="/login" replace />} />
//
// Navbar desktop:
//   <NavLink to="/cashbox" className={({isActive})=>`nav-link${isActive?" active":""}`}>Cash Box</NavLink>
// Navbar mobile drawer array:
//   { to: "/cashbox", label: "Cash Box", icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></> }

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

/* ─────────────────────────────────────────────────────────────
   CSS — identical tokens & component patterns to Dashboard.jsx
   No amber overrides — pure teal / green / red Dashboard palette
───────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg:#f5f2ed; --bg2:#ede9e2; --surface:#ffffff; --surface2:#faf8f5;
  --border:#e2dcd4; --border2:#d0c9be;
  --text:#1c1a17; --text-med:#5a5449; --text-dim:#9a9187; --text-faint:#c4bdb4;
  --teal:#0d9488; --teal-light:#e0f2f0; --teal-mid:#99d6d0;
  --green:#16a34a; --green-bg:#dcfce7;
  --red:#dc2626;   --red-bg:#fee2e2;
  --amber:#b45309; --amber-bg:#fef3c7;
  --blue:#1d4ed8;  --blue-bg:#dbeafe;
  --purple:#7c3aed; --purple-bg:#ede9fe;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --shadow:0 4px 16px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04);
}

*{box-sizing:border-box;margin:0;padding:0;}

.cb-root{
  min-height:100vh;background:var(--bg);
  font-family:'DM Sans',sans-serif;color:var(--text);padding-bottom:80px;
}

/* ── ANIMATIONS (same as Dashboard) ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{0%{opacity:0;transform:scale(0.85)}65%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes rowSlide{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes collapseOpen{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

.cb-header{animation:fadeIn .45s ease both}
.stats-grid{animation:fadeUp .5s .08s ease both}
.stat-card{animation:popIn .4s ease both}
.stat-card:nth-child(1){animation-delay:.04s}
.stat-card:nth-child(2){animation-delay:.10s}
.stat-card:nth-child(3){animation-delay:.16s}
.stat-value{animation:fadeUp .35s .3s ease both}
.stat-card:hover .stat-value{transform:scale(1.04);transition:transform .15s}
.form-panel{animation:fadeUp .35s ease both}
.chart-card{animation:fadeUp .5s .3s ease both}
.cb-table tbody tr{animation:rowSlide .3s ease both}
.cb-table tbody tr:nth-child(1){animation-delay:.03s}
.cb-table tbody tr:nth-child(2){animation-delay:.07s}
.cb-table tbody tr:nth-child(3){animation-delay:.11s}
.cb-table tbody tr:nth-child(4){animation-delay:.15s}
.cb-table tbody tr:nth-child(5){animation-delay:.19s}

/* ── HEADER ── */
.cb-header{
  background:var(--surface);border-bottom:1.5px solid var(--border);
  padding:28px 0 22px;margin-bottom:28px;box-shadow:var(--shadow-sm);
}
.cb-header-inner{
  max-width:1100px;margin:auto;padding:0 24px;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
}
.cb-eyebrow{
  font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;
  color:var(--teal);margin-bottom:5px;display:flex;align-items:center;gap:7px;
}
.cb-eyebrow::before{content:'';display:inline-block;width:18px;height:2px;background:var(--teal);border-radius:2px;}
.cb-title{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,34px);font-weight:900;line-height:1.1;color:var(--text);}
.cb-title em{font-style:italic;color:var(--teal);}
.cb-balance-badge{
  display:flex;flex-direction:column;align-items:flex-end;
  background:var(--teal-light);border:1.5px solid var(--teal-mid);
  border-radius:14px;padding:10px 18px;
}
.cb-balance-label{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin-bottom:3px;}
.cb-balance-amount{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:var(--teal);}

/* ── LAYOUT ── */
.cb-wrap{max-width:1100px;margin:auto;padding:0 24px;}
@media(max-width:480px){.cb-wrap{padding:0 14px;}}

/* ── SECTION TITLE ── */
.section-title{
  font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--text);
  margin-bottom:14px;display:flex;align-items:center;gap:10px;
}
.section-title::after{content:'';flex:1;height:1.5px;background:var(--border);border-radius:2px;}

/* ── STAT CARDS (3-col grid, same as Dashboard) ── */
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;}
@media(max-width:640px){.stats-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:380px){.stats-grid{grid-template-columns:1fr;}}

.stat-card{
  background:var(--surface);border:1.5px solid var(--border);border-radius:12px;
  padding:18px 20px;position:relative;overflow:hidden;box-shadow:var(--shadow-sm);
  transition:transform .2s,box-shadow .2s;
}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow);}
.stat-card-accent{position:absolute;top:0;left:0;right:0;height:3px;border-radius:12px 12px 0 0;}
.accent-teal {background:var(--teal);}
.accent-green{background:var(--green);}
.accent-red  {background:var(--red);}
.stat-icon-bg{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;margin-bottom:12px;}
.stat-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px;}
.stat-value{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;line-height:1;}
.stat-value.teal {color:var(--teal);}
.stat-value.green{color:var(--green);}
.stat-value.red  {color:var(--red);}

/* ── TODAY'S APP BALANCE BANNER ── */
.today-banner{
  background:var(--surface);border:1.5px solid var(--border);border-radius:12px;
  padding:14px 20px;margin-bottom:28px;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
  box-shadow:var(--shadow-sm);
}
.today-banner-left{display:flex;flex-direction:column;gap:3px;}
.today-banner-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);}
.today-banner-sub{font-size:11px;color:var(--text-faint);}
.today-banner-amount{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;}
.today-banner-amount.pos{color:var(--teal);}
.today-banner-amount.neg{color:var(--red);}

/* ── FORMS TABS (identical to Dashboard) ── */
.forms-tabs{
  display:flex;background:var(--surface);border:1.5px solid var(--border);
  border-radius:12px 12px 0 0;overflow:hidden;margin-bottom:0;
}
.forms-tab{
  flex:1;padding:12px 8px;font-size:11px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;text-align:center;cursor:pointer;
  border:none;font-family:'DM Sans',sans-serif;color:var(--text-dim);
  background:transparent;transition:all .18s;border-right:1.5px solid var(--border);
}
.forms-tab:last-child{border-right:none;}
.forms-tab.active-deposit{background:var(--teal-light);color:var(--teal);}
.forms-tab.active-spend  {background:var(--red-bg);color:var(--red);}
.forms-tab:hover:not(.active-deposit):not(.active-spend){color:var(--text-med);background:var(--surface2);}

/* ── FORM PANEL ── */
.form-panel{
  background:var(--surface);border:1.5px solid var(--border);border-top:none;
  border-radius:0 0 12px 12px;padding:22px;margin-bottom:32px;
}
@media(max-width:480px){.form-panel{padding:16px;}}

.field-wrap{margin-bottom:12px;}
.field-label{display:block;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-med);margin-bottom:5px;}
.cb-input,.cb-select{
  width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;
  padding:10px 13px;font-size:14px;font-family:'DM Sans',sans-serif;
  color:var(--text);outline:none;
  transition:border-color .2s,background .2s,box-shadow .2s;
  appearance:none;-webkit-appearance:none;
}
.cb-input::placeholder{color:var(--text-faint);}
.cb-input:focus,.cb-select:focus{
  border-color:var(--teal);background:var(--surface);
  box-shadow:0 0 0 3px rgba(13,148,136,0.1);
}
.cb-select option{color:var(--text);}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.two-col .field-wrap{margin-bottom:0;}

/* ── AMOUNT PREVIEW BOXES ── */
.amount-preview-deposit{
  background:var(--teal-light);border:1.5px solid var(--teal-mid);
  border-radius:8px;padding:10px 14px;
  display:flex;align-items:center;justify-content:space-between;margin:8px 0 12px;
}
.amount-preview-deposit .ap-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);}
.amount-preview-deposit .ap-value{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--teal);}

.amount-preview-spend{
  background:var(--red-bg);border:1.5px solid rgba(220,38,38,0.25);
  border-radius:8px;padding:10px 14px;
  display:flex;align-items:center;justify-content:space-between;margin:8px 0 12px;
}
.amount-preview-spend .ap-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--red);}
.amount-preview-spend .ap-value{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--red);}

/* ── WARN BOX ── */
.warn-box{
  background:var(--red-bg);border:1.5px solid rgba(220,38,38,0.3);
  border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;
  font-size:12px;font-weight:600;color:var(--red);margin-bottom:10px;
}

/* ── BUTTONS ── */
.btn{width:100%;padding:12px;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .18s;margin-top:4px;}
.btn:hover{opacity:.88;transform:translateY(-1px);box-shadow:var(--shadow);}
.btn:active{transform:translateY(0);box-shadow:none;}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important;}
.btn-teal{background:var(--teal);color:#fff;}
.btn-red {background:var(--red);color:#fff;}

/* ── CHART ── */
.chart-card{
  background:var(--surface);border:1.5px solid var(--border);
  border-radius:12px;padding:24px;margin-bottom:32px;box-shadow:var(--shadow-sm);
}
.chart-toggle{
  display:flex;gap:0;background:var(--bg2);border:1.5px solid var(--border);
  border-radius:8px;overflow:hidden;width:fit-content;margin-bottom:18px;
}
.toggle-btn{
  padding:7px 20px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  cursor:pointer;border:none;font-family:'DM Sans',sans-serif;color:var(--text-dim);
  background:transparent;transition:all .18s;
}
.toggle-btn.active{background:var(--teal);color:#fff;}
.toggle-btn:hover:not(.active){color:var(--text-med);}

/* ── FILTER BAR ── */
.filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;}
.filter-select{
  background:var(--surface);border:1.5px solid var(--border);border-radius:8px;
  padding:7px 13px;font-size:12px;font-family:'DM Sans',sans-serif;
  color:var(--text-med);outline:none;cursor:pointer;
  transition:border-color .2s;appearance:none;-webkit-appearance:none;
}
.filter-select:focus{border-color:var(--teal);}
.filter-clear{
  background:none;border:1.5px solid var(--border);border-radius:8px;
  padding:7px 13px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;
  color:var(--text-dim);cursor:pointer;transition:all .15s;letter-spacing:.05em;text-transform:uppercase;
}
.filter-clear:hover{color:var(--red);border-color:var(--red);background:var(--red-bg);}
.filter-count{font-size:11px;color:var(--text-dim);margin-left:auto;letter-spacing:.04em;}

/* ── TRANSACTION SECTIONS (exact same structure as Dashboard) ── */
.txn-section{
  border-radius:14px;margin-bottom:12px;overflow:hidden;
  box-shadow:var(--shadow-sm);border:1.5px solid var(--border);transition:box-shadow .2s;
}
.txn-section:hover{box-shadow:var(--shadow);}

/* Deposit header — soft green (same as Dashboard Income header) */
.txn-header-deposit{
  display:flex;align-items:center;padding:0;cursor:pointer;user-select:none;
  background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);
  border-bottom:1.5px solid transparent;transition:background .18s,border-color .18s;
}
.txn-header-deposit.open{border-bottom-color:#bbf7d0;}
.txn-header-deposit:hover{background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%);}

/* Spend header — soft red (same as Dashboard Expense header) */
.txn-header-spend{
  display:flex;align-items:center;padding:0;cursor:pointer;user-select:none;
  background:linear-gradient(135deg,#fff5f5 0%,#fee2e2 100%);
  border-bottom:1.5px solid transparent;transition:background .18s,border-color .18s;
}
.txn-header-spend.open{border-bottom-color:#fecaca;}
.txn-header-spend:hover{background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);}

.txn-header-stripe{width:5px;align-self:stretch;flex-shrink:0;}
.stripe-green{background:var(--green);}
.stripe-red  {background:var(--red);}

.txn-header-content{flex:1;display:flex;align-items:center;justify-content:space-between;padding:14px 16px 14px 14px;gap:10px;}
.txn-header-left{display:flex;align-items:center;gap:10px;}
.txn-emoji{font-size:20px;line-height:1;}
.txn-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:800;line-height:1.1;letter-spacing:.01em;}
.txn-title.deposit{color:#15803d;}
.txn-title.spend  {color:#b91c1c;}
.txn-count-pill{display:inline-flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:10px;margin-top:3px;}
.txn-count-pill.deposit{background:#bbf7d0;color:#14532d;}
.txn-count-pill.spend  {background:#fecaca;color:#7f1d1d;}
.txn-header-right{display:flex;align-items:center;gap:12px;}
.txn-total{font-family:'Playfair Display',serif;font-size:20px;font-weight:800;letter-spacing:.01em;}
.txn-total.deposit{color:#15803d;}
.txn-total.spend  {color:#b91c1c;}
.txn-arrow-btn{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1.5px solid transparent;transition:all .18s;flex-shrink:0;}
.txn-arrow-btn.deposit{background:rgba(22,163,74,0.1);border-color:rgba(22,163,74,0.2);color:var(--green);}
.txn-arrow-btn.deposit:hover{background:rgba(22,163,74,0.2);}
.txn-arrow-btn.spend{background:rgba(220,38,38,0.1);border-color:rgba(220,38,38,0.2);color:var(--red);}
.txn-arrow-btn.spend:hover{background:rgba(220,38,38,0.2);}
.txn-arrow-icon{transition:transform .22s cubic-bezier(.4,0,.2,1);display:block;}
.txn-arrow-icon.open{transform:rotate(180deg);}
.txn-body{background:var(--surface);overflow-x:auto;animation:collapseOpen .22s ease both;}
.txn-empty{text-align:center;padding:28px 16px;font-size:13px;color:var(--text-dim);letter-spacing:.03em;}
.table-scroll-hint{display:none;font-size:10px;color:var(--text-dim);padding:6px 12px;text-align:center;letter-spacing:.05em;border-bottom:1px solid var(--border);}
@media(max-width:580px){.table-scroll-hint{display:block;}}

/* ── TABLE (identical to Dashboard) ── */
.cb-table{width:100%;border-collapse:collapse;font-size:13px;min-width:360px;}
.cb-table th{font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);padding:9px 12px;text-align:left;background:var(--bg2);border-bottom:1.5px solid var(--border);white-space:nowrap;}
.cb-table th:first-child{border-radius:7px 0 0 7px;}
.cb-table th:last-child {border-radius:0 7px 7px 0;}
.cb-table th.right {text-align:right;}
.cb-table th.center{text-align:center;}
.cb-table td{padding:11px 12px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
.cb-table td.right {text-align:right;}
.cb-table td.center{text-align:center;}
.cb-table tr:last-child td{border-bottom:none;}
.cb-table tr:hover td{background:var(--surface2);}

.cat-pill{display:inline-flex;align-items:center;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:var(--blue-bg);color:var(--blue);}
.del-btn{background:none;border:none;cursor:pointer;padding:6px;border-radius:6px;color:var(--text-faint);transition:all .18s;display:inline-flex;}
.del-btn:hover{color:var(--red);background:var(--red-bg);}

/* ── CATEGORY ANALYTICS ── */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px;}
.cat-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:4px;}
.cat-card-name{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim);}
.cat-card-val{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--red);}
.cat-card-count{font-size:10px;color:var(--text-faint);}

/* ── NET BALANCE CARD (identical to Dashboard) ── */
.net-balance-card{
  display:flex;align-items:center;justify-content:space-between;
  background:var(--surface);border:1.5px solid var(--border);
  border-radius:14px;padding:16px 20px;margin-bottom:36px;
  box-shadow:var(--shadow-sm);gap:12px;flex-wrap:wrap;
}
.net-balance-label{
  font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--text-dim);display:flex;align-items:center;gap:8px;
}
.net-balance-label::before{content:'';display:inline-block;width:14px;height:2px;background:var(--teal);border-radius:2px;}
.net-balance-value{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;letter-spacing:.01em;color:var(--teal);}

/* ── MOBILE ── */
@media(max-width:640px){
  .cb-header{padding:16px 0 12px;margin-bottom:18px;}
  .stat-card{padding:14px 16px;}
  .stat-value{font-size:22px!important;}
  .chart-card{padding:16px;}
  .txn-total{font-size:16px;}
  .txn-title{font-size:14px;}
  .net-balance-value,.cb-balance-amount,.today-banner-amount{font-size:20px;}
}
`;

const CATEGORIES = ["Food", "Travel", "Personal", "Medical", "Household", "Bills", "Shopping", "Other"];
const CHART_COLORS = ["#16a34a", "#dc2626", "#1d4ed8", "#0d9488", "#7c3aed", "#b45309"];

export default function CashBox() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0];

    /* ── STATE ── */
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayAppBalance, setTodayAppBalance] = useState(0); // TODAY income − expense only

    const [activeForm, setActiveForm] = useState("deposit");
    const [depositOpen, setDepositOpen] = useState(true);
    const [spendOpen, setSpendOpen] = useState(true);
    const [chartView, setChartView] = useState("monthly");

    const [filterType, setFilterType] = useState("all");
    const [filterMonth, setFilterMonth] = useState("all");

    const [depositForm, setDepositForm] = useState({ amount: "", date: today, note: "" });
    const [spendForm, setSpendForm] = useState({ amount: "", date: today, category: "", note: "" });

    const fmt = (n) => (n || 0).toLocaleString("en-IN");

    /* ── FETCH CASH BOX TRANSACTIONS ── */
    const fetchTxns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("cash_box_transactions")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) { console.error(error.message); setLoading(false); return; }
        setTxns(data || []);
        setLoading(false);
    };

    /* ── FETCH TODAY'S APP BALANCE ── */
    /* Balance = today's income total − today's expense total (same date filter as Dashboard today view) */
    const fetchTodayBalance = async () => {
        const [{ data: incData }, { data: expData }] = await Promise.all([
            supabase.from("income").select("amount").eq("date", today),
            supabase.from("expense").select("amount").eq("date", today),
        ]);
        const inc = (incData || []).reduce((s, r) => s + (r.amount || 0), 0);
        const exp = (expData || []).reduce((s, r) => s + (r.amount || 0), 0);
        setTodayAppBalance(inc - exp);
    };

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) { navigate("/login"); return; }
            await Promise.all([fetchTxns(), fetchTodayBalance()]);
        };
        init();
    }, [navigate]);

    /* ── DERIVED BALANCES ── */
    const totalDeposited = useMemo(() =>
        txns.filter(t => t.type === "deposit").reduce((s, t) => s + (t.amount || 0), 0), [txns]);
    const totalSpent = useMemo(() =>
        txns.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0), [txns]);
    const cashBoxBalance = totalDeposited - totalSpent;

    /* ── ADD DEPOSIT ── */
    const addDeposit = async () => {
        const amount = Number(depositForm.amount);
        if (!amount || amount <= 0) return;
        if (amount > todayAppBalance) {
            alert(`⚠️ Today's app balance is only ₹${fmt(todayAppBalance)}. Cannot transfer more.`);
            return;
        }

        // 1. Record in cash_box_transactions
        const { error: txnErr } = await supabase.from("cash_box_transactions").insert([{
            type: "deposit", amount, date: depositForm.date,
            note: depositForm.note.trim() || null,
        }]);
        if (txnErr) { alert(txnErr.message); return; }

        // 2. Reduce today's balance by adding a "Cash Box Transfer" expense
        const { error: expErr } = await supabase.from("expense").insert([{
            date: depositForm.date,
            paid_to: "Cash Box Transfer",
            amount,
        }]);
        if (expErr) alert("Cash Box saved but balance deduction failed: " + expErr.message);

        setDepositForm({ amount: "", date: today, note: "" });
        await Promise.all([fetchTxns(), fetchTodayBalance()]);
    };

    /* ── ADD SPEND ── */
    const addSpend = async () => {
        const amount = Number(spendForm.amount);
        if (!amount || amount <= 0 || !spendForm.category) return;
        if (amount > cashBoxBalance) {
            alert(`⚠️ Cash box only has ₹${fmt(cashBoxBalance)}. Cannot spend more.`);
            return;
        }
        const { error } = await supabase.from("cash_box_transactions").insert([{
            type: "expense", amount, date: spendForm.date,
            category: spendForm.category,
            note: spendForm.note.trim() || null,
        }]);
        if (error) { alert(error.message); return; }
        setSpendForm({ amount: "", date: today, category: "", note: "" });
        await fetchTxns();
    };

    /* ── DELETE ── */
    const deleteTxn = async (txn) => {
        if (!window.confirm(`Delete this ${txn.type === "deposit" ? "deposit" : "spend entry"}?`)) return;
        const { error } = await supabase.from("cash_box_transactions").delete().eq("id", txn.id);
        if (error) { alert(error.message); return; }

        // If it was a deposit, also reverse the expense entry that reduced app balance
        if (txn.type === "deposit") {
            await supabase.from("expense")
                .delete()
                .eq("paid_to", "Cash Box Transfer")
                .eq("amount", txn.amount)
                .eq("date", txn.date);
        }
        await Promise.all([fetchTxns(), fetchTodayBalance()]);
    };

    /* ── FILTERED ROWS ── */
    const filteredTxns = useMemo(() =>
        txns.filter(t => {
            if (filterType !== "all" && t.type !== filterType) return false;
            if (filterMonth !== "all" && !t.date.startsWith(filterMonth)) return false;
            return true;
        }), [txns, filterType, filterMonth]);

    const depositRows = filteredTxns.filter(t => t.type === "deposit");
    const spendRows = filteredTxns.filter(t => t.type === "expense");

    const months = useMemo(() => {
        const s = new Set(txns.map(t => t.date.slice(0, 7)));
        return Array.from(s).sort().reverse();
    }, [txns]);

    /* ── CHART DATA ── */
    const chartData = useMemo(() => {
        if (chartView === "monthly") {
            const map = {};
            txns.forEach(t => {
                const m = t.date.slice(0, 7);
                if (!map[m]) map[m] = { name: m.slice(5), Deposited: 0, Spent: 0 };
                if (t.type === "deposit") map[m].Deposited += t.amount;
                else map[m].Spent += t.amount;
            });
            return Object.values(map).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);
        }
        const map = {};
        txns.filter(t => t.type === "expense").forEach(t => {
            const cat = t.category || "Other";
            if (!map[cat]) map[cat] = { name: cat, Spent: 0 };
            map[cat].Spent += t.amount;
        });
        return Object.values(map).sort((a, b) => b.Spent - a.Spent);
    }, [txns, chartView]);

    /* ── CATEGORY STATS ── */
    const catStats = useMemo(() => {
        const map = {};
        txns.filter(t => t.type === "expense").forEach(t => {
            const cat = t.category || "Other";
            if (!map[cat]) map[cat] = { total: 0, count: 0 };
            map[cat].total += t.amount;
            map[cat].count++;
        });
        return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    }, [txns]);

    const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{CSS}</style>
            <Navbar />
            <div className="cb-root">

                {/* HEADER */}
                <div className="cb-header">
                    <div className="cb-header-inner">
                        <div>
                            <div className="cb-eyebrow">Home Savings</div>
                            <h1 className="cb-title">Cash <em>Box</em></h1>
                        </div>
                        <div className="cb-balance-badge">
                            <span className="cb-balance-label">📦 Cash in Box</span>
                            <span className="cb-balance-amount">₹{fmt(cashBoxBalance)}</span>
                        </div>
                    </div>
                </div>

                <div className="cb-wrap">

                    {/* STAT CARDS */}
                    <div className="stats-grid">
                        <StatCard label="Cash in Box" value={fmt(cashBoxBalance)} valCls="teal" accent="accent-teal" icon="📦" iconBg="#e0f2f0" />
                        <StatCard label="Total Deposited" value={fmt(totalDeposited)} valCls="green" accent="accent-green" icon="➕" iconBg="#dcfce7" />
                        <StatCard label="Total Spent" value={fmt(totalSpent)} valCls="red" accent="accent-red" icon="💸" iconBg="#fee2e2" />
                    </div>

                    {/* TODAY'S APP BALANCE BANNER */}
                    <div className="today-banner">
                        <div className="today-banner-left">
                            <span className="today-banner-label">🏦 Today's App Balance — {todayLabel}</span>
                            <span className="today-banner-sub">Today's income − today's expense · Available to move to Cash Box</span>
                        </div>
                        <span className={`today-banner-amount ${todayAppBalance >= 0 ? "pos" : "neg"}`}>
                            ₹{fmt(Math.abs(todayAppBalance))}
                        </span>
                    </div>

                    {/* QUICK ENTRY */}
                    <p className="section-title">Quick Entry</p>
                    <div className="forms-tabs">
                        <button
                            className={`forms-tab${activeForm === "deposit" ? " active-deposit" : ""}`}
                            onClick={() => setActiveForm("deposit")}
                        >
                            📦 Add to Cash Box
                        </button>
                        <button
                            className={`forms-tab${activeForm === "spend" ? " active-spend" : ""}`}
                            onClick={() => setActiveForm("spend")}
                        >
                            💸 Spend from Box
                        </button>
                    </div>

                    {/* DEPOSIT FORM */}
                    {activeForm === "deposit" && (
                        <div className="form-panel">
                            {todayAppBalance <= 0 && (
                                <div className="warn-box">⚠️ Today's balance is zero or negative — cannot transfer to Cash Box.</div>
                            )}
                            <div className="two-col">
                                <div className="field-wrap">
                                    <label className="field-label">Amount (₹)</label>
                                    <input className="cb-input" type="number" placeholder="0"
                                        value={depositForm.amount}
                                        onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))} />
                                </div>
                                <div className="field-wrap">
                                    <label className="field-label">Date</label>
                                    <input className="cb-input" type="date" value={depositForm.date}
                                        onChange={e => setDepositForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>
                            <div className="field-wrap">
                                <label className="field-label">Note (optional)</label>
                                <input className="cb-input" placeholder="e.g. Today's savings…"
                                    value={depositForm.note}
                                    onChange={e => setDepositForm(f => ({ ...f, note: e.target.value }))} />
                            </div>
                            {Number(depositForm.amount) > 0 && (
                                <div className="amount-preview-deposit">
                                    <span className="ap-label">Moving to Cash Box · deducts today's balance</span>
                                    <span className="ap-value">₹{fmt(Number(depositForm.amount))}</span>
                                </div>
                            )}
                            <button className="btn btn-teal" onClick={addDeposit}
                                disabled={!depositForm.amount || Number(depositForm.amount) <= 0 || todayAppBalance <= 0}>
                                📦 Add to Cash Box
                            </button>
                        </div>
                    )}

                    {/* SPEND FORM */}
                    {activeForm === "spend" && (
                        <div className="form-panel">
                            {cashBoxBalance <= 0 && (
                                <div className="warn-box">⚠️ Cash box is empty. Add money first.</div>
                            )}
                            <div className="two-col">
                                <div className="field-wrap">
                                    <label className="field-label">Amount (₹)</label>
                                    <input className="cb-input" type="number" placeholder="0"
                                        value={spendForm.amount}
                                        onChange={e => setSpendForm(f => ({ ...f, amount: e.target.value }))} />
                                </div>
                                <div className="field-wrap">
                                    <label className="field-label">Date</label>
                                    <input className="cb-input" type="date" value={spendForm.date}
                                        onChange={e => setSpendForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>
                            <div className="field-wrap">
                                <label className="field-label">Category</label>
                                <select className="cb-select" value={spendForm.category}
                                    onChange={e => setSpendForm(f => ({ ...f, category: e.target.value }))}>
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="field-wrap">
                                <label className="field-label">Note (optional)</label>
                                <input className="cb-input" placeholder="e.g. Groceries, bus fare…"
                                    value={spendForm.note}
                                    onChange={e => setSpendForm(f => ({ ...f, note: e.target.value }))} />
                            </div>
                            {Number(spendForm.amount) > 0 && (
                                <div className="amount-preview-spend">
                                    <span className="ap-label">Spending from Cash Box</span>
                                    <span className="ap-value">₹{fmt(Number(spendForm.amount))}</span>
                                </div>
                            )}
                            <button className="btn btn-red" onClick={addSpend}
                                disabled={!spendForm.amount || Number(spendForm.amount) <= 0 || !spendForm.category || cashBoxBalance <= 0}>
                                💸 Record Cash Spend
                            </button>
                        </div>
                    )}

                    {/* ANALYTICS CHART */}
                    <p className="section-title">Analytics</p>
                    <div className="chart-card">
                        <div className="chart-toggle">
                            <button className={`toggle-btn${chartView === "monthly" ? " active" : ""}`} onClick={() => setChartView("monthly")}>Monthly</button>
                            <button className={`toggle-btn${chartView === "category" ? " active" : ""}`} onClick={() => setChartView("category")}>By Category</button>
                        </div>
                        {chartData.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)", fontSize: 13 }}>No data yet 📭</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData} barGap={6}>
                                    <XAxis dataKey="name" tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: "10px", color: "#1c1a17", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                                    {chartView === "monthly" ? (
                                        <>
                                            <Bar dataKey="Deposited" fill="#16a34a" radius={[5, 5, 0, 0]} animationDuration={600} />
                                            <Bar dataKey="Spent" fill="#dc2626" radius={[5, 5, 0, 0]} animationDuration={600} />
                                        </>
                                    ) : (
                                        <Bar dataKey="Spent" radius={[5, 5, 0, 0]} animationDuration={600}>
                                            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Bar>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {chartView === "category" && catStats.length > 0 && (
                            <div className="cat-grid">
                                {catStats.map(([cat, stats]) => (
                                    <div className="cat-card" key={cat}>
                                        <span className="cat-card-name">{cat}</span>
                                        <span className="cat-card-val">₹{fmt(stats.total)}</span>
                                        <span className="cat-card-count">{stats.count} {stats.count === 1 ? "entry" : "entries"}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TRANSACTION HISTORY */}
                    <p className="section-title">Transaction History</p>

                    <div className="filter-bar">
                        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="deposit">Deposits Only</option>
                            <option value="expense">Spends Only</option>
                        </select>
                        <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                            <option value="all">All Months</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {(filterType !== "all" || filterMonth !== "all") && (
                            <button className="filter-clear" onClick={() => { setFilterType("all"); setFilterMonth("all"); }}>✕ Clear</button>
                        )}
                        <span className="filter-count">{filteredTxns.length} {filteredTxns.length === 1 ? "entry" : "entries"}</span>
                    </div>

                    {/* DEPOSIT COLLAPSIBLE */}
                    {(filterType === "all" || filterType === "deposit") && (
                        <div className="txn-section">
                            <div className={`txn-header-deposit${depositOpen ? " open" : ""}`} onClick={() => setDepositOpen(p => !p)}>
                                <div className="txn-header-stripe stripe-green" />
                                <div className="txn-header-content">
                                    <div className="txn-header-left">
                                        <span className="txn-emoji">📦</span>
                                        <div>
                                            <div className="txn-title deposit">Deposits</div>
                                            <div className="txn-count-pill deposit">{depositRows.length} {depositRows.length === 1 ? "entry" : "entries"}</div>
                                        </div>
                                    </div>
                                    <div className="txn-header-right">
                                        <span className="txn-total deposit">+₹{fmt(depositRows.reduce((s, t) => s + t.amount, 0))}</span>
                                        <div className="txn-arrow-btn deposit">
                                            <svg className={`txn-arrow-icon${depositOpen ? " open" : ""}`} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {depositOpen && (
                                <div className="txn-body">
                                    {loading ? <div className="txn-empty">Loading…</div>
                                        : depositRows.length === 0 ? <div className="txn-empty">No deposits found 📭</div>
                                            : (
                                                <>
                                                    <div className="table-scroll-hint">← scroll to see all →</div>
                                                    <table className="cb-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th><th>Note</th>
                                                                <th className="right">Amount</th><th className="center">Del</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {depositRows.map(t => (
                                                                <tr key={t.id}>
                                                                    <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{t.date}</td>
                                                                    <td style={{ fontWeight: 500 }}>{t.note || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                                                                    <td className="right" style={{ fontWeight: 700, color: "var(--green)" }}>+₹{fmt(t.amount)}</td>
                                                                    <td className="center">
                                                                        <button className="del-btn" onClick={() => deleteTxn(t)}>
                                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr>
                                                                <td colSpan={2} style={{ padding: "10px 12px", background: "var(--green-bg)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--green)" }}>Total Deposited</td>
                                                                <td className="right" style={{ padding: "10px 12px", background: "var(--green-bg)", fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 800, color: "var(--green)" }}>+₹{fmt(depositRows.reduce((s, t) => s + t.amount, 0))}</td>
                                                                <td style={{ background: "var(--green-bg)" }} />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </>
                                            )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPEND COLLAPSIBLE */}
                    {(filterType === "all" || filterType === "expense") && (
                        <div className="txn-section">
                            <div className={`txn-header-spend${spendOpen ? " open" : ""}`} onClick={() => setSpendOpen(p => !p)}>
                                <div className="txn-header-stripe stripe-red" />
                                <div className="txn-header-content">
                                    <div className="txn-header-left">
                                        <span className="txn-emoji">💸</span>
                                        <div>
                                            <div className="txn-title spend">Spends</div>
                                            <div className="txn-count-pill spend">{spendRows.length} {spendRows.length === 1 ? "entry" : "entries"}</div>
                                        </div>
                                    </div>
                                    <div className="txn-header-right">
                                        <span className="txn-total spend">−₹{fmt(spendRows.reduce((s, t) => s + t.amount, 0))}</span>
                                        <div className="txn-arrow-btn spend">
                                            <svg className={`txn-arrow-icon${spendOpen ? " open" : ""}`} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {spendOpen && (
                                <div className="txn-body">
                                    {loading ? <div className="txn-empty">Loading…</div>
                                        : spendRows.length === 0 ? <div className="txn-empty">No cash spends found 🎉</div>
                                            : (
                                                <>
                                                    <div className="table-scroll-hint">← scroll to see all →</div>
                                                    <table className="cb-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th><th>Category</th><th>Note</th>
                                                                <th className="right">Amount</th><th className="center">Del</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {spendRows.map(t => (
                                                                <tr key={t.id}>
                                                                    <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{t.date}</td>
                                                                    <td><span className="cat-pill">{t.category || "—"}</span></td>
                                                                    <td style={{ fontWeight: 500 }}>{t.note || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                                                                    <td className="right" style={{ fontWeight: 700, color: "var(--red)" }}>−₹{fmt(t.amount)}</td>
                                                                    <td className="center">
                                                                        <button className="del-btn" onClick={() => deleteTxn(t)}>
                                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr>
                                                                <td colSpan={3} style={{ padding: "10px 12px", background: "var(--red-bg)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--red)" }}>Total Spent</td>
                                                                <td className="right" style={{ padding: "10px 12px", background: "var(--red-bg)", fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 800, color: "var(--red)" }}>−₹{fmt(spendRows.reduce((s, t) => s + t.amount, 0))}</td>
                                                                <td style={{ background: "var(--red-bg)" }} />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </>
                                            )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NET BALANCE */}
                    <div className="net-balance-card">
                        <span className="net-balance-label">Cash Box Balance</span>
                        <span className="net-balance-value">₹{fmt(cashBoxBalance)}</span>
                    </div>

                </div>
            </div>
        </>
    );
}

/* ── STAT CARD ── */
function StatCard({ label, value, valCls, accent, icon, iconBg }) {
    return (
        <div className="stat-card">
            <div className={`stat-card-accent ${accent}`} />
            <div className="stat-icon-bg" style={{ background: iconBg }}>{icon}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${valCls}`}>₹{value}</div>
        </div>
    );
}