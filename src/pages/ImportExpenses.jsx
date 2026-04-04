// PersonalExpenses.jsx — Full Featured: Payee Profiles + Image Upload + Edit/Delete
//
// ✅ FAB buttons → animated popup modals (Add Expense / Add Income)
// ✅ Payee/Payer with profile photo upload (Supabase Storage "payee-images" bucket)
// ✅ View Payee Profile — photo, stats, full transaction history with that payee
// ✅ Edit payee name + photo inline
// ✅ Delete payee
// ✅ 👥 Manage Payees button — list all payees with photos, search, view/edit/delete each
// ✅ Edit any transaction row (pencil icon)
// ✅ Delete transaction row
// ✅ Fully responsive, all animations retained

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

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
const BUCKET = "payee-images";

/* ═══════════ CSS ═══════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
:root{
  --bg:#f5f2ed;--bg2:#ede9e2;--sfc:#fff;--sfc2:#faf8f5;
  --bdr:#e2dcd4;--bdr2:#d0c9be;
  --tx:#1c1a17;--txm:#5a5449;--txd:#9a9187;--txf:#c4bdb4;
  --te:#0d9488;--tel:#e0f2f0;--tem:#99d6d0;
  --gr:#16a34a;--grb:#dcfce7;--grd:#15803d;
  --rd:#dc2626;--rdb:#fee2e2;--rdd:#b91c1c;
  --bl:#1d4ed8;--blb:#dbeafe;
  --pu:#7c3aed;--pub:#ede9fe;
  --sh0:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --sh:0 4px 16px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --shl:0 20px 60px rgba(0,0,0,.18),0 8px 24px rgba(0,0,0,.1);
  --r:14px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{overflow-x:hidden;}
.pr{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--tx);padding-bottom:110px;}

@keyframes fU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes fI{from{opacity:0}to{opacity:1}}
@keyframes pI{0%{opacity:0;transform:scale(.86)}65%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
@keyframes rS{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes sh{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes sD{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes mBI{from{opacity:0}to{opacity:1}}
@keyframes mI{from{opacity:0;transform:translateY(36px) scale(.95)}to{opacity:1;transform:none}}
@keyframes mO{from{opacity:1;transform:none}to{opacity:0;transform:translateY(28px) scale(.96)}}
@keyframes fP{0%{transform:scale(0) rotate(-90deg)}70%{transform:scale(1.1) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
@keyframes tI{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}
@keyframes tO{from{opacity:1}to{opacity:0;transform:translateX(50px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes aP{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}

.pr-hd{animation:fI .4s ease both}
.sc1{animation:pI .4s .04s ease both}.sc2{animation:pI .4s .1s ease both}.sc3{animation:pI .4s .16s ease both}
.pr-ctrl{animation:fU .4s .12s ease both}.pr-tbl{animation:fU .45s .18s ease both}
.pr-tbl tbody tr{animation:rS .25s ease both}
.pr-tbl tbody tr:nth-child(1){animation-delay:.02s}.pr-tbl tbody tr:nth-child(2){animation-delay:.05s}
.pr-tbl tbody tr:nth-child(3){animation-delay:.08s}.pr-tbl tbody tr:nth-child(4){animation-delay:.11s}

/* HEADER */
.pr-hd{background:var(--sfc);border-bottom:1.5px solid var(--bdr);padding:20px 0 16px;margin-bottom:24px;box-shadow:var(--sh0);}
.pr-hdi{max-width:1240px;margin:auto;padding:0 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.pr-ey{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--te);margin-bottom:4px;display:flex;align-items:center;gap:7px;}
.pr-ey::before{content:'';display:inline-block;width:16px;height:2px;background:var(--te);border-radius:2px;}
.pr-ttl{font-family:'Playfair Display',serif;font-size:clamp(20px,3vw,32px);font-weight:900;line-height:1.1;}
.pr-ttl em{font-style:italic;color:var(--te);}
.pr-hdr{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.pr-bdg{background:var(--tel);border:1.5px solid var(--tem);border-radius:10px;padding:6px 14px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--te);}
.hb{background:var(--te);color:#fff;border:none;border-radius:9px;padding:8px 16px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;display:flex;align-items:center;gap:6px;}
.hb:hover{opacity:.88;transform:translateY(-1px);box-shadow:var(--sh);}
.hb.sec{background:var(--sfc);color:var(--txm);border:1.5px solid var(--bdr2);}
.hb.sec:hover{border-color:var(--te);color:var(--te);background:var(--tel);}

/* WRAP */
.pr-w{max-width:1240px;margin:auto;padding:0 20px;}
@media(max-width:480px){.pr-w{padding:0 12px;}}
.sec-ttl{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--tx);margin-bottom:12px;display:flex;align-items:center;gap:10px;}
.sec-ttl::after{content:'';flex:1;height:1.5px;background:var(--bdr);border-radius:2px;}

