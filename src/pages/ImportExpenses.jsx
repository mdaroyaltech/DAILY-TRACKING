import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

/* ═══════════ HELPERS ═══════════ */
const fmtIN = (n) => Math.abs(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
};
const today = () => new Date().toISOString().split("T")[0];
const toWords = (num) => {
    const o = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const t = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if (!num) return "Zero";
    const n = Math.round(Math.abs(num)), cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1e3), hu = Math.floor((n % 1e3) / 100), re = n % 100;
    const td = (x) => x < 20 ? o[x] : t[Math.floor(x / 10)] + (x % 10 ? " " + o[x % 10] : "");
    let r = "";
    if (cr) r += td(cr) + " Crore "; if (lk) r += td(lk) + " Lakh "; if (th) r += td(th) + " Thousand "; if (hu) r += o[hu] + " Hundred "; if (re) r += td(re);
    return r.trim() + " Rupees";
};
const CATS = ["Food", "Travel", "Medical", "Utilities", "Household", "Shopping", "Education", "Entertainment", "Loans", "Daily Finance", "Family", "Personal", "Automobile", "New Home", "Other", "Uncategorized"];
const PAGE_SIZES = [10, 20, 50, 100, 200, 500];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RECEIPT_BUCKET = "payment-receipts";

/* ═══════════ DARK MODE HOOK ═══════════ */
function useDarkMode() {
    const check = () => {
        const attr = document.documentElement.getAttribute("data-theme");
        if (attr === "dark") return true;
        if (attr === "light") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    };
    const [dark, setDark] = useState(check);
    useEffect(() => {
        const obs = new MutationObserver(() => setDark(check()));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setDark(check());
        mq.addEventListener("change", handler);
        return () => { obs.disconnect(); mq.removeEventListener("change", handler); };
    }, []);
    return dark;
}

/* ═══════════ THEME TOKENS ═══════════ */
const LIGHT = {
    bg: "#f7f4ef", bg2: "#eeeae2", sfc: "#ffffff", sfc2: "#faf8f5",
    bdr: "#e4ddd4", bdr2: "#d2c9bc",
    tx: "#1a1815", txm: "#524d46", txd: "#948c82", txf: "#c2bab0",
    te: "#0d9488", tel: "#e0f7f4", tem: "#81d4cc",
    gr: "#16a34a", grb: "#dcfce7", grd: "#15803d",
    rd: "#dc2626", rdb: "#fee2e2", rdd: "#b91c1c",
    bl: "#2563eb", blb: "#dbeafe",
    pu: "#7c3aed", pub: "#ede9fe",
    chartInc: "#16a34a", chartExp: "#dc2626",
    chartIncBg: "rgba(22,163,74,.18)", chartExpBg: "rgba(220,38,38,.18)",
    chartGrid: "rgba(0,0,0,.05)", chartTick: "#948c82",
    tooltipBg: "#1a1815",
    sh0: "0 1px 4px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.04)",
    sh: "0 4px 20px rgba(0,0,0,.1),0 1px 6px rgba(0,0,0,.05)",
    shl: "0 24px 64px rgba(0,0,0,.2),0 8px 24px rgba(0,0,0,.1)",
};
const DARK = {
    bg: "#0e0d0b", bg2: "#161410", sfc: "#1c1a17", sfc2: "#222019",
    bdr: "#2a2722", bdr2: "#38342d",
    tx: "#f2ede7", txm: "#c4bdb2", txd: "#857e75", txf: "#4e4a45",
    te: "#14b8a6", tel: "#0b2320", tem: "#0f3d38",
    gr: "#22c55e", grb: "#051a0a", grd: "#16a34a",
    rd: "#f87171", rdb: "#1f0808", rdd: "#dc2626",
    bl: "#60a5fa", blb: "#0d1d35",
    pu: "#a78bfa", pub: "#180f35",
    chartInc: "#4ade80", chartExp: "#fb7185",
    chartIncBg: "rgba(74,222,128,.22)", chartExpBg: "rgba(251,113,133,.22)",
    chartGrid: "rgba(255,255,255,.05)", chartTick: "#857e75",
    tooltipBg: "#1c1a17",
    sh0: "0 1px 6px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.4)",
    sh: "0 6px 24px rgba(0,0,0,.65),0 2px 8px rgba(0,0,0,.4)",
    shl: "0 28px 72px rgba(0,0,0,.85),0 8px 28px rgba(0,0,0,.6)",
};

/* ═══════════ CSS ═══════════ */
const makeCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{overflow-x:hidden;background:${T.bg};color:${T.tx};}
.pr{min-height:100vh;background:${T.bg};font-family:'DM Sans',sans-serif;color:${T.tx};padding-bottom:120px;}

@keyframes fU{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes fI{from{opacity:0}to{opacity:1}}
@keyframes pI{0%{opacity:0;transform:scale(.88)}65%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
@keyframes rS{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes sh{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes sD{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes mBI{from{opacity:0}to{opacity:1}}
@keyframes mI{from{opacity:0;transform:translateY(32px) scale(.96)}to{opacity:1;transform:none}}
@keyframes mO{from{opacity:1;transform:none}to{opacity:0;transform:translateY(24px) scale(.97)}}
@keyframes fP{0%{transform:scale(0) rotate(-90deg)}70%{transform:scale(1.1) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
@keyframes fabSlide{from{opacity:0;transform:translateX(36px) scale(.82)}to{opacity:1;transform:none}}
@keyframes tI{from{opacity:0;transform:translateX(56px)}to{opacity:1;transform:none}}
@keyframes tO{from{opacity:1}to{opacity:0;transform:translateX(48px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes aP{0%{opacity:0;transform:scale(.72)}100%{opacity:1;transform:scale(1)}}
@keyframes rcptBadge{0%{transform:scale(0)}80%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes imgZoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes sugIn{from{opacity:0;transform:translateY(-5px) scale(.98)}to{opacity:1;transform:none}}
@keyframes badgePop{0%{transform:scale(0)}80%{transform:scale(1.12)}100%{transform:scale(1)}}

.pr-hd{animation:fI .35s ease both}
.sc1{animation:pI .4s .04s ease both}.sc2{animation:pI .4s .1s ease both}.sc3{animation:pI .4s .16s ease both}
.pr-ctrl{animation:fU .4s .12s ease both}.pr-tbl{animation:fU .42s .18s ease both}
.chart-card{animation:fU .42s .22s ease both}
.pr-tbl tbody tr{animation:rS .22s ease both}
.pr-tbl tbody tr:nth-child(1){animation-delay:.02s}.pr-tbl tbody tr:nth-child(2){animation-delay:.05s}
.pr-tbl tbody tr:nth-child(3){animation-delay:.08s}.pr-tbl tbody tr:nth-child(4){animation-delay:.11s}

/* ── HEADER ── */
.pr-hd{
  background:${T.sfc};
  border-bottom:1px solid ${T.bdr};
  padding:18px 0 16px;
  margin-bottom:28px;
  box-shadow:${T.sh0};
  position:sticky;top:0;z-index:100;
  backdrop-filter:blur(12px);
}
.pr-hdi{max-width:1280px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.pr-ey{
  font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:${T.te};margin-bottom:5px;display:flex;align-items:center;gap:8px;
}
.pr-ey::before{content:'';display:inline-block;width:18px;height:2.5px;background:${T.te};border-radius:2px;}
.pr-ttl{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,34px);font-weight:900;line-height:1.08;color:${T.tx};}
.pr-ttl em{font-style:italic;color:${T.te};}
.pr-hdr{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.pr-bdg{
  background:${T.tel};border:1px solid ${T.tem};border-radius:20px;
  padding:5px 14px;font-size:10px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:${T.te};
  animation:badgePop .4s .3s cubic-bezier(.34,1.56,.64,1) both;
}
.hb{
  background:${T.te};color:#fff;border:none;border-radius:10px;
  padding:9px 18px;font-size:11px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;cursor:pointer;font-family:'DM Sans',sans-serif;
  transition:all .18s;display:flex;align-items:center;gap:6px;
}
.hb:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 6px 20px ${T.te}44;}
.hb.sec{
  background:${T.sfc2};color:${T.txm};
  border:1px solid ${T.bdr2};
}
.hb.sec:hover{border-color:${T.te};color:${T.te};background:${T.tel};box-shadow:none;}

/* ── LAYOUT ── */
.pr-w{max-width:1280px;margin:auto;padding:0 24px;}
@media(max-width:480px){.pr-w{padding:0 14px;}}

.sec-ttl{
  font-family:'Playfair Display',serif;font-size:15px;font-weight:700;
  color:${T.tx};margin-bottom:14px;
  display:flex;align-items:center;gap:10px;
}
.sec-ttl::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,${T.bdr},transparent);border-radius:2px;}

/* ── STAT CARDS ── */
.pr-sts{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;}
@media(max-width:700px){.pr-sts{grid-template-columns:1fr;gap:12px;}}
@media(min-width:701px) and (max-width:960px){.pr-sts{grid-template-columns:1fr 1fr;}}

.sc{
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:18px;
  padding:22px 24px;position:relative;overflow:hidden;
  box-shadow:${T.sh0};transition:transform .22s,box-shadow .22s;
}
.sc:hover{transform:translateY(-3px);box-shadow:${T.sh};}
.sc-ac{position:absolute;top:0;left:0;right:0;height:3.5px;border-radius:18px 18px 0 0;}
.at{background:linear-gradient(90deg,${T.te},#06b6d4);}
.ag{background:linear-gradient(90deg,${T.gr},#84cc16);}
.ar{background:linear-gradient(90deg,${T.rd},#f97316);}

.sc-tp{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}
.sc-ic{
  width:44px;height:44px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;flex-shrink:0;
}
.sc-lb{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${T.txd};margin-bottom:6px;}
.sc-vl{font-family:'Playfair Display',serif;font-size:clamp(22px,2.5vw,30px);font-weight:900;line-height:1.08;margin-bottom:4px;}
.sc-vl.te{color:${T.te};}.sc-vl.gr{color:${T.gr};}.sc-vl.rd{color:${T.rd};}

.sc-wd{font-size:11px;font-weight:500;font-style:italic;padding:3px 10px;border-radius:20px;display:inline-block;margin-top:3px;}
.sc-wd.te{background:${T.tel};color:${T.te};}.sc-wd.gr{background:${T.grb};color:${T.gr};}.sc-wd.rd{background:${T.rdb};color:${T.rd};}
.sc-ct{font-size:11px;color:${T.txf};margin-top:7px;display:flex;align-items:center;gap:5px;}
.sc-ct::before{content:'';width:4px;height:4px;border-radius:50%;background:${T.bdr2};display:inline-block;}

.fb{margin-top:14px;padding:11px 14px;border-radius:12px;border:1.5px dashed;display:flex;flex-direction:column;gap:4px;}
.fb.gr{background:${T.grb};border-color:${T.gr}44;}.fb.rd{background:${T.rdb};border-color:${T.rd}44;}.fb.te{background:${T.tel};border-color:${T.te}44;}
.fb-lb{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.fb-lb.gr{color:${T.gr};}.fb-lb.rd{color:${T.rd};}.fb-lb.te{color:${T.te};}
.fb-am{font-family:'Playfair Display',serif;font-size:19px;font-weight:800;line-height:1.2;}
.fb-am.gr{color:${T.gr};}.fb-am.rd{color:${T.rd};}.fb-am.te{color:${T.te};}
.fb-wd{font-size:10px;font-style:italic;margin-top:1px;}
.fb-wd.gr{color:${T.gr};}.fb-wd.rd{color:${T.rd};}.fb-wd.te{color:${T.te};}

/* ── CHART CARD ── */
.chart-card{
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:18px;
  padding:24px;margin-bottom:28px;box-shadow:${T.sh0};
}
@media(max-width:640px){.chart-card{padding:16px;}}
.chart-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:22px;}
.chart-title-row{display:flex;align-items:center;gap:12px;}
.chart-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;color:${T.tx};}
.year-select{
  background:${T.tel};border:1.5px solid ${T.tem};border-radius:20px;
  padding:6px 18px;font-size:12px;font-family:'DM Sans',sans-serif;
  color:${T.te};outline:none;cursor:pointer;appearance:none;
  font-weight:700;transition:all .2s;
}
.year-select:hover{background:${T.te};color:#fff;border-color:${T.te};}
.chart-legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;}
.ldot{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:${T.txm};}
.ldot::before{content:'';width:12px;height:12px;border-radius:4px;flex-shrink:0;}
.ldot.inc::before{background:${T.chartInc};}.ldot.exp::before{background:${T.chartExp};}
.yt-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px;}
.yt{
  display:flex;align-items:center;gap:12px;
  background:${T.sfc2};border:1px solid ${T.bdr};border-radius:14px;
  padding:12px 18px;flex:1;min-width:120px;
  transition:border-color .2s;
}
.yt:hover{border-color:${T.bdr2};}
.yt-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.yt-icon.gr{background:${T.grb};}.yt-icon.rd{background:${T.rdb};}.yt-icon.te{background:${T.tel};}
.yt-info{display:flex;flex-direction:column;gap:2px;}
.yt-lb{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${T.txf};}
.yt-vl{font-family:'Playfair Display',serif;font-size:17px;font-weight:800;line-height:1.2;}
.yt-vl.gr{color:${T.gr};}.yt-vl.rd{color:${T.rd};}.yt-vl.te{color:${T.te};}
.mo-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:22px;}
.mo-table thead tr{background:${T.bg2};}
.mo-table th{padding:8px 14px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${T.txd};border-bottom:1px solid ${T.bdr};}
.mo-table th:not(:first-child){text-align:right;}
.mo-table td{padding:10px 14px;border-bottom:1px solid ${T.bdr};color:${T.tx};}
.mo-table td:not(:first-child){text-align:right;}
.mo-table tr:last-child td{border-bottom:none;}
.mo-table tr:hover td{background:${T.sfc2};transition:background .1s;}
.mo-name{font-weight:600;color:${T.tx};}
.mo-inc{color:${T.gr};font-weight:700;}.mo-exp{color:${T.rd};font-weight:700;}

/* ── RECEIPT ── */
.rcpt-upload{border:2px dashed ${T.bdr2};border-radius:12px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;background:${T.sfc2};position:relative;}
.rcpt-upload:hover,.rcpt-upload.dov{border-color:${T.bl};background:${T.blb};}
.rcpt-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.rcpt-upload-ico{font-size:24px;margin-bottom:6px;}
.rcpt-upload-lbl{font-size:12px;color:${T.txd};font-weight:600;}
.rcpt-upload-hint{font-size:10px;color:${T.txf};margin-top:3px;}
.rcpt-prev-row{display:flex;align-items:center;gap:12px;background:${T.blb};border:1.5px solid ${T.bl};border-radius:12px;padding:12px 16px;}
.rcpt-thumb{width:54px;height:54px;border-radius:10px;object-fit:cover;border:2px solid ${T.sfc};box-shadow:${T.sh0};cursor:pointer;flex-shrink:0;transition:transform .15s;}
.rcpt-thumb:hover{transform:scale(1.06);}
.rcpt-prev-info{flex:1;}
.rcpt-prev-name{font-size:12px;font-weight:700;color:${T.bl};}
.rcpt-prev-sub{font-size:10px;color:${T.txd};margin-top:2px;}
.rcpt-prev-btns{display:flex;gap:6px;}
.rcpt-badge{
  display:inline-flex;align-items:center;gap:4px;
  background:${T.blb};border:1px solid ${T.bl}44;border-radius:8px;
  padding:3px 9px;font-size:10px;font-weight:700;color:${T.bl};
  cursor:pointer;transition:all .15s;
  animation:rcptBadge .3s cubic-bezier(.34,1.56,.64,1) both;white-space:nowrap;
}
.rcpt-badge:hover{background:${T.bl};color:#fff;}
.rcpt-viewer-body{display:flex;flex-direction:column;align-items:center;padding:28px 24px;gap:16px;background:${T.sfc};}
.rcpt-viewer-img{width:100%;max-width:420px;max-height:520px;object-fit:contain;border-radius:14px;border:1.5px solid ${T.bdr};box-shadow:${T.sh};animation:imgZoom .3s cubic-bezier(.34,1.4,.64,1) both;cursor:zoom-in;}
.rcpt-viewer-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:${T.tx};text-align:center;}
.rcpt-viewer-sub{font-size:11px;color:${T.txd};margin-top:3px;text-align:center;}
.rcpt-viewer-no{display:flex;flex-direction:column;align-items:center;gap:12px;padding:44px 20px;color:${T.txf};background:${T.sfc};}
.view-img-btn{background:none;border:1.5px solid ${T.tem};border-radius:8px;padding:4px 12px;font-size:10px;font-weight:700;color:${T.te};cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;margin-top:4px;}
.view-img-btn:hover{background:${T.te};color:#fff;}

/* ── FAB ── */
.fab-c{position:fixed;bottom:30px;right:30px;z-index:400;display:flex;flex-direction:column;gap:10px;align-items:flex-end;}
@media(max-width:480px){.fab-c{bottom:18px;right:14px;}}
.fab-toggle{
  width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  font-size:24px;font-weight:700;color:#fff;
  box-shadow:0 8px 28px rgba(0,0,0,.32);
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;
  animation:fP .5s cubic-bezier(.34,1.56,.64,1) both;
  background:linear-gradient(135deg,${T.te},#0a7d74);flex-shrink:0;
}
.fab-toggle:hover{transform:scale(1.1);box-shadow:0 12px 36px rgba(0,0,0,.36);}
.fab-toggle.open{transform:rotate(45deg);background:linear-gradient(135deg,#4b5563,#1f2937);}
.fab-toggle.open:hover{transform:rotate(45deg) scale(1.1);}
.fab-actions{display:flex;flex-direction:column;gap:10px;align-items:flex-end;}
.fab{
  display:flex;align-items:center;gap:10px;border:none;border-radius:50px;
  padding:12px 22px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;cursor:pointer;
  box-shadow:0 6px 22px rgba(0,0,0,.28);
  transition:transform .2s,box-shadow .2s;
  animation:fabSlide .3s cubic-bezier(.34,1.4,.64,1) both;
}
.fab:nth-child(1){animation-delay:.04s;}.fab:nth-child(2){animation-delay:.1s;}
.fab:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 12px 30px rgba(0,0,0,.32);}
.fab-exp{background:linear-gradient(135deg,${T.rd},${T.rdd});color:#fff;}
.fab-inc{background:linear-gradient(135deg,${T.gr},${T.grd});color:#fff;}
.fab-ic{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;background:rgba(255,255,255,.22);flex-shrink:0;}

/* ── MODAL ── */
.mov{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:mBI .2s ease both;}
.mov.cl{opacity:0;transition:opacity .22s;}
.mbox{background:${T.sfc};border-radius:22px;width:100%;max-width:580px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:${T.shl};animation:mI .3s cubic-bezier(.34,1.4,.64,1) both;border:1px solid ${T.bdr};}
.mbox.cl{animation:mO .22s ease both;}
.mbox.wide{max-width:700px;}.mbox.rcpt-modal{max-width:500px;}
.mhd{padding:20px 24px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${T.bdr};}
.mhd.eh{background:${T.rdb};}.mhd.ih{background:${T.grb};}.mhd.th{background:${T.tel};}.mhd.bh{background:${T.blb};}
.mhl{display:flex;align-items:center;gap:14px;}
.mti{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.mti.e{background:${T.rdb};}.mti.i{background:${T.grb};}.mti.t{background:${T.tel};}.mti.b{background:${T.blb};}
.mt{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:${T.tx};}
.ms{font-size:11px;color:${T.txd};margin-top:2px;}
.mcb{width:34px;height:34px;border-radius:50%;border:1px solid ${T.bdr};background:${T.sfc2};color:${T.txd};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .18s;flex-shrink:0;}
.mcb:hover{background:${T.rdb};color:${T.rd};border-color:${T.rd}44;}
.mb{overflow-y:auto;padding:22px 24px;flex:1;background:${T.sfc};}
.mb::-webkit-scrollbar{width:5px;}.mb::-webkit-scrollbar-thumb{background:${T.bdr2};border-radius:4px;}.mb::-webkit-scrollbar-track{background:transparent;}
@media(max-width:480px){.mb{padding:16px;}}
.mft{padding:16px 24px;border-top:1px solid ${T.bdr};background:${T.sfc2};display:flex;gap:10px;flex-wrap:wrap;}

/* ── FORM ── */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:480px){.fg{grid-template-columns:1fr;gap:10px;}}
.fcf{grid-column:1/-1;}
.fw{display:flex;flex-direction:column;gap:6px;}
.fl{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${T.txm};}
.pi,.ps,.pt{
  width:100%;background:${T.bg2};border:1.5px solid ${T.bdr};border-radius:10px;
  padding:11px 14px;font-size:14px;font-family:'DM Sans',sans-serif;color:${T.tx};
  outline:none;transition:border-color .2s,background .2s,box-shadow .2s;appearance:none;
}
.pt{resize:vertical;min-height:72px;}
.pi::placeholder,.pt::placeholder{color:${T.txf};}
.pi:focus,.ps:focus,.pt:focus{border-color:${T.te};background:${T.sfc};box-shadow:0 0 0 3px ${T.te}1e;}
.ps{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23948c82' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:38px;}
select option{background:${T.sfc};color:${T.tx};}
.ap{border-radius:10px;padding:10px 14px;margin-top:5px;display:flex;align-items:center;justify-content:space-between;}
.ap.e{background:${T.rdb};border:1.5px solid ${T.rd}22;}.ap.i{background:${T.grb};border:1.5px solid ${T.gr}22;}
.ap-lb{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;}
.ap-lb.e{color:${T.rd};}.ap-lb.i{color:${T.gr};}
.ap-vl{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;}
.ap-vl.e{color:${T.rd};}.ap-vl.i{color:${T.gr};}

/* ── PAYEE AUTOCOMPLETE ── */
.pw{position:relative;}
.pdd{position:absolute;top:calc(100% + 5px);left:0;right:0;z-index:700;background:${T.sfc};border:1.5px solid ${T.bdr};border-radius:14px;box-shadow:${T.shl};overflow:hidden;animation:sD .15s ease both;max-height:230px;overflow-y:auto;}
.pdd::-webkit-scrollbar{width:4px;}.pdd::-webkit-scrollbar-thumb{background:${T.bdr2};border-radius:4px;}
.pdi{padding:10px 14px;font-size:13px;cursor:pointer;color:${T.txm};transition:background .12s;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${T.bdr};}
.pdi:last-child{border-bottom:none;}
.pdi:hover,.pdi.hl{background:${T.tel};color:${T.te};}
.pdi-av{width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0;background:${T.tel};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
.pci{padding:10px 14px;font-size:13px;cursor:pointer;background:${T.grb};color:${T.gr};font-weight:600;display:flex;align-items:center;gap:8px;}
.pci:hover{filter:brightness(.95);}
.psr{display:flex;align-items:center;gap:12px;background:${T.sfc2};border:1.5px solid ${T.bdr};border-radius:10px;padding:10px 14px;}
.psn{font-size:14px;font-weight:600;color:${T.tx};flex:1;}
.psc{font-size:11px;font-weight:700;color:${T.te};cursor:pointer;padding:4px 10px;border-radius:7px;border:1.5px solid ${T.tem};background:${T.tel};transition:all .15s;}
.psc:hover{background:${T.te};color:#fff;}

/* ── IMAGE UPLOAD ── */
.iuz{border:2px dashed ${T.bdr2};border-radius:12px;padding:18px;text-align:center;cursor:pointer;transition:all .2s;background:${T.sfc2};position:relative;}
.iuz:hover,.iuz.dov{border-color:${T.te};background:${T.tel};}
.iuz input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.iur{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
.ipw{position:relative;display:inline-block;}
.iprv{width:82px;height:82px;border-radius:50%;object-fit:cover;border:3px solid ${T.sfc};box-shadow:${T.sh0};display:block;}
.irb{position:absolute;top:-4px;right:-4px;width:24px;height:24px;border-radius:50%;background:${T.rd};color:#fff;border:2px solid ${T.sfc};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:transform .15s;}
.irb:hover{transform:scale(1.2);}

/* ── PROFILE MODAL ── */
.ph{display:flex;flex-direction:column;align-items:center;padding:28px 24px 18px;text-align:center;border-bottom:1px solid ${T.bdr};background:${T.tel};}
.pab{width:94px;height:94px;border-radius:50%;overflow:hidden;border:4px solid ${T.sfc};box-shadow:${T.sh};margin-bottom:14px;background:${T.tel};display:flex;align-items:center;justify-content:center;font-size:34px;animation:aP .35s cubic-bezier(.34,1.56,.64,1) both;cursor:pointer;transition:transform .2s;}
.pab:hover{transform:scale(1.04);}
.pnm{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:${T.tx};margin-bottom:4px;}
.psr-r{display:flex;gap:14px;margin-top:12px;flex-wrap:wrap;justify-content:center;}
.pst{background:${T.sfc};border:1px solid ${T.bdr};border-radius:12px;padding:10px 18px;text-align:center;}
.pstv{font-family:'Playfair Display',serif;font-size:19px;font-weight:800;line-height:1.2;}
.pstv.gr{color:${T.gr};}.pstv.rd{color:${T.rd};}.pstv.te{color:${T.te};}
.pstl{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${T.txf};margin-top:3px;}
.ptl{display:flex;flex-direction:column;gap:8px;margin-top:6px;}
.pti{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:${T.sfc2};border:1px solid ${T.bdr};border-radius:12px;gap:10px;transition:border-color .15s;}
.pti:hover{border-color:${T.bdr2};}
.ptil{display:flex;flex-direction:column;gap:2px;}
.ptidate{font-size:11px;color:${T.txf};}
.ptidesc{font-size:13px;color:${T.txm};font-weight:500;}
.pticat{font-size:10px;background:${T.blb};color:${T.bl};padding:2px 8px;border-radius:6px;font-weight:700;display:inline-block;margin-top:3px;}
.ptir{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.ptia{font-family:'Playfair Display',serif;font-size:16px;font-weight:800;}
.ptia.i{color:${T.gr};}.ptia.e{color:${T.rd};}
.ptim{font-size:10px;color:${T.txf};}
.pl{display:flex;flex-direction:column;gap:8px;}
.pli{display:flex;align-items:center;gap:12px;padding:12px 14px;background:${T.sfc2};border:1px solid ${T.bdr};border-radius:12px;transition:all .15s;}
.pli:hover{border-color:${T.tem};background:${T.tel};}
.pla{width:42px;height:42px;border-radius:50%;overflow:hidden;background:${T.tel};display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;cursor:pointer;transition:transform .15s;}
.pla:hover{transform:scale(1.08);}
.plnm{font-size:14px;font-weight:600;color:${T.tx};flex:1;cursor:pointer;}
.plnm:hover{color:${T.te};}
.plct{font-size:11px;color:${T.txf};}
.plas{display:flex;gap:6px;}
.slb{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${T.txf};margin:16px 0 10px;display:flex;align-items:center;gap:8px;}
.slb::after{content:'';flex:1;height:1px;background:${T.bdr};}

/* ── BUTTONS ── */
.btn{padding:10px 22px;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px;}
.btn:hover{opacity:.88;transform:translateY(-1px);box-shadow:${T.sh};}
.btn:active{transform:translateY(0);}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important;}
.btn-gr{background:${T.gr};color:#fff;}.btn-rd{background:${T.rd};color:#fff;}.btn-te{background:${T.te};color:#fff;}.btn-bl{background:${T.bl};color:#fff;}
.btn-ol{background:transparent;color:${T.txm};border:1.5px solid ${T.bdr2};}
.btn-ol:hover{border-color:${T.te};color:${T.te};background:${T.tel};box-shadow:none;}
.btn-fl{flex:1;justify-content:center;}
.bsp{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
.bg{background:none;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
.bg.ed{color:${T.te};}.bg.ed:hover{background:${T.tel};}
.bg.dl{color:${T.txf};}.bg.dl:hover{color:${T.rd};background:${T.rdb};}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:30px;left:30px;z-index:999;
  background:${T.gr};color:#fff;border-radius:14px;
  padding:12px 18px;font-size:13px;font-weight:600;
  box-shadow:${T.sh};display:flex;align-items:center;gap:9px;
  animation:tI .3s cubic-bezier(.34,1.4,.64,1) both;max-width:calc(100vw - 60px);
}
.toast.hd{animation:tO .25s ease forwards;}.toast.er{background:${T.rd};}
@media(max-width:480px){.toast{left:14px;bottom:90px;}}

/* ── CONTROLS ── */
.pr-ctrl{
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:18px;
  padding:18px 20px;margin-bottom:16px;box-shadow:${T.sh0};
}
.pr-cr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}

/* ── SEARCH BOX ── */
.sw{position:relative;flex:1;min-width:220px;}
.si{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:${T.txf};font-size:14px;pointer-events:none;z-index:1;}
.sr{
  width:100%;background:${T.bg2};border:1.5px solid ${T.bdr};border-radius:12px;
  padding:11px 14px 11px 42px;font-size:13px;font-family:'DM Sans',sans-serif;
  color:${T.tx};outline:none;transition:all .2s;
}
.sr::placeholder{color:${T.txf};}
.sr:focus{
  border-color:${T.te};background:${T.sfc};
  box-shadow:0 0 0 3px ${T.te}1e;
}

/* ── SEARCH SUGGESTIONS ── */
.srch-sug{
  position:absolute;top:calc(100% + 7px);left:0;right:0;z-index:800;
  background:${T.sfc};
  border:1.5px solid ${T.bdr};
  border-radius:16px;
  box-shadow:${T.shl};
  overflow:hidden;
  animation:sugIn .18s cubic-bezier(.34,1.2,.64,1) both;
}
.srch-sug-hd{
  padding:10px 16px 8px;
  font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
  color:${T.txf};
  background:${T.bg2};
  border-bottom:1px solid ${T.bdr};
  display:flex;align-items:center;gap:8px;
}
.srch-sug-hd::before{
  content:'';display:inline-block;width:7px;height:7px;
  border-radius:50%;background:${T.te};flex-shrink:0;
}
.srch-sug-scroll{
  max-height:380px;
  overflow-y:auto;
}
@media(max-width:768px){.srch-sug-scroll{max-height:260px;}}
.srch-sug-scroll::-webkit-scrollbar{width:4px;}
.srch-sug-scroll::-webkit-scrollbar-thumb{background:${T.bdr2};border-radius:4px;}
.srch-sug-scroll::-webkit-scrollbar-track{background:transparent;}
.srch-sug-item{
  padding:12px 16px;font-size:13px;cursor:pointer;
  display:flex;align-items:center;gap:13px;
  border-bottom:1px solid ${T.bdr};
  transition:background .1s;
}
.srch-sug-item:last-child{border-bottom:none;}
.srch-sug-item:hover{background:${T.tel};}
.srch-sug-item:hover .srch-sug-name{color:${T.te};}
.srch-sug-av{
  width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;
  background:${T.tel};display:flex;align-items:center;justify-content:center;
  font-size:15px;font-weight:700;color:${T.te};
  border:2px solid ${T.bdr};
}
.srch-sug-info{flex:1;min-width:0;}
.srch-sug-name{font-size:13px;font-weight:600;color:${T.tx};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.srch-sug-meta{font-size:11px;color:${T.txf};margin-top:2px;}
.srch-sug-pill{
  display:inline-flex;align-items:center;
  background:${T.tel};color:${T.te};
  font-size:10px;font-weight:700;
  padding:3px 10px;border-radius:20px;
  flex-shrink:0;white-space:nowrap;
  border:1px solid ${T.tem};
}
.srch-sug-ft{
  padding:9px 16px;background:${T.bg2};
  border-top:1px solid ${T.bdr};
  display:flex;align-items:center;justify-content:space-between;
}
.srch-sug-ft-ct{font-size:10px;color:${T.txf};font-weight:600;}
.srch-sug-ft-act{
  font-size:10px;color:${T.te};font-weight:700;cursor:pointer;
  background:none;border:none;font-family:'DM Sans',sans-serif;
  padding:0;transition:opacity .15s;letter-spacing:.04em;
}
.srch-sug-ft-act:hover{opacity:.7;}

/* ── FILTER SELECTS ── */
.fs{
  background:${T.bg2};border:1.5px solid ${T.bdr};border-radius:10px;
  padding:10px 14px;font-size:12px;font-family:'DM Sans',sans-serif;
  color:${T.txm};outline:none;cursor:pointer;transition:border-color .2s;
  appearance:none;min-width:130px;
}
.fs:focus{border-color:${T.te};}
.fs.af{border-color:${T.te};background:${T.tel};color:${T.te};font-weight:700;}
.cb{
  background:none;border:1.5px solid ${T.bdr};border-radius:10px;
  padding:9px 14px;font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;
  color:${T.txd};cursor:pointer;transition:all .15s;
  letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;
}
.cb:hover{color:${T.rd};border-color:${T.rd};background:${T.rdb};}
.rc{font-size:11px;font-weight:600;color:${T.txd};letter-spacing:.06em;white-space:nowrap;margin-left:auto;}

.afr{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:12px;}
.fp{display:inline-flex;align-items:center;gap:5px;background:${T.tel};border:1.5px solid ${T.tem};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:${T.te};}
.fpx{background:none;border:none;cursor:pointer;color:${T.te};font-size:15px;line-height:1;padding:0;display:flex;align-items:center;transition:color .12s;}
.fpx:hover{color:${T.rd};}

@media(max-width:640px){
  .pr-cr{flex-direction:column;align-items:stretch;}
  .fs{width:100%;}
  .rc{margin-left:0;text-align:right;}
}

/* ── TABLE ── */
.pr-tbl{
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:18px;
  overflow:hidden;box-shadow:${T.sh0};margin-bottom:22px;
}
.tscr{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tscr::-webkit-scrollbar{height:5px;}.tscr::-webkit-scrollbar-thumb{background:${T.bdr2};border-radius:4px;}.tscr::-webkit-scrollbar-track{background:transparent;}
.tsh{display:none;font-size:10px;color:${T.txd};padding:6px 14px;text-align:center;border-bottom:1px solid ${T.bdr};background:${T.sfc2};}
@media(max-width:700px){.tsh{display:block;}}

table.pr-t{width:100%;border-collapse:collapse;font-size:13px;min-width:880px;}
table.pr-t thead{position:sticky;top:0;z-index:10;}
table.pr-t thead tr{background:${T.bg2};}
table.pr-t th{
  font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:${T.txd};padding:12px 14px;text-align:left;
  border-bottom:1px solid ${T.bdr};white-space:nowrap;
  user-select:none;cursor:pointer;transition:color .15s;
}
table.pr-t th:hover{color:${T.te};}
table.pr-t th.sa::after{content:' ↑';color:${T.te};}
table.pr-t th.sd::after{content:' ↓';color:${T.te};}
table.pr-t th.ns{cursor:default;}
table.pr-t th.rt,table.pr-t td.rt{text-align:right;}
table.pr-t td{padding:11px 14px;border-bottom:1px solid ${T.bdr};color:${T.tx};vertical-align:middle;transition:background .1s;}
table.pr-t tr:last-child td{border-bottom:none;}
table.pr-t tr:hover td{background:${T.sfc2};}

.sk{display:inline-block;height:12px;border-radius:4px;background:linear-gradient(90deg,${T.bg2} 25%,${T.bdr} 50%,${T.bg2} 75%);background-size:600px 100%;animation:sh 1.4s infinite;}

.tb{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;}
.tb-i{background:${T.grb};color:${T.gr};}.tb-e{background:${T.rdb};color:${T.rd};}

.ai{font-weight:800;color:${T.gr};font-size:13.5px;}
.ae{font-weight:800;color:${T.rd};font-size:13.5px;}

.cp{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${T.blb};color:${T.bl};max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.pyc{display:flex;align-items:center;gap:8px;cursor:pointer;}
.pyc-av{width:28px;height:28px;border-radius:50%;overflow:hidden;background:${T.pub};display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:1.5px solid ${T.bdr};}
.pyc-nm{font-size:12px;font-weight:600;color:${T.pu};max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s;}
.pyc:hover .pyc-nm{color:${T.te};text-decoration:underline;}

.sno{font-size:11px;color:${T.txf};font-weight:500;}
.dtc{font-size:12px;color:${T.txd};white-space:nowrap;font-weight:500;}
.ntc{font-size:12px;color:${T.txm};max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.ra{display:flex;gap:4px;justify-content:center;}
.rb{background:none;border:none;cursor:pointer;padding:6px;border-radius:7px;color:${T.txf};transition:all .15s;display:inline-flex;}
.rb.ed:hover{color:${T.te};background:${T.tel};}
.rb.dl:hover{color:${T.rd};background:${T.rdb};}

/* ── PAGINATION ── */
.pg{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;border-top:1px solid ${T.bdr};
  background:${T.sfc2};flex-wrap:wrap;gap:10px;
}
.pgi{font-size:12px;color:${T.txd};}
.pgi strong{color:${T.tx};font-weight:600;}
.pgbs{display:flex;gap:5px;align-items:center;flex-wrap:wrap;}
.pgb{
  min-width:34px;height:34px;padding:0 9px;
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:8px;
  font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;
  color:${T.txm};cursor:pointer;transition:all .15s;
  display:flex;align-items:center;justify-content:center;
}
.pgb:hover:not(:disabled){border-color:${T.te};color:${T.te};background:${T.tel};}
.pgb:disabled{opacity:.35;cursor:not-allowed;}
.pgb.ac{background:${T.te};color:#fff;border-color:${T.te};}
.pgs{
  background:${T.sfc};border:1px solid ${T.bdr};border-radius:8px;
  padding:0 12px;height:34px;font-size:12px;
  font-family:'DM Sans',sans-serif;color:${T.txm};outline:none;cursor:pointer;appearance:none;
}
.pgj{font-size:12px;color:${T.txd};display:flex;align-items:center;gap:6px;}
.pgj input{
  width:52px;background:${T.bg2};border:1.5px solid ${T.bdr};border-radius:7px;
  padding:6px 8px;font-size:12px;font-family:'DM Sans',sans-serif;color:${T.tx};
  outline:none;text-align:center;
}
.pgj input:focus{border-color:${T.te};}
@media(max-width:640px){.pg{flex-direction:column;align-items:flex-start;}}

/* ── EMPTY / LOADING ── */
.emp{text-align:center;padding:56px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;}
.emp-ic{font-size:38px;}
.emp-tt{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:${T.txm};}
.emp-sb{font-size:13px;color:${T.txf};}
.pr-lb{height:3px;background:linear-gradient(90deg,${T.te},${T.gr},${T.te});background-size:200% 100%;animation:sh 1.2s infinite;margin-bottom:-3px;}

@media(max-width:640px){
  .pr-hd{padding:12px 0 10px;margin-bottom:16px;}
  .pr-bdg{display:none;}
  .sc-vl{font-size:20px!important;}
  .mbox{max-width:100%!important;border-radius:16px;}
  .mhd{padding:16px 16px 14px;}
  .mb{padding:14px;}
  .mft{padding:12px 14px;}
}
`;

/* ═══════════ PAYEE AVATAR ═══════════ */
function Av({ name, map, size = 26, style = {} }) {
    const url = map?.[name]?.image_url;
    const ini = name ? name.charAt(0).toUpperCase() : "?";
    if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }} />;
    return <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--av-bg, #e0f2f0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#0d9488", flexShrink: 0, ...style }}>{ini}</div>;
}

/* ═══════════ PAYEE INPUT ═══════════ */
function PayeeInput({ value, onChange, payees, map, disabled }) {
    const [open, setOpen] = useState(false);
    const [hi, setHi] = useState(0);
    const ref = useRef(null);
    const filtered = useMemo(() => {
        if (!value.trim()) return payees.slice(0, 8);
        const q = value.toLowerCase();
        return payees.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
    }, [value, payees]);
    const showCreate = value.trim() && !payees.some(p => p.toLowerCase() === value.trim().toLowerCase());
    const showDD = open && (filtered.length > 0 || showCreate);
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);
    const sel = v => { onChange(v); setOpen(false); };
    const onKD = e => {
        if (!showDD) return;
        const tot = filtered.length + (showCreate ? 1 : 0);
        if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => (h + 1) % tot); }
        if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => (h - 1 + tot) % tot); }
        if (e.key === "Enter") { e.preventDefault(); hi < filtered.length ? sel(filtered[hi]) : showCreate && sel(value.trim()); }
        if (e.key === "Escape") setOpen(false);
    };
    return (
        <div className="pw" ref={ref}>
            <input className="pi" type="text" placeholder="Search or create payee…" value={value} disabled={disabled}
                onChange={e => { onChange(e.target.value); setOpen(true); setHi(0); }}
                onFocus={() => setOpen(true)} onKeyDown={onKD} autoComplete="off" />
            {showDD && (
                <div className="pdd">
                    {filtered.map((p, i) => (
                        <div key={p} className={`pdi${hi === i ? " hl" : ""}`} onMouseDown={() => sel(p)} onMouseEnter={() => setHi(i)}>
                            <div className="pdi-av"><Av name={p} map={map} size={28} /></div> {p}
                        </div>
                    ))}
                    {showCreate && <div className="pci" onMouseDown={() => sel(value.trim())}>＋ Create: <strong>"{value.trim()}"</strong></div>}
                </div>
            )}
        </div>
    );
}

/* ═══════════ IMAGE UPLOAD ═══════════ */
function ImgUpload({ value, onChange, label = "Profile Photo" }) {
    const [drag, setDrag] = useState(false);
    const prev = value instanceof File ? URL.createObjectURL(value) : value;
    return (
        <div className="fw">
            <label className="fl">{label}</label>
            {prev ? (
                <div className="iur">
                    <div className="ipw">
                        <img src={prev} alt="preview" className="iprv" />
                        <button className="irb" type="button" onClick={() => onChange(null)}>✕</button>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--txd,#948c82)" }}>
                        <div style={{ fontWeight: 600 }}>Photo set</div>
                        <label style={{ color: "var(--te,#0d9488)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>
                            Change<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className={`iuz${drag ? " dov" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) onChange(f); }}>
                    <input type="file" accept="image/*" onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                    <div style={{ fontSize: 26, marginBottom: 7 }}>📷</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Click or drag photo</div>
                    <div style={{ fontSize: 10, marginTop: 4, color: "var(--txf)" }}>JPG, PNG, WEBP · max 2MB</div>
                </div>
            )}
        </div>
    );
}

/* ═══════════ RECEIPT UPLOAD ═══════════ */
function ReceiptUpload({ value, onChange }) {
    const [drag, setDrag] = useState(false);
    const prev = value instanceof File ? URL.createObjectURL(value) : value;
    return (
        <div className="fw fcf">
            <label className="fl">💳 Payment Screenshot / Receipt (optional)</label>
            {prev ? (
                <div className="rcpt-prev-row">
                    <img src={prev} alt="receipt" className="rcpt-thumb" onClick={() => window.open(prev, "_blank")} />
                    <div className="rcpt-prev-info">
                        <div className="rcpt-prev-name">📄 Receipt attached</div>
                        <div className="rcpt-prev-sub">Click photo to preview</div>
                    </div>
                    <div className="rcpt-prev-btns">
                        <label className="btn btn-bl" style={{ padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
                            🔄 Change<input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                        </label>
                        <button className="btn btn-ol" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => onChange(null)}>✕</button>
                    </div>
                </div>
            ) : (
                <div className={`rcpt-upload${drag ? " dov" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}>
                    <input type="file" accept="image/*,application/pdf" onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                    <div className="rcpt-upload-ico">📲</div>
                    <div className="rcpt-upload-lbl">Upload UPI / Bank Screenshot or Receipt</div>
                    <div className="rcpt-upload-hint">JPG, PNG, PDF · Drag & drop or click</div>
                </div>
            )}
        </div>
    );
}

/* ═══════════ RECEIPT VIEWER MODAL ═══════════ */
function ReceiptViewerModal({ row, onClose, onReplace }) {
    const url = row?.receipt_url;
    const isPdf = url?.toLowerCase().includes(".pdf");
    return (
        <Modal onClose={onClose} rcpt>
            {(close) => (<>
                <div className="mhd bh">
                    <div className="mhl"><div className="mti b">💳</div>
                        <div><div className="mt">Payment Receipt</div>
                            <div className="ms">{row ? `${fmtDate(row.date)} · ₹${fmtIN(row.amount)} · ${row.payee_payer || "—"}` : ""}</div></div>
                    </div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                {url ? (
                    <div className="rcpt-viewer-body">
                        {isPdf ? (
                            <div style={{ textAlign: "center", padding: "24px" }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-bl">🔗 Open PDF</a>
                            </div>
                        ) : (
                            <img src={url} alt="receipt" className="rcpt-viewer-img" onClick={() => window.open(url, "_blank")} />
                        )}
                        <div><div className="rcpt-viewer-title">{row?.payment_method && `${row.payment_method} · `}₹{fmtIN(row?.amount)}</div>
                            <div className="rcpt-viewer-sub">{fmtDate(row?.date)} · {row?.payee_payer || "No payee"}</div>
                            {row?.description && <div style={{ fontSize: 12, marginTop: 5, textAlign: "center" }}>{row.description}</div>}</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-bl" style={{ textDecoration: "none" }}>🔗 Open Full Size</a>
                            <button className="btn btn-ol" onClick={() => { close(); setTimeout(onReplace, 250); }}>🔄 Replace</button>
                        </div>
                    </div>
                ) : (
                    <div className="rcpt-viewer-no">
                        <div style={{ fontSize: 44 }}>📭</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>No Receipt Attached</div>
                        <button className="btn btn-bl" onClick={() => { close(); setTimeout(onReplace, 250); }}>📲 Upload Receipt</button>
                    </div>
                )}
            </>)}
        </Modal>
    );
}

/* ═══════════ TOAST ═══════════ */
function Toast({ msg, type, onHide }) {
    const [hd, setHd] = useState(false);
    useEffect(() => {
        const t1 = setTimeout(() => setHd(true), 2600), t2 = setTimeout(onHide, 3000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    return <div className={`toast${type === "error" ? " er" : ""}${hd ? " hd" : ""}`}>{type === "error" ? "⚠️" : "✅"} {msg}</div>;
}

/* ═══════════ MODAL ═══════════ */
function Modal({ onClose, children, wide, rcpt }) {
    const [cl, setCl] = useState(false);
    const close = () => { setCl(true); setTimeout(onClose, 220); };
    useEffect(() => {
        const h = e => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", h);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
    }, []);
    return (
        <div className={`mov${cl ? " cl" : ""}`} onClick={e => e.target === e.currentTarget && close()}>
            <div className={`mbox${wide ? " wide" : ""}${rcpt ? " rcpt-modal" : ""}${cl ? " cl" : ""}`}>
                {typeof children === "function" ? children(close) : children}
            </div>
        </div>
    );
}

/* ═══════════ UPLOAD HELPERS ═══════════ */
async function uploadImg(name, file) {
    const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("payee-images").upload(path, file, { upsert: true });
    if (error) { console.error("Upload FAILED:", error.message); return null; }
    return supabase.storage.from("payee-images").getPublicUrl(path).data.publicUrl;
}
async function uploadReceipt(file) {
    const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, file, { upsert: true });
    if (error) { console.error("Receipt upload FAILED:", error.message); return null; }
    return supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ═══════════ YEAR CHART ═══════════ */
function YearChart({ rows, T }) {
    const chartRef = useRef(null);
    const chartInst = useRef(null);
    const availableYears = useMemo(() =>
        Array.from(new Set(rows.map(r => r.date?.slice(0, 4)).filter(Boolean))).sort((a, b) => b - a), [rows]);
    const [yr, setYr] = useState(() => {
        const curr = new Date().getFullYear().toString();
        return availableYears.includes(curr) ? curr : (availableYears[0] || curr);
    });
    useEffect(() => { if (availableYears.length && !availableYears.includes(yr)) setYr(availableYears[0]); }, [availableYears]);
    const monthData = useMemo(() => MONTHS.map((label, idx) => {
        const mo = String(idx + 1).padStart(2, "0"), prefix = `${yr}-${mo}`;
        const moRows = rows.filter(r => r.date?.startsWith(prefix));
        const income = moRows.filter(r => r.type === "income").reduce((s, r) => s + (r.amount || 0), 0);
        const expense = moRows.filter(r => r.type === "expense").reduce((s, r) => s + (r.amount || 0), 0);
        return { label, income, expense, net: income - expense, count: moRows.length };
    }), [rows, yr]);
    const yI = monthData.reduce((s, m) => s + m.income, 0);
    const yE = monthData.reduce((s, m) => s + m.expense, 0);
    const yN = yI - yE;
    const fmt = v => { if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`; if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`; if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)}K`; return `₹${Math.round(v)}`; };

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
        const build = () => {
            if (!window.Chart) return;
            chartInst.current = new window.Chart(chartRef.current, {
                type: "bar",
                data: {
                    labels: MONTHS, datasets: [
                        { label: "Income", data: monthData.map(m => m.income), backgroundColor: T.chartIncBg, borderColor: T.chartInc, borderWidth: 2, borderRadius: 7, borderSkipped: false },
                        { label: "Expense", data: monthData.map(m => m.expense), backgroundColor: T.chartExpBg, borderColor: T.chartExp, borderWidth: 2, borderRadius: 7, borderSkipped: false },
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: T.tooltipBg, titleColor: "#fff",
                            bodyColor: "rgba(255,255,255,.8)", padding: 14, cornerRadius: 12,
                            callbacks: { label: ctx => `  ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` }
                        }
                    },
                    scales: {
                        x: { grid: { color: T.chartGrid, drawBorder: false }, ticks: { color: T.chartTick, font: { family: "'DM Sans',sans-serif", size: 11, weight: "600" }, autoSkip: false, maxRotation: 0 }, border: { display: false } },
                        y: { grid: { color: T.chartGrid, drawBorder: false }, ticks: { color: T.chartTick, font: { family: "'DM Sans',sans-serif", size: 11 }, callback: fmt, maxTicksLimit: 6 }, border: { display: false }, beginAtZero: true },
                    }
                }
            });
        };
        if (window.Chart) build();
        else { const iv = setInterval(() => { if (window.Chart) { build(); clearInterval(iv); } }, 100); setTimeout(() => clearInterval(iv), 5000); }
        return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
    }, [monthData, yr, T]);

    useEffect(() => {
        if (window.Chart) return;
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
        document.head.appendChild(s);
    }, []);

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title-row">
                    <span className="chart-title">📊 Year-wise Analysis</span>
                    {availableYears.length > 0 && <select className="year-select" value={yr} onChange={e => setYr(e.target.value)}>{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>}
                </div>
                <div className="chart-legend"><span className="ldot inc">Income</span><span className="ldot exp">Expense</span></div>
            </div>
            <div className="yt-row">
                <div className="yt"><div className="yt-icon gr">▲</div><div className="yt-info"><div className="yt-lb">Income {yr}</div><div className="yt-vl gr">₹{fmtIN(yI)}</div></div></div>
                <div className="yt"><div className="yt-icon rd">▼</div><div className="yt-info"><div className="yt-lb">Expense {yr}</div><div className="yt-vl rd">₹{fmtIN(yE)}</div></div></div>
                <div className="yt"><div className="yt-icon te">{yN >= 0 ? "📈" : "📉"}</div><div className="yt-info"><div className="yt-lb">Net {yr}</div><div className={`yt-vl ${yN >= 0 ? "te" : "rd"}`}>{yN < 0 ? "−" : ""}₹{fmtIN(Math.abs(yN))}</div></div></div>
            </div>
            {availableYears.length === 0
                ? <div style={{ textAlign: "center", padding: "44px", fontSize: 13 }}>No data yet</div>
                : <>
                    <div style={{ position: "relative", width: "100%", height: 250, marginBottom: 8 }}><canvas ref={chartRef} /></div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="mo-table">
                            <thead><tr><th style={{ textAlign: "left" }}>Month</th><th>Income</th><th>Expense</th><th>Net</th><th>Txns</th></tr></thead>
                            <tbody>
                                {monthData.filter(m => m.count > 0).length === 0
                                    ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", fontSize: 13 }}>No transactions in {yr}</td></tr>
                                    : monthData.filter(m => m.count > 0).map(m => (
                                        <tr key={m.label}>
                                            <td className="mo-name">{m.label} {yr}</td>
                                            <td className="mo-inc">+₹{fmtIN(m.income)}</td>
                                            <td className="mo-exp">−₹{fmtIN(m.expense)}</td>
                                            <td style={{ fontWeight: 700, color: m.net >= 0 ? T.te : T.rd }}>{m.net < 0 ? "−" : ""}₹{fmtIN(Math.abs(m.net))}</td>
                                            <td style={{ color: T.txf, fontWeight: 500 }}>{m.count}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </>
            }
        </div>
    );
}

/* ═══════════ ADD MODAL ═══════════ */
const EF = { date: today(), amount: "", category: "", subcategory: "", payee_payer: "", payment_method: "Cash", description: "", account: "Personal Expense" };
function AddModal({ type, onClose, onSaved, payees, map, ensurePayeeLocal }) {
    const [f, setF] = useState(EF);
    const [payeePhoto, setPayeePhoto] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [sv, setSv] = useState(false);
    const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
    const isE = type === "expense";
    const amt = Number(f.amount);
    const selectedInfo = map[f.payee_payer];
    const save = async (close) => {
        if (!amt || amt <= 0 || !f.date) return;
        setSv(true);
        await ensurePayeeLocal(f.payee_payer, payeePhoto);
        let receipt_url = null;
        if (receiptFile) receipt_url = await uploadReceipt(receiptFile);
        const { error } = await supabase.from("personal_expenses").insert([{
            date: f.date, amount: amt, type, category: f.category || null, subcategory: f.subcategory || null,
            payee_payer: f.payee_payer.trim() || null, payment_method: f.payment_method || null,
            description: f.description.trim() || null, account: f.account.trim() || null,
            receipt_url: receipt_url || null, raw_row: {},
        }]);
        setSv(false);
        if (error) { onSaved(false, "Failed: " + error.message); return; }
        onSaved(true, isE ? "Expense added!" : "Income added!"); close();
    };
    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className={`mhd ${isE ? "eh" : "ih"}`}>
                    <div className="mhl"><div className={`mti ${isE ? "e" : "i"}`}>{isE ? "▼" : "▲"}</div>
                        <div><div className="mt">{isE ? "Add Expense" : "Add Income"}</div><div className="ms">{isE ? "Record a spending" : "Record an income"}</div></div></div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div className="fg">
                        <div className="fw"><label className="fl">Amount (₹) *</label>
                            <input className="pi" type="number" placeholder="0.00" value={f.amount} autoFocus onChange={e => sf("amount", e.target.value)} />
                            {amt > 0 && <div className={`ap ${isE ? "e" : "i"}`}><span className={`ap-lb ${isE ? "e" : "i"}`}>{isE ? "Spending" : "Receiving"}</span><span className={`ap-vl ${isE ? "e" : "i"}`}>{isE ? "−" : "+"}₹{fmtIN(amt)}</span></div>}
                        </div>
                        <div className="fw"><label className="fl">Date *</label><input className="pi" type="date" value={f.date} onChange={e => sf("date", e.target.value)} /></div>
                        <div className="fw"><label className="fl">Category</label>
                            <select className="ps" value={f.category} onChange={e => sf("category", e.target.value)}><option value="">Select…</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
                        </div>
                        <div className="fw"><label className="fl">Subcategory</label><input className="pi" type="text" placeholder="Optional…" value={f.subcategory} onChange={e => sf("subcategory", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Payee / Payer</label>
                            {selectedInfo
                                ? <div className="psr"><Av name={f.payee_payer} map={map} size={36} /><span className="psn">{f.payee_payer}</span><button className="psc" onClick={() => sf("payee_payer", "")}>Change</button></div>
                                : <PayeeInput value={f.payee_payer} onChange={v => sf("payee_payer", v)} payees={payees} map={map} disabled={sv} />
                            }
                        </div>
                        {f.payee_payer.trim() && !selectedInfo && <div className="fw fcf"><ImgUpload value={payeePhoto} onChange={setPayeePhoto} label="Payee Profile Photo (optional)" /></div>}
                        <div className="fw"><label className="fl">Payment Method</label>
                            <select className="ps" value={f.payment_method} onChange={e => sf("payment_method", e.target.value)}>{["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other"].map(m => <option key={m}>{m}</option>)}</select>
                        </div>
                        <div className="fw"><label className="fl">Account</label><input className="pi" type="text" placeholder="e.g. Personal…" value={f.account} onChange={e => sf("account", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Description / Note</label><input className="pi" type="text" placeholder="Optional note…" value={f.description} onChange={e => sf("description", e.target.value)} /></div>
                        <ReceiptUpload value={receiptFile} onChange={setReceiptFile} />
                    </div>
                </div>
                <div className="mft">
                    <button className={`btn ${isE ? "btn-rd" : "btn-gr"} btn-fl`} onClick={() => save(close)} disabled={sv || !amt || amt <= 0 || !f.date}>
                        {sv ? <><span className="bsp" />Saving…</> : isE ? "▼ Save Expense" : "▲ Save Income"}
                    </button>
                    <button className="btn btn-ol" onClick={close}>Cancel</button>
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ EDIT MODAL ═══════════ */
function EditModal({ row, onClose, onSaved, payees, map, ensurePayeeLocal }) {
    const [f, setF] = useState({ date: row.date || today(), amount: String(row.amount || ""), category: row.category || "", subcategory: row.subcategory || "", payee_payer: row.payee_payer || "", payment_method: row.payment_method || "Cash", description: row.description || "", account: row.account || "" });
    const [receiptFile, setReceiptFile] = useState(null);
    const [currentReceipt, setCurrentReceipt] = useState(row.receipt_url || null);
    const [sv, setSv] = useState(false);
    const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
    const isE = row.type === "expense";
    const amt = Number(f.amount);
    const save = async (close) => {
        if (!amt || amt <= 0 || !f.date) return;
        setSv(true);
        await ensurePayeeLocal(f.payee_payer);
        let receipt_url = currentReceipt;
        if (receiptFile) receipt_url = await uploadReceipt(receiptFile);
        const { error } = await supabase.from("personal_expenses").update({
            date: f.date, amount: amt, category: f.category || null, subcategory: f.subcategory || null,
            payee_payer: f.payee_payer.trim() || null, payment_method: f.payment_method || null,
            description: f.description.trim() || null, account: f.account.trim() || null,
            receipt_url: receipt_url || null,
        }).eq("id", row.id);
        setSv(false);
        if (error) { onSaved(false, "Failed: " + error.message); return; }
        onSaved(true, "Entry updated!"); close();
    };
    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className={`mhd ${isE ? "eh" : "ih"}`}>
                    <div className="mhl"><div className={`mti ${isE ? "e" : "i"}`}>✏️</div>
                        <div><div className="mt">Edit Entry</div><div className="ms">{isE ? "Expense" : "Income"} · {fmtDate(row.date)}</div></div></div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div className="fg">
                        <div className="fw"><label className="fl">Amount (₹) *</label>
                            <input className="pi" type="number" value={f.amount} autoFocus onChange={e => sf("amount", e.target.value)} />
                            {amt > 0 && <div className={`ap ${isE ? "e" : "i"}`}><span className={`ap-lb ${isE ? "e" : "i"}`}>{isE ? "Spending" : "Receiving"}</span><span className={`ap-vl ${isE ? "e" : "i"}`}>{isE ? "−" : "+"}₹{fmtIN(amt)}</span></div>}
                        </div>
                        <div className="fw"><label className="fl">Date *</label><input className="pi" type="date" value={f.date} onChange={e => sf("date", e.target.value)} /></div>
                        <div className="fw"><label className="fl">Category</label>
                            <select className="ps" value={f.category} onChange={e => sf("category", e.target.value)}><option value="">Select…</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
                        </div>
                        <div className="fw"><label className="fl">Subcategory</label><input className="pi" type="text" value={f.subcategory} onChange={e => sf("subcategory", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Payee / Payer</label>
                            <PayeeInput value={f.payee_payer} onChange={v => sf("payee_payer", v)} payees={payees} map={map} />
                        </div>
                        <div className="fw"><label className="fl">Payment Method</label>
                            <select className="ps" value={f.payment_method} onChange={e => sf("payment_method", e.target.value)}>{["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other"].map(m => <option key={m}>{m}</option>)}</select>
                        </div>
                        <div className="fw"><label className="fl">Account</label><input className="pi" type="text" value={f.account} onChange={e => sf("account", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Description / Note</label><input className="pi" type="text" value={f.description} onChange={e => sf("description", e.target.value)} /></div>
                        {currentReceipt && !receiptFile
                            ? <div className="fw fcf"><label className="fl">💳 Current Receipt</label>
                                <div className="rcpt-prev-row">
                                    <img src={currentReceipt} alt="receipt" className="rcpt-thumb" onClick={() => window.open(currentReceipt, "_blank")} />
                                    <div className="rcpt-prev-info"><div className="rcpt-prev-name">Receipt attached</div><div className="rcpt-prev-sub">Click to view</div></div>
                                    <div className="rcpt-prev-btns">
                                        <label className="btn btn-bl" style={{ padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>🔄<input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => e.target.files[0] && setReceiptFile(e.target.files[0])} /></label>
                                        <button className="btn btn-ol" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => setCurrentReceipt(null)}>✕</button>
                                    </div>
                                </div>
                            </div>
                            : <ReceiptUpload value={receiptFile} onChange={v => { setReceiptFile(v); if (!v) setCurrentReceipt(null); }} />
                        }
                    </div>
                </div>
                <div className="mft">
                    <button className="btn btn-te btn-fl" onClick={() => save(close)} disabled={sv || !amt || !f.date}>
                        {sv ? <><span className="bsp" />Saving…</> : "💾 Update Entry"}
                    </button>
                    <button className="btn btn-ol" onClick={close}>Cancel</button>
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ PROFILE MODAL ═══════════ */
function ProfileModal({ payee, onClose, onEditPayee, onDeletePayee, onViewImage, rows, map }) {
    const txns = useMemo(() => rows.filter(r => r.payee_payer === payee).sort((a, b) => new Date(b.date) - new Date(a.date)), [rows, payee]);
    const inc = txns.filter(r => r.type === "income").reduce((s, r) => s + (r.amount || 0), 0);
    const exp = txns.filter(r => r.type === "expense").reduce((s, r) => s + (r.amount || 0), 0);
    return (
        <Modal onClose={onClose} wide>
            {(close) => (<>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 18px 0" }}>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="ph">
                    <div className="pab" onClick={() => onViewImage(close)}><Av name={payee} map={map} size={86} /></div>
                    <div className="pnm">{payee}</div>
                    <div style={{ fontSize: 12, color: "var(--txd)" }}>{txns.length} transaction{txns.length !== 1 ? "s" : ""}</div>
                    <button className="view-img-btn" onClick={() => onViewImage(close)}>🖼️ {map[payee]?.image_url ? "View Photo" : "Add Photo"}</button>
                    <div className="psr-r">
                        <div className="pst"><div className="pstv gr">+₹{fmtIN(inc)}</div><div className="pstl">Income</div></div>
                        <div className="pst"><div className="pstv rd">−₹{fmtIN(exp)}</div><div className="pstl">Expense</div></div>
                        <div className="pst"><div className={`pstv ${inc - exp >= 0 ? "te" : "rd"}`}>{inc - exp < 0 ? "−" : ""}₹{fmtIN(Math.abs(inc - exp))}</div><div className="pstl">Net</div></div>
                    </div>
                </div>
                <div className="mb">
                    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                        <button className="btn btn-te" onClick={() => onEditPayee(close)}>✏️ Edit Payee</button>
                        <button className="btn btn-ol" style={{ color: "var(--rd)" }} onClick={() => onDeletePayee(close)}>🗑 Delete</button>
                    </div>
                    <div className="slb">Transactions</div>
                    {txns.length === 0
                        ? <div style={{ textAlign: "center", padding: "28px", fontSize: 13 }}>No transactions</div>
                        : <div className="ptl">
                            {txns.slice(0, 50).map(r => (
                                <div className="pti" key={r.id}>
                                    <div className="ptil">
                                        <div className="ptidate">{fmtDate(r.date)}</div>
                                        <div className="ptidesc">{r.description || r.category || "—"}</div>
                                        {r.category && <span className="pticat">{r.category}</span>}
                                    </div>
                                    <div className="ptir">
                                        <div className={`ptia ${r.type === "income" ? "i" : "e"}`}>{r.type === "income" ? "+" : "−"}₹{fmtIN(r.amount)}</div>
                                        {r.payment_method && <div className="ptim">{r.payment_method}</div>}
                                        {r.receipt_url && <button className="rcpt-badge" onClick={() => window.open(r.receipt_url, "_blank")}>💳 Receipt</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ EDIT PAYEE MODAL ═══════════ */
function EditPayeeModal({ payee, map, onClose, onSaved }) {
    const info = map[payee] || {};
    const [name, setName] = useState(payee);
    const [pf, setPf] = useState(null);
    const [sv, setSv] = useState(false);
    const currImg = pf ? URL.createObjectURL(pf) : info.image_url;
    const save = async (close) => {
        setSv(true);
        let img_url = info.image_url || null;
        if (pf) img_url = await uploadImg(name.trim() || payee, pf);
        const trimmed = name.trim() || payee;
        if (trimmed !== payee) {
            await supabase.from("payees").upsert([{ name: trimmed, image_url: img_url }], { onConflict: "name" });
            await supabase.from("personal_expenses").update({ payee_payer: trimmed }).eq("payee_payer", payee);
            await supabase.from("payees").delete().eq("name", payee);
        } else {
            await supabase.from("payees").upsert([{ name: payee, image_url: img_url }], { onConflict: "name" });
        }
        setSv(false); onSaved(); close();
    };
    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className="mhd th"><div className="mhl"><div className="mti t">👤</div><div><div className="mt">Edit Payee</div><div className="ms">Update name or photo</div></div></div><button className="mcb" onClick={close}>✕</button></div>
                <div className="mb">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                        <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--tem)" }}>
                            <Av name={payee} map={{ [payee]: { image_url: currImg } }} size={84} />
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <ImgUpload value={pf} onChange={setPf} label="Update Photo" />
                        <div className="fw"><label className="fl">Payee Name</label><input className="pi" type="text" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
                    </div>
                </div>
                <div className="mft">
                    <button className="btn btn-te btn-fl" onClick={() => save(close)} disabled={sv || !name.trim()}>{sv ? <><span className="bsp" />Saving…</> : "💾 Save Changes"}</button>
                    <button className="btn btn-ol" onClick={close}>Cancel</button>
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ IMAGE VIEWER MODAL ═══════════ */
function ImageViewerModal({ payee, map, onClose, onEdit }) {
    const url = map[payee]?.image_url;
    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className="mhd th"><div className="mhl"><div className="mti t">🖼️</div><div><div className="mt">{payee}</div><div className="ms">Profile Photo</div></div></div><button className="mcb" onClick={close}>✕</button></div>
                {url
                    ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", gap: 18 }}>
                        <img src={url} alt={payee} style={{ width: 210, height: 210, borderRadius: "50%", objectFit: "cover", border: "5px solid var(--sfc, #fff)", animation: "imgZoom .35s cubic-bezier(.34,1.4,.64,1) both" }} onError={e => e.target.style.display = "none"} />
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, textAlign: "center" }}>{payee}</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-te" style={{ textDecoration: "none", fontSize: 12 }}>🔗 Open Full Size</a>
                            <button className="btn btn-ol" onClick={() => { close(); setTimeout(onEdit, 250); }}>✏️ Edit Photo</button>
                        </div>
                    </div>
                    : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "44px 20px" }}>
                        <div style={{ width: 120, height: 120, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 900 }}>{payee.charAt(0).toUpperCase()}</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900 }}>{payee}</div>
                        <div style={{ fontSize: 13, color: "var(--txd)" }}>No photo uploaded yet</div>
                        <button className="btn btn-te" onClick={() => { close(); setTimeout(onEdit, 250); }}>📷 Upload Photo</button>
                    </div>
                }
            </>)}
        </Modal>
    );
}

/* ═══════════ MANAGE PAYEES MODAL ═══════════ */
function ManageModal({ onClose, rows, map, payees, onRefresh, showToast }) {
    const [editP, setEditP] = useState(null);
    const [viewP, setViewP] = useState(null);
    const [viewImgP, setViewImgP] = useState(null);
    const [q, setQ] = useState("");
    const filtered = useMemo(() => q.trim() ? payees.filter(p => p.toLowerCase().includes(q.toLowerCase())) : payees, [payees, q]);
    const cnt = p => rows.filter(r => r.payee_payer === p).length;
    const del = async p => {
        if (!window.confirm(`Delete payee "${p}"?`)) return;
        await supabase.from("payees").delete().eq("name", p);
        showToast(`"${p}" deleted`); onRefresh();
    };
    if (editP) return <EditPayeeModal payee={editP} map={map} onClose={() => setEditP(null)} onSaved={() => { setEditP(null); onRefresh(); showToast("Payee updated!"); }} />;
    if (viewImgP) return <ImageViewerModal payee={viewImgP} map={map} onClose={() => setViewImgP(null)} onEdit={() => { setViewImgP(null); setEditP(viewImgP); }} />;
    if (viewP) return <ProfileModal payee={viewP} rows={rows} map={map} onClose={() => setViewP(null)}
        onViewImage={close => { close(); setTimeout(() => setViewImgP(viewP), 250); }}
        onEditPayee={close => { close(); setTimeout(() => setEditP(viewP), 250); }}
        onDeletePayee={close => { close(); setTimeout(() => del(viewP), 250); }} />;
    return (
        <Modal onClose={onClose} wide>
            {(close) => (<>
                <div className="mhd th"><div className="mhl"><div className="mti t">👥</div><div><div className="mt">Manage Payees</div><div className="ms">{payees.length} payee{payees.length !== 1 ? "s" : ""} total</div></div></div><button className="mcb" onClick={close}>✕</button></div>
                <div className="mb">
                    <div style={{ marginBottom: 16 }}><input className="pi" type="text" placeholder="Search payees…" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
                    {filtered.length === 0
                        ? <div style={{ textAlign: "center", padding: "28px", fontSize: 13 }}>No payees found</div>
                        : <div className="pl">
                            {filtered.map(p => (
                                <div className="pli" key={p}>
                                    <div className="pla" onClick={() => setViewImgP(p)}><Av name={p} map={map} size={42} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="plnm" onClick={() => setViewP(p)}>{p}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                            <div className="plct">{cnt(p)} txn{cnt(p) !== 1 ? "s" : ""}</div>
                                            {map[p]?.image_url
                                                ? <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 5 }}>📷</span>
                                                : <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 5, color: "var(--txf)" }}>No Photo</span>}
                                        </div>
                                    </div>
                                    <div className="plas">
                                        <button className="bg ed" onClick={() => setViewImgP(p)}>🖼️</button>
                                        <button className="bg ed" onClick={() => setViewP(p)}>👁</button>
                                        <button className="bg ed" onClick={() => setEditP(p)}>✏️</button>
                                        <button className="bg dl" onClick={() => del(p)}>🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ MAIN ═══════════ */
export default function PersonalExpenses() {
    const navigate = useNavigate();
    const dark = useDarkMode();
    const T = dark ? DARK : LIGHT;
    const css = useMemo(() => makeCSS(T), [dark]);

    const [rows, setRows] = useState([]);
    const [loading, setLd] = useState(true);
    const [total, setTotal] = useState(0);
    const [pData, setPData] = useState({});

    const [search, setSearch] = useState("");
    const [showSug, setShowSug] = useState(false);
    const searchRef = useRef(null);
    const [tF, setTF] = useState("all");
    const [cF, setCF] = useState("all");
    const [pF, setPF] = useState("all");
    const [sortC, setSortC] = useState("date");
    const [sortD, setSortD] = useState("desc");
    const [page, setPage] = useState(1);
    const [pSz, setPSz] = useState(50);
    const [jump, setJump] = useState("");

    const [modal, setModal] = useState(null);
    const [fabOpen, setFabOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [viewP, setViewP] = useState(null);
    const [viewImgP, setViewImgP] = useState(null);
    const [viewReceipt, setViewReceipt] = useState(null);
    const [manageP, setManageP] = useState(false);
    const [editP, setEditP] = useState(null);
    const [toasts, setToasts] = useState([]);

    const toast = (msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]);

    useEffect(() => {
        const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSug(false); };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) { navigate("/login"); return; }
            fetchAll(); fetchPayees();
        });
    }, [navigate]);

    const fetchAll = async () => {
        setLd(true);
        const B = 1000; let all = [], from = 0, go = true;
        while (go) {
            const { data, error, count } = await supabase.from("personal_expenses").select("*", { count: "exact" }).order("date", { ascending: false }).order("imported_at", { ascending: false }).range(from, from + B - 1);
            if (error) { console.error(error.message); break; }
            all = [...all, ...(data || [])]; setTotal(count || all.length);
            if (!data || data.length < B) go = false; else from += B;
        }
        setRows(all); setLd(false);
    };

    const fetchPayees = async () => {
        const { data } = await supabase.from("payees").select("name,image_url").order("name");
        if (data) { const m = {}; data.forEach(r => { m[r.name] = r; }); setPData(m); }
    };

    const ensurePayeeLocal = async (name, photoFile = null) => {
        if (!name || !name.trim()) return;
        const n = name.trim(); let img = pData[n]?.image_url || null;
        if (photoFile) img = await uploadImg(n, photoFile);
        await supabase.from("payees").upsert([{ name: n, image_url: img }], { onConflict: "name" });
        setPData(p => ({ ...p, [n]: { name: n, image_url: img } }));
    };

    const allPayees = useMemo(() => {
        const fr = rows.map(r => r.payee_payer).filter(Boolean);
        return Array.from(new Set([...Object.keys(pData), ...fr])).sort();
    }, [pData, rows]);

    const allCats = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))).sort(), [rows]);

    const searchSuggestions = useMemo(() => {
        if (!search.trim()) return [];
        const q = search.toLowerCase();
        return allPayees.filter(p => p.toLowerCase().includes(q));
    }, [search, allPayees]);

    const payeeTxnCount = useMemo(() => {
        const m = {}; rows.forEach(r => { if (r.payee_payer) m[r.payee_payer] = (m[r.payee_payer] || 0) + 1; }); return m;
    }, [rows]);

    const payeeExpense = useMemo(() => {
        const m = {}; rows.filter(r => r.type === "expense").forEach(r => { if (r.payee_payer) m[r.payee_payer] = (m[r.payee_payer] || 0) + (r.amount || 0); }); return m;
    }, [rows]);

    const filtered = useMemo(() => {
        let r = rows;
        if (tF !== "all") r = r.filter(x => x.type === tF);
        if (cF !== "all") r = r.filter(x => x.category === cF);
        if (pF !== "all") r = r.filter(x => x.payee_payer === pF);
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(x => (x.date || "").includes(q) || (x.category || "").toLowerCase().includes(q) || (x.subcategory || "").toLowerCase().includes(q) || (x.payee_payer || "").toLowerCase().includes(q) || (x.description || "").toLowerCase().includes(q) || (x.payment_method || "").toLowerCase().includes(q) || (x.account || "").toLowerCase().includes(q) || String(x.amount || "").includes(q));
        }
        return [...r].sort((a, b) => {
            let av = a[sortC], bv = b[sortC];
            if (sortC === "amount") { av = Number(av) || 0; bv = Number(bv) || 0; } else { av = (av || "").toString(); bv = (bv || "").toString(); }
            return sortD === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
        });
    }, [rows, tF, cF, pF, search, sortC, sortD]);

    const totI = useMemo(() => rows.filter(r => r.type === "income").reduce((s, r) => s + (r.amount || 0), 0), [rows]);
    const totE = useMemo(() => rows.filter(r => r.type === "expense").reduce((s, r) => s + (r.amount || 0), 0), [rows]);
    const net = totI - totE;
    const fI = useMemo(() => filtered.filter(r => r.type === "income").reduce((s, r) => s + (r.amount || 0), 0), [filtered]);
    const fE = useMemo(() => filtered.filter(r => r.type === "expense").reduce((s, r) => s + (r.amount || 0), 0), [filtered]);
    const fN = fI - fE;

    const totPg = Math.max(1, Math.ceil(filtered.length / pSz));
    const safePg = Math.min(page, totPg);
    const pgSt = (safePg - 1) * pSz;
    const pgRows = filtered.slice(pgSt, pgSt + pSz);
    const rp = useCallback(() => setPage(1), []);
    useEffect(() => { rp(); }, [search, tF, cF, pF, sortC, sortD, pSz]);

    const sort = col => { if (sortC === col) setSortD(d => d === "asc" ? "desc" : "asc"); else { setSortC(col); setSortD("asc"); } };
    const tc = col => sortC === col ? `${sortD === "asc" ? "sa" : "sd"}` : "";

    const pgBtns = useMemo(() => {
        if (totPg <= 7) return Array.from({ length: totPg }, (_, i) => i + 1);
        const s = new Set([1, totPg, safePg, safePg - 1, safePg + 1, safePg - 2, safePg + 2]);
        return Array.from(s).filter(p => p >= 1 && p <= totPg).sort((a, b) => a - b);
    }, [totPg, safePg]);

    const hasF = !!(search || tF !== "all" || cF !== "all" || pF !== "all");
    const clrF = () => { setSearch(""); setTF("all"); setCF("all"); setPF("all"); };

    const delRow = async id => {
        if (!window.confirm("Delete this entry?")) return;
        const { error } = await supabase.from("personal_expenses").delete().eq("id", id);
        if (error) return toast("Delete failed: " + error.message, "error");
        toast("Entry deleted"); setRows(p => p.filter(r => r.id !== id)); setTotal(c => c - 1);
    };

    const onSaved = async (ok, msg) => {
        toast(msg, ok ? "success" : "error");
        if (ok) { await fetchAll(); await fetchPayees(); }
    };

    return (<>
        <style>{css}</style>
        <Navbar />
        <div className="pr">
            {loading && <div className="pr-lb" />}
            {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onHide={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}

            {modal && <AddModal type={modal} onClose={() => setModal(null)} onSaved={onSaved} payees={allPayees} map={pData} ensurePayeeLocal={ensurePayeeLocal} />}
            {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={(ok, msg) => { onSaved(ok, msg); setEditRow(null); }} payees={allPayees} map={pData} ensurePayeeLocal={ensurePayeeLocal} />}
            {viewImgP && <ImageViewerModal payee={viewImgP} map={pData} onClose={() => setViewImgP(null)} onEdit={() => { setViewImgP(null); setEditP(viewImgP); }} />}
            {viewP && <ProfileModal payee={viewP} rows={rows} map={pData} onClose={() => setViewP(null)}
                onViewImage={close => { close(); setTimeout(() => setViewImgP(viewP), 250); }}
                onEditPayee={close => { close(); setTimeout(() => { setViewP(null); setEditP(viewP); }, 250); }}
                onDeletePayee={async close => {
                    if (!window.confirm(`Delete "${viewP}"?`)) return;
                    await supabase.from("payees").delete().eq("name", viewP);
                    toast(`"${viewP}" deleted`); await fetchPayees(); close(); setViewP(null);
                }} />}
            {editP && <EditPayeeModal payee={editP} map={pData} onClose={() => setEditP(null)} onSaved={async () => { setEditP(null); await fetchAll(); await fetchPayees(); toast("Payee updated!"); }} />}
            {manageP && <ManageModal onClose={() => setManageP(false)} rows={rows} map={pData} payees={allPayees} showToast={toast} onRefresh={async () => { await fetchAll(); await fetchPayees(); }} />}
            {viewReceipt && <ReceiptViewerModal row={viewReceipt} onClose={() => setViewReceipt(null)} onReplace={() => { setViewReceipt(null); setEditRow(viewReceipt); }} />}

            {/* HEADER */}
            <div className="pr-hd">
                <div className="pr-hdi">
                    <div>
                        <div className="pr-ey">Personal Finance</div>
                        <h1 className="pr-ttl">Expense <em>Ledger</em></h1>
                    </div>
                    <div className="pr-hdr">
                        <div className="pr-bdg">📋 {total.toLocaleString("en-IN")} Records</div>
                        <button className="hb sec" onClick={() => setManageP(true)}>👥 Payees</button>
                        <button className="hb" onClick={() => navigate("/import-expenses")}>📂 Import CSV</button>
                    </div>
                </div>
            </div>

            <div className="pr-w">
                {/* STATS */}
                <p className="sec-ttl">Overview</p>
                <div className="pr-sts">
                    {/* Income card */}
                    <div className="sc sc1">
                        <div className="sc-ac ag" />
                        <div className="sc-tp">
                            <div>
                                <div className="sc-lb">Total Income</div>
                                <div className="sc-vl gr">₹{fmtIN(totI)}</div>
                            </div>
                            <div className="sc-ic" style={{ background: T.grb, fontSize: 20 }}>▲</div>
                        </div>
                        <div className="sc-wd gr">{toWords(totI)}</div>
                        <div className="sc-ct">{rows.filter(r => r.type === "income").length.toLocaleString("en-IN")} entries</div>
                        {hasF && <div className="fb gr"><span className="fb-lb gr">🔍 Filtered</span><span className="fb-am gr">+₹{fmtIN(fI)}</span><span className="fb-wd gr">{toWords(fI)}</span></div>}
                    </div>

                    {/* Expense card */}
                    <div className="sc sc2">
                        <div className="sc-ac ar" />
                        <div className="sc-tp">
                            <div>
                                <div className="sc-lb">Total Expenses</div>
                                <div className="sc-vl rd">₹{fmtIN(totE)}</div>
                            </div>
                            <div className="sc-ic" style={{ background: T.rdb, fontSize: 20 }}>▼</div>
                        </div>
                        <div className="sc-wd rd">{toWords(totE)}</div>
                        <div className="sc-ct">{rows.filter(r => r.type === "expense").length.toLocaleString("en-IN")} entries</div>
                        {hasF && <div className="fb rd"><span className="fb-lb rd">🔍 Filtered</span><span className="fb-am rd">−₹{fmtIN(fE)}</span><span className="fb-wd rd">{toWords(fE)}</span></div>}
                    </div>

                    {/* Net card */}
                    <div className="sc sc3">
                        <div className={`sc-ac ${net >= 0 ? "at" : "ar"}`} />
                        <div className="sc-tp">
                            <div>
                                <div className="sc-lb">Net Balance</div>
                                <div className={`sc-vl ${net >= 0 ? "te" : "rd"}`}>{net < 0 ? "−" : ""}₹{fmtIN(Math.abs(net))}</div>
                            </div>
                            <div className="sc-ic" style={{ background: net >= 0 ? T.tel : T.rdb, fontSize: 18 }}>{net >= 0 ? "📈" : "📉"}</div>
                        </div>
                        <div className={`sc-wd ${net >= 0 ? "te" : "rd"}`}>{net < 0 ? "Deficit: " : ""}{toWords(Math.abs(net))}</div>
                        <div className="sc-ct">Income minus expenses</div>
                        {hasF && <div className={`fb ${fN >= 0 ? "te" : "rd"}`}><span className={`fb-lb ${fN >= 0 ? "te" : "rd"}`}>🔍 Filtered</span><span className={`fb-am ${fN >= 0 ? "te" : "rd"}`}>{fN < 0 ? "−" : ""}₹{fmtIN(Math.abs(fN))}</span><span className={`fb-wd ${fN >= 0 ? "te" : "rd"}`}>{toWords(Math.abs(fN))}</span></div>}
                    </div>
                </div>

                {/* CHART */}
                {!loading && rows.length > 0 && <YearChart rows={rows} T={T} />}

                {/* CONTROLS */}
                <div className="pr-ctrl">
                    <div className="pr-cr">
                        {/* SEARCH with suggestions */}
                        <div className="sw" ref={searchRef}>
                            <span className="si">🔍</span>
                            <input
                                className="sr"
                                type="text"
                                placeholder="Search payee, category, amount, date…"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setShowSug(true); }}
                                onFocus={() => setShowSug(true)}
                                autoComplete="off"
                            />
                            {showSug && searchSuggestions.length > 0 && (
                                <div className="srch-sug">
                                    <div className="srch-sug-hd">Payees matching "{search}"</div>
                                    <div className="srch-sug-scroll">
                                        {searchSuggestions.map(p => {
                                            const txns = payeeTxnCount[p] || 0;
                                            const spent = payeeExpense[p] || 0;
                                            return (
                                                <div key={p} className="srch-sug-item"
                                                    onMouseDown={() => { setSearch(p); setPF(p); setShowSug(false); }}>
                                                    <div className="srch-sug-av">
                                                        <Av name={p} map={pData} size={36} />
                                                    </div>
                                                    <div className="srch-sug-info">
                                                        <div className="srch-sug-name">{p}</div>
                                                        <div className="srch-sug-meta">
                                                            {txns} transaction{txns !== 1 ? "s" : ""}
                                                            {spent > 0 ? ` · ₹${fmtIN(spent)} spent` : ""}
                                                        </div>
                                                    </div>
                                                    <span className="srch-sug-pill">{txns} txns</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="srch-sug-ft">
                                        <span className="srch-sug-ft-ct">
                                            {searchSuggestions.length} payee{searchSuggestions.length !== 1 ? "s" : ""} found
                                        </span>
                                        <button className="srch-sug-ft-act"
                                            onMouseDown={() => {
                                                if (searchSuggestions[0]) {
                                                    setPF(searchSuggestions[0]);
                                                    setSearch(searchSuggestions[0]);
                                                    setShowSug(false);
                                                }
                                            }}>
                                            Filter by top result →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <select className={`fs${tF !== "all" ? " af" : ""}`} value={tF} onChange={e => setTF(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="income">▲ Income</option>
                            <option value="expense">▼ Expense</option>
                        </select>
                        <select className={`fs${cF !== "all" ? " af" : ""}`} value={cF} onChange={e => setCF(e.target.value)}>
                            <option value="all">All Categories</option>
                            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className={`fs${pF !== "all" ? " af" : ""}`} value={pF} onChange={e => setPF(e.target.value)}>
                            <option value="all">All Payees</option>
                            {allPayees.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {hasF && <button className="cb" onClick={clrF}>✕ Clear</button>}
                        <span className="rc">{filtered.length.toLocaleString("en-IN")} records</span>
                    </div>

                    {hasF && (
                        <div className="afr">
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.txf }}>Active filters:</span>
                            {tF !== "all" && <span className="fp">{tF === "income" ? "▲" : "▼"} {tF}<button className="fpx" onClick={() => setTF("all")}>×</button></span>}
                            {cF !== "all" && <span className="fp">📂 {cF}<button className="fpx" onClick={() => setCF("all")}>×</button></span>}
                            {pF !== "all" && <span className="fp">👤 {pF}<button className="fpx" onClick={() => setPF("all")}>×</button></span>}
                            {search && <span className="fp">🔍 "{search}"<button className="fpx" onClick={() => setSearch("")}>×</button></span>}
                        </div>
                    )}
                </div>

                {/* TABLE HEADER */}
                <p className="sec-ttl">
                    Transactions
                    {filtered.length > 0 && (
                        <span style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 400, color: T.txd, fontStyle: "normal" }}>
                            &nbsp;Page {safePg}/{totPg} · {pgSt + 1}–{Math.min(pgSt + pSz, filtered.length)}
                        </span>
                    )}
                </p>

                {/* TABLE */}
                <div className="pr-tbl">
                    <div className="tscr">
                        <div className="tsh">← scroll to see all columns →</div>
                        <table className="pr-t">
                            <thead>
                                <tr>
                                    <th className="ns" style={{ width: 42 }}>#</th>
                                    <th className={tc("date")} onClick={() => sort("date")}>Date</th>
                                    <th className={tc("type")} onClick={() => sort("type")}>Type</th>
                                    <th className={`rt ${tc("amount")}`} onClick={() => sort("amount")}>Amount (₹)</th>
                                    <th className={tc("category")} onClick={() => sort("category")}>Category</th>
                                    <th className={tc("payee_payer")} onClick={() => sort("payee_payer")}>Payee</th>
                                    <th className={tc("payment_method")} onClick={() => sort("payment_method")}>Method</th>
                                    <th className="ns">Receipt</th>
                                    <th className={tc("description")} onClick={() => sort("description")}>Note</th>
                                    <th className={tc("account")} onClick={() => sort("account")}>Account</th>
                                    <th className="ns" style={{ width: 78 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 11 }).map((_, j) => (
                                                <td key={j}><span className="sk" style={{ width: j === 3 ? 70 : j === 0 ? 28 : 80 + (j * 5) + "px" }} /></td>
                                            ))}
                                        </tr>
                                    ))
                                    : pgRows.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={11} style={{ padding: 0 }}>
                                                    <div className="emp">
                                                        <span className="emp-ic">{hasF ? "🔍" : "📭"}</span>
                                                        <div className="emp-tt">{hasF ? "No results found" : "No records yet"}</div>
                                                        <div className="emp-sb">{hasF ? "Try adjusting your filters" : "Use the + button below to add"}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                        : pgRows.map((row, i) => (
                                            <tr key={row.id}>
                                                <td className="sno">{pgSt + i + 1}</td>
                                                <td className="dtc">{fmtDate(row.date)}</td>
                                                <td>
                                                    <span className={`tb ${row.type === "income" ? "tb-i" : "tb-e"}`}>
                                                        {row.type === "income" ? "▲ Inc" : "▼ Exp"}
                                                    </span>
                                                </td>
                                                <td className={`rt ${row.type === "income" ? "ai" : "ae"}`}>
                                                    {row.type === "income" ? "+" : "−"}₹{fmtIN(row.amount)}
                                                </td>
                                                <td>
                                                    {row.category
                                                        ? <span className="cp">{row.category}</span>
                                                        : <span style={{ color: T.txf }}>—</span>}
                                                </td>
                                                <td>
                                                    {row.payee_payer
                                                        ? (
                                                            <div className="pyc" onClick={() => setViewP(row.payee_payer)}>
                                                                <div className="pyc-av"><Av name={row.payee_payer} map={pData} size={26} /></div>
                                                                <span className="pyc-nm">{row.payee_payer}</span>
                                                            </div>
                                                        )
                                                        : <span style={{ color: T.txf }}>—</span>}
                                                </td>
                                                <td style={{ fontSize: 12, color: T.txd, fontWeight: 500 }}>{row.payment_method || "—"}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    {row.receipt_url
                                                        ? <button className="rcpt-badge" onClick={() => setViewReceipt(row)}>💳 View</button>
                                                        : <span style={{ fontSize: 10, color: T.txf }}>—</span>}
                                                </td>
                                                <td className="ntc" title={row.description || ""}>{row.description || "—"}</td>
                                                <td style={{ fontSize: 11, color: T.txf }}>{row.account || "—"}</td>
                                                <td>
                                                    <div className="ra">
                                                        <button className="rb ed" onClick={() => setEditRow(row)} title="Edit">
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                        <button className="rb dl" onClick={() => delRow(row.id)} title="Delete">
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                }
                            </tbody>
                            {!loading && filtered.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ padding: "11px 14px", background: T.bg2, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: T.txd }}>
                                            {hasF ? "Filtered" : "All"} Totals
                                        </td>
                                        <td className="rt" style={{ padding: "11px 14px", background: T.bg2 }}>
                                            <div style={{ fontSize: 13, color: T.gr, fontWeight: 800 }}>+₹{fmtIN(fI)}</div>
                                            <div style={{ fontSize: 13, color: T.rd, fontWeight: 800 }}>−₹{fmtIN(fE)}</div>
                                        </td>
                                        <td colSpan={7} style={{ background: T.bg2 }} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {!loading && filtered.length > 0 && (
                        <div className="pg">
                            <div className="pgi">
                                Showing <strong>{pgSt + 1}–{Math.min(pgSt + pSz, filtered.length)}</strong> of <strong>{filtered.length.toLocaleString("en-IN")}</strong>
                            </div>
                            {totPg > 1 && (
                                <div className="pgbs">
                                    <button className="pgb" disabled={safePg === 1} onClick={() => setPage(1)}>«</button>
                                    <button className="pgb" disabled={safePg === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                    {pgBtns.map((p, idx) => {
                                        const prev = pgBtns[idx - 1];
                                        return (
                                            <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                {prev && p - prev > 1 && <span style={{ color: T.txf, fontSize: 12 }}>…</span>}
                                                <button className={`pgb${safePg === p ? " ac" : ""}`} onClick={() => setPage(p)}>{p}</button>
                                            </span>
                                        );
                                    })}
                                    <button className="pgb" disabled={safePg === totPg} onClick={() => setPage(p => p + 1)}>›</button>
                                    <button className="pgb" disabled={safePg === totPg} onClick={() => setPage(totPg)}>»</button>
                                </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <select className="pgs" value={pSz} onChange={e => { setPSz(Number(e.target.value)); setPage(1); }}>
                                    {PAGE_SIZES.map(n => <option key={n} value={n}>{n}/page</option>)}
                                </select>
                                {totPg > 5 && (
                                    <div className="pgj">
                                        Go to
                                        <input type="number" min={1} max={totPg} value={jump}
                                            onChange={e => setJump(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    const v = Number(jump);
                                                    if (v >= 1 && v <= totPg) { setPage(v); setJump(""); }
                                                }
                                            }}
                                            placeholder={safePg}
                                        />
                                        <button className="pgb" style={{ padding: "0 12px", height: 34 }} onClick={() => {
                                            const v = Number(jump);
                                            if (v >= 1 && v <= totPg) { setPage(v); setJump(""); }
                                        }}>Go</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* FAB */}
        <div className="fab-c">
            {fabOpen && (
                <div className="fab-actions">
                    <button className="fab fab-exp" onClick={() => { setModal("expense"); setFabOpen(false); }}>
                        <span className="fab-ic">▼</span><span>Add Expense</span>
                    </button>
                    <button className="fab fab-inc" onClick={() => { setModal("income"); setFabOpen(false); }}>
                        <span className="fab-ic">▲</span><span>Add Income</span>
                    </button>
                </div>
            )}
            <button className={`fab-toggle${fabOpen ? " open" : ""}`} onClick={() => setFabOpen(o => !o)}>+</button>
        </div>
    </>);
}