/* STAT CARDS */
.pr-sts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px;}
@media(max-width:640px){.pr-sts{grid-template-columns:1fr;gap:10px;}}
@media(min-width:641px) and (max-width:900px){.pr-sts{grid-template-columns:1fr 1fr;}}
.sc{background:var(--sfc);border:1.5px solid var(--bdr);border-radius:var(--r);padding:18px 20px;position:relative;overflow:hidden;box-shadow:var(--sh0);transition:transform .2s,box-shadow .2s;}
.sc:hover{transform:translateY(-2px);box-shadow:var(--sh);}
.sc-ac{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
.at{background:var(--te);}.ag{background:var(--gr);}.ar{background:var(--rd);}
.sc-tp{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
.sc-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.sc-lb{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--txd);margin-bottom:5px;}
.sc-vl{font-family:'Playfair Display',serif;font-size:clamp(20px,2.5vw,28px);font-weight:900;line-height:1.1;margin-bottom:3px;}
.sc-vl.te{color:var(--te);}.sc-vl.gr{color:var(--gr);}.sc-vl.rd{color:var(--rd);}
.sc-wd{font-size:11px;font-weight:500;font-style:italic;padding:3px 8px;border-radius:6px;display:inline-block;margin-top:2px;}
.sc-wd.te{background:var(--tel);color:var(--te);}.sc-wd.gr{background:var(--grb);color:var(--gr);}.sc-wd.rd{background:var(--rdb);color:var(--rd);}
.sc-ct{font-size:11px;color:var(--txf);margin-top:5px;}
.fb{margin-top:10px;padding:8px 10px;border-radius:8px;border:1.5px dashed;display:flex;flex-direction:column;gap:2px;}
.fb.gr{background:var(--grb);border-color:rgba(22,163,74,.35);}
.fb.rd{background:var(--rdb);border-color:rgba(220,38,38,.35);}
.fb.te{background:var(--tel);border-color:rgba(13,148,136,.35);}
.fb-lb{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;}
.fb-lb.gr{color:var(--gr);}.fb-lb.rd{color:var(--rd);}.fb-lb.te{color:var(--te);}
.fb-am{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;line-height:1.2;}
.fb-am.gr{color:var(--gr);}.fb-am.rd{color:var(--rd);}.fb-am.te{color:var(--te);}
.fb-wd{font-size:10px;font-style:italic;margin-top:1px;}
.fb-wd.gr{color:var(--gr);}.fb-wd.rd{color:var(--rd);}.fb-wd.te{color:var(--te);}

/* FABs */
.fab-c{position:fixed;bottom:28px;right:28px;z-index:400;display:flex;flex-direction:column;gap:10px;align-items:flex-end;gap: 12px;}
@media(max-width:480px){.fab-c{bottom:18px;right:14px;}}
.fab{display:flex;align-items:center;gap:10px;border:none;border-radius:50px;padding:13px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;position:relative;overflow:hidden;animation:fP .5s cubic-bezier(.34,1.56,.64,1) both;}
.fab:nth-child(1){animation-delay:.05s;}.fab:nth-child(2){animation-delay:.15s;}
.fab:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 10px 32px rgba(0,0,0,.22);}
.fab:active{transform:scale(.96);}
.fab-exp{background:linear-gradient(135deg,var(--rd),var(--rdd));color:#fff;}
.fab-inc{background:linear-gradient(135deg,var(--gr),var(--grd));color:#fff;}
.fab-ic{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;background:rgba(255,255,255,.22);flex-shrink:0;}
@media(max-width:360px){.fab{padding:13px;border-radius:50%;}.fab span:last-child{display:none;}}

/* MODAL */
.mov{position:fixed;inset:0;z-index:500;background:rgba(15,12,8,.55);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px;animation:mBI .2s ease both;}
.mov.cl{opacity:0;transition:opacity .22s;}
.mbox{background:var(--sfc);border-radius:20px;width:100%;max-width:580px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shl);animation:mI .3s cubic-bezier(.34,1.4,.64,1) both;border:1.5px solid var(--bdr);}
.mbox.cl{animation:mO .22s ease both;}
.mbox.wide{max-width:680px;}
.mhd{padding:18px 22px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--bdr);}
.mhd.eh{background:linear-gradient(135deg,var(--rdb),var(--sfc));}
.mhd.ih{background:linear-gradient(135deg,var(--grb),var(--sfc));}
.mhd.th{background:linear-gradient(135deg,var(--tel),var(--sfc));}
.mhl{display:flex;align-items:center;gap:12px;}
.mti{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.mti.e{background:var(--rdb);}.mti.i{background:var(--grb);}.mti.t{background:var(--tel);}
.mt{font-family:'Playfair Display',serif;font-size:19px;font-weight:900;color:var(--tx);}
.ms{font-size:11px;color:var(--txd);margin-top:1px;}
.mcb{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--bdr);background:var(--sfc);color:var(--txd);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .18s;flex-shrink:0;}
.mcb:hover{background:var(--rdb);color:var(--rd);border-color:var(--rd);}
.mb{overflow-y:auto;padding:20px 22px;flex:1;}
@media(max-width:480px){.mb{padding:14px;}}
.mft{padding:14px 22px;border-top:1.5px solid var(--bdr);background:var(--sfc2);display:flex;gap:10px;flex-wrap:wrap;}
@media(max-width:480px){.mft{padding:12px 14px;}}

/* FORM */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:480px){.fg{grid-template-columns:1fr;gap:10px;}}
.fcf{grid-column:1/-1;}
.fw{display:flex;flex-direction:column;gap:5px;}
.fl{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--txm);}
.pi,.ps,.pt{width:100%;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:9px;padding:10px 13px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--tx);outline:none;transition:border-color .2s,background .2s,box-shadow .2s;appearance:none;}
.pt{resize:vertical;min-height:70px;}
.pi::placeholder,.pt::placeholder{color:var(--txf);}
.pi:focus,.ps:focus,.pt:focus{border-color:var(--te);background:var(--sfc);box-shadow:0 0 0 3px rgba(13,148,136,.1);}

/* AMOUNT PREVIEW */
.ap{border-radius:8px;padding:9px 13px;margin-top:4px;display:flex;align-items:center;justify-content:space-between;animation:fI .2s ease both;}
.ap.e{background:var(--rdb);border:1.5px solid rgba(220,38,38,.2);}
.ap.i{background:var(--grb);border:1.5px solid rgba(22,163,74,.2);}
.ap-lb{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;}
.ap-lb.e{color:var(--rd);}.ap-lb.i{color:var(--gr);}
.ap-vl{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;}
.ap-vl.e{color:var(--rd);}.ap-vl.i{color:var(--gr);}

/* PAYEE AUTOCOMPLETE */
.pw{position:relative;}
.pdd{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:700;background:var(--sfc);border:1.5px solid var(--bdr);border-radius:10px;box-shadow:var(--sh);overflow:hidden;animation:sD .15s ease both;max-height:210px;overflow-y:auto;}
.pdi{padding:8px 13px;font-size:13px;cursor:pointer;color:var(--txm);transition:background .12s;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--bdr);}
.pdi:last-child{border-bottom:none;}
.pdi:hover,.pdi.hl{background:var(--tel);color:var(--te);}
.pdi-av{width:26px;height:26px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--tel);display:flex;align-items:center;justify-content:center;font-size:11px;}
.pci{padding:8px 13px;font-size:13px;cursor:pointer;background:var(--grb);color:var(--gr);font-weight:600;display:flex;align-items:center;gap:8px;}
.pci:hover{background:#bbf7d0;}
.psr{display:flex;align-items:center;gap:10px;background:var(--sfc2);border:1.5px solid var(--bdr);border-radius:9px;padding:8px 12px;}
.psn{font-size:14px;font-weight:600;color:var(--tx);flex:1;}
.psc{font-size:11px;font-weight:600;color:var(--te);cursor:pointer;padding:4px 8px;border-radius:6px;border:1.5px solid var(--tem);background:var(--tel);transition:all .15s;}
.psc:hover{background:var(--te);color:#fff;}

/* IMAGE UPLOAD */
.iuz{border:2px dashed var(--bdr2);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;background:var(--sfc2);position:relative;}
.iuz:hover,.iuz.dov{border-color:var(--te);background:var(--tel);}
.iuz input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.iur{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.ipw{position:relative;display:inline-block;}
.iprv{width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--sfc);box-shadow:var(--sh0);display:block;}
.irb{position:absolute;top:-4px;right:-4px;width:22px;height:22px;border-radius:50%;background:var(--rd);color:#fff;border:2px solid var(--sfc);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:transform .15s;}
.irb:hover{transform:scale(1.2);}

/* PROFILE MODAL */
.ph{display:flex;flex-direction:column;align-items:center;padding:24px 22px 16px;text-align:center;border-bottom:1.5px solid var(--bdr);background:linear-gradient(160deg,var(--tel),var(--sfc));}
.pab{width:90px;height:90px;border-radius:50%;overflow:hidden;border:4px solid var(--sfc);box-shadow:var(--sh);margin-bottom:12px;background:var(--tel);display:flex;align-items:center;justify-content:center;font-size:32px;animation:aP .35s cubic-bezier(.34,1.56,.64,1) both;}
.pnm{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:var(--tx);margin-bottom:3px;}
.psr-r{display:flex;gap:14px;margin-top:10px;flex-wrap:wrap;justify-content:center;}
.pst{background:var(--sfc);border:1.5px solid var(--bdr);border-radius:10px;padding:8px 16px;text-align:center;}
.pstv{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;line-height:1.2;}
.pstv.gr{color:var(--gr);}.pstv.rd{color:var(--rd);}.pstv.te{color:var(--te);}
.pstl{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--txf);margin-top:2px;}
.ptl{display:flex;flex-direction:column;gap:8px;margin-top:4px;}
.pti{display:flex;align-items:center;justify-content:space-between;padding:10px 13px;background:var(--sfc2);border:1px solid var(--bdr);border-radius:10px;gap:10px;}
.ptil{display:flex;flex-direction:column;gap:2px;}
.ptidate{font-size:11px;color:var(--txf);}
.ptidesc{font-size:13px;color:var(--txm);font-weight:500;}
.pticat{font-size:10px;background:var(--blb);color:var(--bl);padding:2px 7px;border-radius:6px;font-weight:600;display:inline-block;margin-top:2px;}
.ptir{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;}
.ptia{font-family:'Playfair Display',serif;font-size:16px;font-weight:800;}
.ptia.i{color:var(--gr);}.ptia.e{color:var(--rd);}
.ptim{font-size:10px;color:var(--txf);}

/* PAYEE LIST */
.pl{display:flex;flex-direction:column;gap:8px;}
.pli{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--sfc2);border:1.5px solid var(--bdr);border-radius:10px;transition:all .15s;}
.pli:hover{border-color:var(--tem);background:var(--tel);}
.pla{width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--tel);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.plnm{font-size:14px;font-weight:600;color:var(--tx);flex:1;cursor:pointer;}
.plnm:hover{color:var(--te);}
.plct{font-size:11px;color:var(--txf);}
.plas{display:flex;gap:6px;}

/* SEC LABEL */
.slb{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--txf);margin:14px 0 8px;display:flex;align-items:center;gap:8px;}
.slb::after{content:'';flex:1;height:1px;background:var(--bdr);}

/* BUTTONS */
.btn{padding:10px 20px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px;position:relative;overflow:hidden;}
.btn:hover{opacity:.88;transform:translateY(-1px);box-shadow:var(--sh);}
.btn:active{transform:translateY(0);}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important;}
.btn-gr{background:var(--gr);color:#fff;}.btn-rd{background:var(--rd);color:#fff;}.btn-te{background:var(--te);color:#fff;}
.btn-ol{background:transparent;color:var(--txm);border:1.5px solid var(--bdr2);}
.btn-ol:hover{border-color:var(--te);color:var(--te);background:var(--tel);}
.btn-fl{flex:1;justify-content:center;}
.bsp{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
.bg{background:none;border:none;padding:6px 10px;border-radius:7px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
.bg.ed{color:var(--te);}.bg.ed:hover{background:var(--tel);}
.bg.dl{color:var(--txf);}.bg.dl:hover{color:var(--rd);background:var(--rdb);}

/* TOAST */
.toast{position:fixed;bottom:28px;left:28px;z-index:999;background:var(--gr);color:#fff;border-radius:12px;padding:11px 16px;font-size:13px;font-weight:600;box-shadow:var(--sh);display:flex;align-items:center;gap:8px;animation:tI .3s cubic-bezier(.34,1.4,.64,1) both;max-width:calc(100vw - 56px);}
.toast.hd{animation:tO .25s ease forwards;}.toast.er{background:var(--rd);}
@media(max-width:480px){.toast{left:12px;bottom:86px;}}

/* CONTROLS */
.pr-ctrl{background:var(--sfc);border:1.5px solid var(--bdr);border-radius:var(--r);padding:14px 16px;margin-bottom:12px;box-shadow:var(--sh0);}
.pr-cr{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sw{position:relative;flex:1;min-width:160px;}
.si{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--txf);font-size:13px;pointer-events:none;}
.sr{width:100%;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:9px;padding:9px 11px 9px 32px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--tx);outline:none;transition:border-color .2s,background .2s,box-shadow .2s;}
.sr::placeholder{color:var(--txf);}
.sr:focus{border-color:var(--te);background:var(--sfc);box-shadow:0 0 0 3px rgba(13,148,136,.1);}
.fs{background:var(--bg2);border:1.5px solid var(--bdr);border-radius:9px;padding:9px 11px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txm);outline:none;cursor:pointer;transition:border-color .2s;appearance:none;min-width:120px;}
.fs:focus{border-color:var(--te);}
.fs.af{border-color:var(--te);background:var(--tel);color:var(--te);font-weight:600;}
.cb{background:none;border:1.5px solid var(--bdr);border-radius:9px;padding:9px 13px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;color:var(--txd);cursor:pointer;transition:all .15s;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.cb:hover{color:var(--rd);border-color:var(--rd);background:var(--rdb);}
.rc{font-size:11px;font-weight:600;color:var(--txd);letter-spacing:.05em;white-space:nowrap;margin-left:auto;}
.afr{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:10px;}
.fp{display:inline-flex;align-items:center;gap:5px;background:var(--tel);border:1.5px solid var(--tem);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--te);}
.fpx{background:none;border:none;cursor:pointer;color:var(--te);font-size:14px;line-height:1;padding:0;display:flex;align-items:center;transition:color .15s;}
.fpx:hover{color:var(--rd);}
@media(max-width:640px){.pr-cr{flex-direction:column;align-items:stretch;}.fs{width:100%;}.rc{margin-left:0;text-align:right;}}

/* TABLE */
.pr-tbl{background:var(--sfc);border:1.5px solid var(--bdr);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh0);margin-bottom:20px;}
.tscr{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tsh{display:none;font-size:10px;color:var(--txd);padding:5px 14px;text-align:center;border-bottom:1px solid var(--bdr);background:var(--sfc2);}
@media(max-width:700px){.tsh{display:block;}}
table.pr-t{width:100%;border-collapse:collapse;font-size:13px;min-width:820px;}
table.pr-t thead tr{background:var(--bg2);}
table.pr-t th{font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--txd);padding:10px 13px;text-align:left;border-bottom:1.5px solid var(--bdr);white-space:nowrap;user-select:none;cursor:pointer;transition:color .15s;}
table.pr-t th:hover{color:var(--te);}
table.pr-t th.sa::after{content:' ↑';color:var(--te);}
table.pr-t th.sd::after{content:' ↓';color:var(--te);}
table.pr-t th.ns{cursor:default;}
table.pr-t th.rt,table.pr-t td.rt{text-align:right;}
table.pr-t td{padding:10px 13px;border-bottom:1px solid var(--bdr);color:var(--tx);vertical-align:middle;}
table.pr-t tr:last-child td{border-bottom:none;}
table.pr-t tr:hover td{background:var(--sfc2);}
.sk{display:inline-block;height:12px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bdr) 50%,var(--bg2) 75%);background-size:600px 100%;animation:sh 1.4s infinite;}
.tb{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.04em;}
.tb-i{background:var(--grb);color:var(--gr);}.tb-e{background:var(--rdb);color:var(--rd);}
.ai{font-weight:700;color:var(--gr);}.ae{font-weight:700;color:var(--rd);}
.cp{display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;background:var(--blb);color:var(--bl);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pyc{display:flex;align-items:center;gap:7px;cursor:pointer;}
.pyc-av{width:26px;height:26px;border-radius:50%;overflow:hidden;background:var(--pub);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:1.5px solid var(--sfc);}
.pyc-nm{font-size:12px;font-weight:600;color:var(--pu);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s;}
.pyc:hover .pyc-nm{color:var(--te);text-decoration:underline;}
.sno{font-size:11px;color:var(--txf);}.dtc{font-size:12px;color:var(--txd);white-space:nowrap;}
.ntc{font-size:12px;color:var(--txm);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ra{display:flex;gap:4px;justify-content:center;}
.rb{background:none;border:none;cursor:pointer;padding:5px;border-radius:6px;color:var(--txf);transition:all .15s;display:inline-flex;}
.rb.ed:hover{color:var(--te);background:var(--tel);}
.rb.dl:hover{color:var(--rd);background:var(--rdb);}

/* PAGINATION */
.pg{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1.5px solid var(--bdr);background:var(--sfc2);flex-wrap:wrap;gap:10px;}
.pgi{font-size:12px;color:var(--txd);}
.pgi strong{color:var(--tx);font-weight:600;}
.pgbs{display:flex;gap:5px;align-items:center;flex-wrap:wrap;}
.pgb{min-width:32px;height:32px;padding:0 8px;background:var(--sfc);border:1.5px solid var(--bdr);border-radius:7px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;color:var(--txm);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;}
.pgb:hover:not(:disabled){border-color:var(--te);color:var(--te);background:var(--tel);}
.pgb:disabled{opacity:.35;cursor:not-allowed;}
.pgb.ac{background:var(--te);color:#fff;border-color:var(--te);}
.pgs{background:var(--sfc);border:1.5px solid var(--bdr);border-radius:7px;padding:0 10px;height:32px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txm);outline:none;cursor:pointer;appearance:none;}
.pgj{font-size:12px;color:var(--txd);display:flex;align-items:center;gap:6px;}
.pgj input{width:50px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:6px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--tx);outline:none;text-align:center;}
.pgj input:focus{border-color:var(--te);}
@media(max-width:640px){.pg{flex-direction:column;align-items:flex-start;}}

/* EMPTY / LOADING */
.emp{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.emp-ic{font-size:36px;}.emp-tt{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--txm);}
.emp-sb{font-size:13px;color:var(--txf);}
.pr-lb{height:3px;background:linear-gradient(90deg,var(--te),var(--gr),var(--te));background-size:200% 100%;animation:sh 1.2s infinite;margin-bottom:-3px;}

@media(max-width:640px){
  .pr-hd{padding:12px 0 10px;margin-bottom:14px;}
  .pr-bdg{display:none;}
  .sc-vl{font-size:20px!important;}
  .mbox{max-width:100%!important;border-radius:14px;}
}
`;

/* ═══════════ PAYEE AVATAR ═══════════ */
function Av({ name, map, size = 26, style = {} }) {
    const url = map?.[name]?.image_url;
    const ini = name ? name.charAt(0).toUpperCase() : "?";
    if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }} />;
    return <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--tel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "var(--te)", flexShrink: 0, ...style }}>{ini}</div>;
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
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
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
                onChange={e => { onChange(e.target.value); setOpen(true); setHi(0); }} onFocus={() => setOpen(true)} onKeyDown={onKD} autoComplete="off" />
            {showDD && (
                <div className="pdd">
                    {filtered.map((p, i) => (
                        <div key={p} className={`pdi${hi === i ? " hl" : ""}`} onMouseDown={() => sel(p)} onMouseEnter={() => setHi(i)}>
                            <div className="pdi-av"><Av name={p} map={map} size={26} /></div> {p}
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
                    <div style={{ fontSize: 12, color: "var(--txd)" }}>
                        <div style={{ fontWeight: 600 }}>Photo set</div>
                        <label style={{ color: "var(--te)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>
                            Change<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className={`iuz${drag ? " dov" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) onChange(f); }}>
                    <input type="file" accept="image/*" onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                    <div style={{ fontSize: 12, color: "var(--txd)", fontWeight: 500 }}>Click or drag photo</div>
                    <div style={{ fontSize: 10, color: "var(--txf)", marginTop: 3 }}>JPG, PNG, WEBP · max 2MB</div>
                </div>
            )}
        </div>
    );
}

/* ═══════════ TOAST ═══════════ */
function Toast({ msg, type, onHide }) {
    const [hd, setHd] = useState(false);
    useEffect(() => {
        const t1 = setTimeout(() => setHd(true), 2600);
        const t2 = setTimeout(onHide, 3000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    return <div className={`toast${type === "error" ? " er" : ""}${hd ? " hd" : ""}`}>{type === "error" ? "⚠️" : "✅"} {msg}</div>;
}

/* ═══════════ MODAL WRAPPER ═══════════ */
function Modal({ onClose, children, wide }) {
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
            <div className={`mbox${wide ? " wide" : ""}${cl ? " cl" : ""}`}>
                {typeof children === "function" ? children(close) : children}
            </div>
        </div>
    );
}

/* ═══════════ UPLOAD HELPER ═══════════ */
async function uploadImg(name, file) {
    const cleanName = file.name.replace(/\s+/g, "_");
    const path = `${Date.now()}_${cleanName}`;

    const { error } = await supabase
        .storage
        .from("payee-images")
        .upload(path, file, { upsert: true });

    if (error) {
        console.error("Upload FAILED:", error.message);
        return null;
    }

    const { data } = supabase
        .storage
        .from("payee-images")
        .getPublicUrl(path);

    return data.publicUrl;
}

async function ensurePayee(name, file) {
    if (!name) return;

    let imageUrl = null;

    // Upload image if provided
    if (file) {
        imageUrl = await uploadImg(name, file);
        console.log("Uploaded URL:", imageUrl);
    }

    // Save to DB
    const { error } = await supabase.from("payees").upsert([
        {
            name: name.trim(),
            image_url: imageUrl || undefined
        }
    ], { onConflict: "name" });

    if (error) {
        console.error("Payee Save Error:", error);
    }
}

/* ═══════════ ADD ENTRY MODAL ═══════════ */
const EF = { date: today(), amount: "", category: "", subcategory: "", payee_payer: "", payment_method: "Cash", description: "", account: "Personal Expense" };

function AddModal({ type, onClose, onSaved, payees, map, ensurePayee }) {
    const [f, setF] = useState(EF);
    const [pf, setPf] = useState(null);
    const [sv, setSv] = useState(false);
    const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
    const isE = type === "expense";
    const amt = Number(f.amount);
    const selectedInfo = map[f.payee_payer];
    const showPhoto = f.payee_payer.trim();

    const save = async (close) => {
        if (!amt || amt <= 0 || !f.date) return;
        setSv(true);
        await ensurePayee(f.payee_payer, pf);
        const { error } = await supabase.from("personal_expenses").insert([{
            date: f.date, amount: amt, type, category: f.category || null, subcategory: f.subcategory || null,
            payee_payer: f.payee_payer.trim() || null, payment_method: f.payment_method || null,
            description: f.description.trim() || null, account: f.account.trim() || null, raw_row: {},
        }]);
        setSv(false);
        if (error) { onSaved(false, "Failed: " + error.message); return; }
        onSaved(true, isE ? "Expense added!" : "Income added!");
        close();
    };

    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className={`mhd ${isE ? "eh" : "ih"}`}>
                    <div className="mhl">
                        <div className={`mti ${isE ? "e" : "i"}`}>{isE ? "▼" : "▲"}</div>
                        <div><div className="mt">{isE ? "Add Expense" : "Add Income"}</div><div className="ms">{isE ? "Record a spending" : "Record an income"}</div></div>
                    </div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div className="fg">
                        <div className="fw">
                            <label className="fl">Amount (₹) *</label>
                            <input className="pi" type="number" placeholder="0.00" value={f.amount} autoFocus onChange={e => sf("amount", e.target.value)} />
                            {amt > 0 && <div className={`ap ${isE ? "e" : "i"}`}><span className={`ap-lb ${isE ? "e" : "i"}`}>{isE ? "Spending" : "Receiving"}</span><span className={`ap-vl ${isE ? "e" : "i"}`}>{isE ? "−" : "+"}₹{fmtIN(amt)}</span></div>}
                        </div>
                        <div className="fw"><label className="fl">Date *</label><input className="pi" type="date" value={f.date} onChange={e => sf("date", e.target.value)} /></div>
                        <div className="fw"><label className="fl">Category</label>
                            <select className="ps" value={f.category} onChange={e => sf("category", e.target.value)}>
                                <option value="">Select…</option>{CATS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="fw"><label className="fl">Subcategory</label><input className="pi" type="text" placeholder="Optional…" value={f.subcategory} onChange={e => sf("subcategory", e.target.value)} /></div>
                        <div className="fw fcf">
                            <label className="fl">Payee / Payer</label>
                            {selectedInfo ? (
                                <div className="psr"><Av name={f.payee_payer} map={map} size={34} /><span className="psn">{f.payee_payer}</span><button className="psc" onClick={() => sf("payee_payer", "")}>Change</button></div>
                            ) : (
                                <PayeeInput value={f.payee_payer} onChange={v => sf("payee_payer", v)} payees={payees} map={map} disabled={sv} />
                            )}
                        </div>
                        {showPhoto && <div className="fw fcf"><ImgUpload value={pf} onChange={setPf} label="Add Photo for New Payee (optional)" /></div>}
                        <div className="fw"><label className="fl">Payment Method</label>
                            <select className="ps" value={f.payment_method} onChange={e => sf("payment_method", e.target.value)}>
                                {["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other"].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="fw"><label className="fl">Account</label><input className="pi" type="text" placeholder="e.g. Personal…" value={f.account} onChange={e => sf("account", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Description / Note</label><input className="pi" type="text" placeholder="Optional note…" value={f.description} onChange={e => sf("description", e.target.value)} /></div>
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

/* ═══════════ EDIT ENTRY MODAL ═══════════ */
function EditModal({ row, onClose, onSaved, payees, map, ensurePayee }) {
    const [f, setF] = useState({ date: row.date || today(), amount: String(row.amount || ""), category: row.category || "", subcategory: row.subcategory || "", payee_payer: row.payee_payer || "", payment_method: row.payment_method || "Cash", description: row.description || "", account: row.account || "" });
    const [sv, setSv] = useState(false);
    const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
    const isE = row.type === "expense";
    const amt = Number(f.amount);

    const save = async (close) => {
        if (!amt || amt <= 0 || !f.date) return;
        setSv(true);
        await ensurePayee(f.payee_payer);
        const { error } = await supabase.from("personal_expenses").update({
            date: f.date, amount: amt, category: f.category || null, subcategory: f.subcategory || null,
            payee_payer: f.payee_payer.trim() || null, payment_method: f.payment_method || null,
            description: f.description.trim() || null, account: f.account.trim() || null,
        }).eq("id", row.id);
        setSv(false);
        if (error) { onSaved(false, "Failed: " + error.message); return; }
        onSaved(true, "Entry updated!"); close();
    };

    return (
        <Modal onClose={onClose}>
            {(close) => (<>
                <div className={`mhd ${isE ? "eh" : "ih"}`}>
                    <div className="mhl">
                        <div className={`mti ${isE ? "e" : "i"}`}>✏️</div>
                        <div><div className="mt">Edit Entry</div><div className="ms">{isE ? "Expense" : "Income"} · {fmtDate(row.date)}</div></div>
                    </div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div className="fg">
                        <div className="fw">
                            <label className="fl">Amount (₹) *</label>
                            <input className="pi" type="number" value={f.amount} autoFocus onChange={e => sf("amount", e.target.value)} />
                            {amt > 0 && <div className={`ap ${row.type === "expense" ? "e" : "i"}`}><span className={`ap-lb ${row.type === "expense" ? "e" : "i"}`}>{isE ? "Spending" : "Receiving"}</span><span className={`ap-vl ${row.type === "expense" ? "e" : "i"}`}>{isE ? "−" : "+"}₹{fmtIN(amt)}</span></div>}
                        </div>
                        <div className="fw"><label className="fl">Date *</label><input className="pi" type="date" value={f.date} onChange={e => sf("date", e.target.value)} /></div>
                        <div className="fw"><label className="fl">Category</label>
                            <select className="ps" value={f.category} onChange={e => sf("category", e.target.value)}>
                                <option value="">Select…</option>{CATS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="fw"><label className="fl">Subcategory</label><input className="pi" type="text" value={f.subcategory} onChange={e => sf("subcategory", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Payee / Payer</label>
                            <PayeeInput value={f.payee_payer} onChange={v => sf("payee_payer", v)} payees={payees} map={map} />
                        </div>
                        <div className="fw"><label className="fl">Payment Method</label>
                            <select className="ps" value={f.payment_method} onChange={e => sf("payment_method", e.target.value)}>
                                {["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other"].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="fw"><label className="fl">Account</label><input className="pi" type="text" value={f.account} onChange={e => sf("account", e.target.value)} /></div>
                        <div className="fw fcf"><label className="fl">Description / Note</label><input className="pi" type="text" value={f.description} onChange={e => sf("description", e.target.value)} /></div>
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

/* ═══════════ PAYEE PROFILE MODAL ═══════════ */
function ProfileModal({ payee, onClose, onEditPayee, onDeletePayee, rows, map }) {
    const txns = useMemo(() => rows.filter(r => r.payee_payer === payee).sort((a, b) => new Date(b.date) - new Date(a.date)), [rows, payee]);
    const inc = txns.filter(r => r.type === "income").reduce((s, r) => s + (r.amount || 0), 0);
    const exp = txns.filter(r => r.type === "expense").reduce((s, r) => s + (r.amount || 0), 0);
    return (
        <Modal onClose={onClose} wide>
            {(close) => (<>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="ph">
                    <div className="pab"><Av name={payee} map={map} size={82} /></div>
                    <div className="pnm">{payee}</div>
                    <div style={{ fontSize: 12, color: "var(--txd)" }}>{txns.length} transaction{txns.length !== 1 ? "s" : ""}</div>
                    <div className="psr-r">
                        <div className="pst"><div className="pstv gr">+₹{fmtIN(inc)}</div><div className="pstl">Income</div></div>
                        <div className="pst"><div className="pstv rd">−₹{fmtIN(exp)}</div><div className="pstl">Expense</div></div>
                        <div className="pst"><div className={`pstv ${inc - exp >= 0 ? "te" : "rd"}`}>{inc - exp < 0 ? "−" : ""}₹{fmtIN(Math.abs(inc - exp))}</div><div className="pstl">Net</div></div>
                    </div>
                </div>
                <div className="mb">
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        <button className="btn btn-te" onClick={() => onEditPayee(close)}>✏️ Edit Payee</button>
                        <button className="btn btn-ol" style={{ color: "var(--rd)", borderColor: "var(--rd)" }} onClick={() => onDeletePayee(close)}>🗑 Delete Payee</button>
                    </div>
                    <div className="slb">Transactions</div>
                    {txns.length === 0
                        ? <div style={{ textAlign: "center", padding: "24px", color: "var(--txf)", fontSize: 13 }}>No transactions</div>
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
                                    </div>
                                </div>
                            ))}
                            {txns.length > 50 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--txf)", padding: "8px" }}>First 50 of {txns.length}</div>}
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
                <div className="mhd th">
                    <div className="mhl"><div className="mti t">👤</div><div><div className="mt">Edit Payee</div><div className="ms">Update name or photo</div></div></div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--tem)" }}>
                            <Av name={payee} map={{ [payee]: { image_url: currImg } }} size={80} />
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <ImgUpload value={pf} onChange={setPf} label="Update Photo" />
                        <div className="fw"><label className="fl">Payee Name</label><input className="pi" type="text" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
                    </div>
                </div>
                <div className="mft">
                    <button className="btn btn-te btn-fl" onClick={() => save(close)} disabled={sv || !name.trim()}>
                        {sv ? <><span className="bsp" />Saving…</> : "💾 Save Changes"}
                    </button>
                    <button className="btn btn-ol" onClick={close}>Cancel</button>
                </div>
            </>)}
        </Modal>
    );
}

/* ═══════════ MANAGE PAYEES MODAL ═══════════ */
function ManageModal({ onClose, rows, map, payees, onRefresh, showToast }) {
    const [editP, setEditP] = useState(null);
    const [viewP, setViewP] = useState(null);
    const [q, setQ] = useState("");
    const filtered = useMemo(() => q.trim() ? payees.filter(p => p.toLowerCase().includes(q.toLowerCase())) : payees, [payees, q]);
    const cnt = p => rows.filter(r => r.payee_payer === p).length;

    const del = async p => {
        if (!window.confirm(`Delete payee "${p}"?`)) return;
        await supabase.from("payees").delete().eq("name", p);
        showToast(`"${p}" deleted`); onRefresh();
    };

    if (editP) return <EditPayeeModal payee={editP} map={map} onClose={() => setEditP(null)} onSaved={() => { setEditP(null); onRefresh(); showToast("Payee updated!"); }} />;
    if (viewP) return (
        <ProfileModal payee={viewP} rows={rows} map={map} onClose={() => setViewP(null)}
            onEditPayee={close => { close(); setTimeout(() => setEditP(viewP), 250); }}
            onDeletePayee={close => { close(); setTimeout(() => del(viewP), 250); }} />
    );

    return (
        <Modal onClose={onClose} wide>
            {(close) => (<>
                <div className="mhd th">
                    <div className="mhl"><div className="mti t">👥</div><div><div className="mt">Manage Payees</div><div className="ms">{payees.length} payee{payees.length !== 1 ? "s" : ""} total</div></div></div>
                    <button className="mcb" onClick={close}>✕</button>
                </div>
                <div className="mb">
                    <div style={{ marginBottom: 14 }}><input className="pi" type="text" placeholder="Search payees…" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
                    {filtered.length === 0
                        ? <div style={{ textAlign: "center", padding: "24px", color: "var(--txf)", fontSize: 13 }}>No payees found</div>
                        : <div className="pl">
                            {filtered.map(p => (
                                <div className="pli" key={p}>
                                    <div className="pla"><Av name={p} map={map} size={40} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="plnm" onClick={() => setViewP(p)}>{p}</div>
                                        <div className="plct">{cnt(p)} transaction{cnt(p) !== 1 ? "s" : ""}</div>
                                    </div>
                                    <div className="plas">
                                        <button className="bg ed" onClick={() => setViewP(p)} title="View">👁</button>
                                        <button className="bg ed" onClick={() => setEditP(p)} title="Edit">✏️</button>
                                        <button className="bg dl" onClick={() => del(p)} title="Delete">🗑</button>
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
    const [rows, setRows] = useState([]);
    const [loading, setLd] = useState(true);
    const [total, setTotal] = useState(0);
    const [pData, setPData] = useState({});  // { name -> {name,image_url} }

    const [search, setSearch] = useState("");
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
    const [manageP, setManageP] = useState(false);
    const [editP, setEditP] = useState(null);
    const [toasts, setToasts] = useState([]);

    const toast = (msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]);

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

    const ensurePayee = async (name, photoFile = null) => {
        if (!name || !name.trim()) return;
        const n = name.trim();
        let img = pData[n]?.image_url || null;
        if (photoFile && !img) img = await uploadImg(n, photoFile);
        await supabase.from("payees").upsert([{ name: n, image_url: img }], { onConflict: "name" });
        setPData(p => ({ ...p, [n]: { name: n, image_url: img } }));
    };

    const allPayees = useMemo(() => {
        const fr = rows.map(r => r.payee_payer).filter(Boolean);
        return Array.from(new Set([...Object.keys(pData), ...fr])).sort();
    }, [pData, rows]);

    const allCats = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))).sort(), [rows]);

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
        <style>{CSS}</style>
        <Navbar />
        <div className="pr">
            {loading && <div className="pr-lb" />}

            {/* TOASTS */}
            {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onHide={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}

            {/* MODALS */}
            {modal && <AddModal type={modal} onClose={() => setModal(null)} onSaved={onSaved} payees={allPayees} map={pData} ensurePayee={ensurePayee} />}
            {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={(ok, msg) => { onSaved(ok, msg); setEditRow(null); }} payees={allPayees} map={pData} ensurePayee={ensurePayee} />}
            {viewP && <ProfileModal payee={viewP} rows={rows} map={pData} onClose={() => setViewP(null)}
                onEditPayee={close => { close(); setTimeout(() => { setViewP(null); setEditP(viewP); }, 250); }}
                onDeletePayee={async close => { if (!window.confirm(`Delete "${viewP}"?`)) return; await supabase.from("payees").delete().eq("name", viewP); toast(`"${viewP}" deleted`); await fetchPayees(); close(); setViewP(null); }}
            />}
            {editP && <EditPayeeModal payee={editP} map={pData} onClose={() => setEditP(null)} onSaved={async () => { setEditP(null); await fetchAll(); await fetchPayees(); toast("Payee updated!"); }} />}
            {manageP && <ManageModal onClose={() => setManageP(false)} rows={rows} map={pData} payees={allPayees} showToast={toast} onRefresh={async () => { await fetchAll(); await fetchPayees(); }} />}

            {/* HEADER */}
            <div className="pr-hd">
                <div className="pr-hdi">
                    <div>
                        <div className="pr-ey">Personal Expenses</div>
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
                <p className="sec-ttl">Summary</p>
                <div className="pr-sts">
                    <div className="sc sc1">
                        <div className="sc-ac ag" />
                        <div className="sc-tp"><div><div className="sc-lb">Total Income</div><div className="sc-vl gr">₹{fmtIN(totI)}</div></div><div className="sc-ic" style={{ background: "var(--grb)" }}>▲</div></div>
                        <div className="sc-wd gr">{toWords(totI)}</div>
                        <div className="sc-ct">{rows.filter(r => r.type === "income").length.toLocaleString("en-IN")} entries</div>
                        {hasF && <div className="fb gr"><span className="fb-lb gr">🔍 Filtered</span><span className="fb-am gr">+₹{fmtIN(fI)}</span><span className="fb-wd gr">{toWords(fI)}</span></div>}
                    </div>
                    <div className="sc sc2">
                        <div className="sc-ac ar" />
                        <div className="sc-tp"><div><div className="sc-lb">Total Expenses</div><div className="sc-vl rd">₹{fmtIN(totE)}</div></div><div className="sc-ic" style={{ background: "var(--rdb)" }}>▼</div></div>
                        <div className="sc-wd rd">{toWords(totE)}</div>
                        <div className="sc-ct">{rows.filter(r => r.type === "expense").length.toLocaleString("en-IN")} entries</div>
                        {hasF && <div className="fb rd"><span className="fb-lb rd">🔍 Filtered</span><span className="fb-am rd">−₹{fmtIN(fE)}</span><span className="fb-wd rd">{toWords(fE)}</span></div>}
                    </div>
                    <div className="sc sc3">
                        <div className={`sc-ac ${net >= 0 ? "at" : "ar"}`} />
                        <div className="sc-tp"><div><div className="sc-lb">Net Balance</div><div className={`sc-vl ${net >= 0 ? "te" : "rd"}`}>{net < 0 ? "−" : ""}₹{fmtIN(Math.abs(net))}</div></div><div className="sc-ic" style={{ background: net >= 0 ? "var(--tel)" : "var(--rdb)" }}>{net >= 0 ? "📈" : "📉"}</div></div>
                        <div className={`sc-wd ${net >= 0 ? "te" : "rd"}`}>{net < 0 ? "Deficit: " : ""}{toWords(Math.abs(net))}</div>
                        <div className="sc-ct">Income minus expenses</div>
                        {hasF && <div className={`fb ${fN >= 0 ? "te" : "rd"}`}><span className={`fb-lb ${fN >= 0 ? "te" : "rd"}`}>🔍 Filtered</span><span className={`fb-am ${fN >= 0 ? "te" : "rd"}`}>{fN < 0 ? "−" : ""}₹{fmtIN(Math.abs(fN))}</span><span className={`fb-wd ${fN >= 0 ? "te" : "rd"}`}>{toWords(Math.abs(fN))}</span></div>}
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="pr-ctrl">
                    <div className="pr-cr">
                        <div className="sw"><span className="si">🔍</span><input className="sr" type="text" placeholder="Search date, category, payee, amount…" value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <select className={`fs${tF !== "all" ? " af" : ""}`} value={tF} onChange={e => setTF(e.target.value)}><option value="all">All Types</option><option value="income">▲ Income</option><option value="expense">▼ Expense</option></select>
                        <select className={`fs${cF !== "all" ? " af" : ""}`} value={cF} onChange={e => setCF(e.target.value)}><option value="all">All Categories</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select className={`fs${pF !== "all" ? " af" : ""}`} value={pF} onChange={e => setPF(e.target.value)}><option value="all">All Payees</option>{allPayees.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        {hasF && <button className="cb" onClick={clrF}>✕ Clear</button>}
                        <span className="rc">{filtered.length.toLocaleString("en-IN")} records</span>
                    </div>
                    {hasF && <div className="afr">
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--txf)" }}>Filters:</span>
                        {tF !== "all" && <span className="fp">{tF === "income" ? "▲" : "▼"} {tF}<button className="fpx" onClick={() => setTF("all")}>×</button></span>}
                        {cF !== "all" && <span className="fp">📂 {cF}<button className="fpx" onClick={() => setCF("all")}>×</button></span>}
                        {pF !== "all" && <span className="fp">👤 {pF}<button className="fpx" onClick={() => setPF("all")}>×</button></span>}
                        {search && <span className="fp">🔍 "{search}"<button className="fpx" onClick={() => setSearch("")}>×</button></span>}
                    </div>}
                </div>

                {/* TABLE */}
                <p className="sec-ttl">
                    Transactions
                    {filtered.length > 0 && <span style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 400, color: "var(--txd)", fontStyle: "normal" }}>&nbsp;Page {safePg}/{totPg} · {pgSt + 1}–{Math.min(pgSt + pSz, filtered.length)}</span>}
                </p>

                <div className="pr-tbl">
                    <div className="tscr">
                        <div className="tsh">← scroll to see all columns →</div>
                        <table className="pr-t">
                            <thead><tr>
                                <th className="ns" style={{ width: 40 }}>#</th>
                                <th className={tc("date")} onClick={() => sort("date")}>Date</th>
                                <th className={tc("type")} onClick={() => sort("type")}>Type</th>
                                <th className={`rt ${tc("amount")}`} onClick={() => sort("amount")}>Amount (₹)</th>
                                <th className={tc("category")} onClick={() => sort("category")}>Category</th>
                                <th className={tc("subcategory")} onClick={() => sort("subcategory")}>Sub</th>
                                <th className={tc("payee_payer")} onClick={() => sort("payee_payer")}>Payee / Payer</th>
                                <th className={tc("payment_method")} onClick={() => sort("payment_method")}>Method</th>
                                <th className={tc("description")} onClick={() => sort("description")}>Note</th>
                                <th className={tc("account")} onClick={() => sort("account")}>Account</th>
                                <th className="ns" style={{ width: 76 }}>Actions</th>
                            </tr></thead>
                            <tbody>
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 11 }).map((_, j) => <td key={j}><span className="sk" style={{ width: j === 3 ? 70 : j === 0 ? 28 : 80 + (j * 5) + "px" }} /></td>)}</tr>)
                                    : pgRows.length === 0
                                        ? <tr><td colSpan={11} style={{ padding: 0 }}><div className="emp"><span className="emp-ic">{hasF ? "🔍" : "📭"}</span><div className="emp-tt">{hasF ? "No results found" : "No records yet"}</div><div className="emp-sb">{hasF ? "Adjust filters" : "Use Add buttons below"}</div></div></td></tr>
                                        : pgRows.map((row, i) => (
                                            <tr key={row.id}>
                                                <td className="sno">{pgSt + i + 1}</td>
                                                <td className="dtc">{fmtDate(row.date)}</td>
                                                <td><span className={`tb ${row.type === "income" ? "tb-i" : "tb-e"}`}>{row.type === "income" ? "▲ Inc" : "▼ Exp"}</span></td>
                                                <td className={`rt ${row.type === "income" ? "ai" : "ae"}`}>{row.type === "income" ? "+" : "−"}₹{fmtIN(row.amount)}</td>
                                                <td>{row.category ? <span className="cp">{row.category}</span> : <span style={{ color: "var(--txf)" }}>—</span>}</td>
                                                <td style={{ fontSize: 12, color: "var(--txd)" }}>{row.subcategory || "—"}</td>
                                                <td>
                                                    {row.payee_payer
                                                        ? <div className="pyc" onClick={() => setViewP(row.payee_payer)} title={`View ${row.payee_payer}`}>
                                                            <div className="pyc-av"><Av name={row.payee_payer} map={pData} size={26} /></div>
                                                            <span className="pyc-nm">{row.payee_payer}</span>
                                                        </div>
                                                        : <span style={{ color: "var(--txf)" }}>—</span>}
                                                </td>
                                                <td style={{ fontSize: 12, color: "var(--txd)" }}>{row.payment_method || "—"}</td>
                                                <td className="ntc" title={row.description || ""}>{row.description || "—"}</td>
                                                <td style={{ fontSize: 11, color: "var(--txf)" }}>{row.account || "—"}</td>
                                                <td>
                                                    <div className="ra">
                                                        <button className="rb ed" onClick={() => setEditRow(row)} title="Edit">
                                                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                        </button>
                                                        <button className="rb dl" onClick={() => delRow(row.id)} title="Delete">
                                                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                }
                            </tbody>
                            {!loading && filtered.length > 0 && <tfoot><tr>
                                <td colSpan={3} style={{ padding: "10px 13px", background: "var(--bg2)", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--txd)" }}>{hasF ? "Filtered" : "All"} Totals</td>
                                <td className="rt" style={{ padding: "10px 13px", background: "var(--bg2)" }}>
                                    <div style={{ fontSize: 12, color: "var(--gr)", fontWeight: 700 }}>+₹{fmtIN(fI)}</div>
                                    <div style={{ fontSize: 12, color: "var(--rd)", fontWeight: 700 }}>−₹{fmtIN(fE)}</div>
                                </td>
                                <td colSpan={7} style={{ background: "var(--bg2)" }} />
                            </tr></tfoot>}
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {!loading && filtered.length > 0 && (
                        <div className="pg">
                            <div className="pgi">Showing <strong>{pgSt + 1}–{Math.min(pgSt + pSz, filtered.length)}</strong> of <strong>{filtered.length.toLocaleString("en-IN")}</strong></div>
                            {totPg > 1 && <div className="pgbs">
                                <button className="pgb" disabled={safePg === 1} onClick={() => setPage(1)}>«</button>
                                <button className="pgb" disabled={safePg === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                {pgBtns.map((p, idx) => {
                                    const prev = pgBtns[idx - 1];
                                    return <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {prev && p - prev > 1 && <span style={{ color: "var(--txf)", fontSize: 12 }}>…</span>}
                                        <button className={`pgb${safePg === p ? " ac" : ""}`} onClick={() => setPage(p)}>{p}</button>
                                    </span>;
                                })}
                                <button className="pgb" disabled={safePg === totPg} onClick={() => setPage(p => p + 1)}>›</button>
                                <button className="pgb" disabled={safePg === totPg} onClick={() => setPage(totPg)}>»</button>
                            </div>}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <select className="pgs" value={pSz} onChange={e => { setPSz(Number(e.target.value)); setPage(1); }}>
                                    {PAGE_SIZES.map(n => <option key={n} value={n}>{n}/page</option>)}
                                </select>
                                {totPg > 5 && <div className="pgj">
                                    Go to <input type="number" min={1} max={totPg} value={jump} onChange={e => setJump(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") { const v = Number(jump); if (v >= 1 && v <= totPg) { setPage(v); setJump(""); } } }}
                                        placeholder={safePg} />
                                    <button className="pgb" style={{ padding: "0 10px", height: 32 }} onClick={() => { const v = Number(jump); if (v >= 1 && v <= totPg) { setPage(v); setJump(""); } }}>Go</button>
                                </div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* FABs */}
        <div className="fab-c">

            {/* Toggle Button */}
            <button
                className="fab"
                onClick={() => setFabOpen(!fabOpen)}
                style={{ background: "#0d9488", color: "#fff" }}
            >
                <span className="fab-ic">
                    {fabOpen ? "✕" : "+"}
                </span>
            </button>

            {/* Show only when open */}
            {fabOpen && (
                <>
                    <button
                        className="fab fab-exp"
                        onClick={() => {
                            setModal("expense");
                            setFabOpen(false);
                        }}
                    >
                        <span className="fab-ic">▼</span>
                        <span>Add Expense</span>
                    </button>

                    <button
                        className="fab fab-inc"
                        onClick={() => {
                            setModal("income");
                            setFabOpen(false);
                        }}
                    >
                        <span className="fab-ic">▲</span>
                        <span>Add Income</span>
                    </button>
                </>
            )}

        </div>
    </>);
}