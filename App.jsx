import { useState, useEffect, useRef } from "react";

// ─── Google Fonts ───────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@300;400;500;600;700&display=swap";
document.head.appendChild(FONT_LINK);

// ─── QR Code (simple canvas-based) ──────────────────────────────────────────
function QRCanvas({ value, size = 120 }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    const cells = 21;
    const cell = size / cells;
    // Simple visual QR placeholder (real app uses qrcode.js)
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1a3a6e";
    const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (i) => ((seed * (i + 1) * 2654435761) >>> 0) % 2;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const corner = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        if (corner) {
          const inner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) || (r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) || (r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4);
          const outerBox = r === 0 || r === 6 || c === 0 || c === 6 || r === cells - 7 || r === cells - 1 || c === cells - 7 || c === cells - 1;
          if (inner || outerBox) { ctx.fillRect(c * cell, r * cell, cell, cell); }
        } else if (rng(r * cells + c)) {
          ctx.fillRect(c * cell, r * cell, cell, cell);
        }
      }
    }
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} style={{ display: "block" }} />;
}

// ─── Utilities ───────────────────────────────────────────────────────────────
const genDID = (name) => {
  const h = Array.from(name + Date.now()).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  return `did:ethr:0x${Math.abs(h).toString(16).padStart(8, "0")}${Math.random().toString(16).slice(2, 18)}`;
};
const genHash = () => "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const genIPFS = () => "Qm" + Array.from({ length: 44 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("");
const shortHash = (h) => h ? h.slice(0, 10) + "…" + h.slice(-6) : "";
const today = () => new Date().toISOString().slice(0, 10);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#1a3a6e;--navy-dark:#0f2550;--navy-light:#2450a0;
  --gold:#c8920a;--gold-light:#f0b429;--gold-pale:#fef9ee;
  --red:#b91c1c;
  --bg:#f7f8fa;--white:#ffffff;
  --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-200:#e5e7eb;
  --gray-300:#d1d5db;--gray-400:#9ca3af;--gray-500:#6b7280;
  --gray-600:#4b5563;--gray-700:#374151;--gray-800:#1f2937;
  --text:#1f2937;--text-light:#4b5563;
  --serif:'Merriweather',Georgia,serif;
  --sans:'Source Sans 3',system-ui,sans-serif;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.04);
  --shadow:0 4px 12px rgba(0,0,0,.08),0 2px 4px rgba(0,0,0,.04);
  --shadow-lg:0 12px 32px rgba(0,0,0,.10),0 4px 8px rgba(0,0,0,.06);
  --radius:4px;--radius-lg:8px;
}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;font-size:15px}

/* ── TOPBAR ── */
.topbar{background:var(--navy-dark);color:#fff;font-size:.72rem;padding:6px 0;border-bottom:2px solid var(--gold)}
.topbar-inner{max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.topbar a{color:var(--gold-light);text-decoration:none}

/* ── NAVBAR ── */
.navbar{background:var(--white);border-bottom:3px solid var(--navy);box-shadow:var(--shadow);position:sticky;top:0;z-index:100}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;cursor:pointer}
.brand-emblem{width:48px;height:48px;background:var(--navy);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.brand-emblem svg{width:28px;height:28px;fill:var(--gold-light)}
.brand-text{}
.brand-uni{font-family:var(--serif);font-size:.7rem;color:var(--navy);font-weight:700;letter-spacing:.5px;text-transform:uppercase;line-height:1.2}
.brand-dept{font-size:.65rem;color:var(--gray-500);letter-spacing:.3px}
.nav-links{display:flex;align-items:center;gap:2px}
.nav-link{font-size:.82rem;font-weight:600;color:var(--gray-700);padding:8px 14px;border-radius:var(--radius);text-decoration:none;background:none;border:none;cursor:pointer;transition:color .15s,background .15s;white-space:nowrap}
.nav-link:hover{color:var(--navy);background:var(--gray-100)}
.nav-link.active{color:var(--navy);border-bottom:2px solid var(--gold)}
.nav-right{display:flex;align-items:center;gap:10px}
.btn-wallet{font-size:.78rem;font-weight:600;padding:8px 16px;border-radius:var(--radius);border:2px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;white-space:nowrap}
.btn-wallet:hover{background:var(--navy-light)}
.btn-wallet.connected{background:#166534;border-color:#166534}
.wallet-dot{width:7px;height:7px;border-radius:50%;background:#4ade80}
.hamburger{display:none;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:6px}
.hamburger span{display:block;width:22px;height:2px;background:var(--navy);border-radius:2px;transition:all .2s}
@media(max-width:900px){
  .nav-links{display:none;position:absolute;top:68px;left:0;right:0;background:var(--white);flex-direction:column;padding:12px 24px 16px;border-bottom:2px solid var(--navy);gap:0;box-shadow:var(--shadow)}
  .nav-links.open{display:flex}
  .nav-link{width:100%;padding:12px 8px;border-bottom:1px solid var(--gray-100)}
  .hamburger{display:flex}
  .brand-text .brand-uni{font-size:.62rem}
}

/* ── HERO ── */
.hero{background:linear-gradient(135deg,var(--navy-dark) 0%,var(--navy) 60%,var(--navy-light) 100%);color:#fff;padding:72px 24px 80px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")}
.hero-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 420px;gap:64px;align-items:center}
.hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(200,146,10,.15);border:1px solid rgba(200,146,10,.4);color:var(--gold-light);font-size:.72rem;font-weight:600;padding:5px 12px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px}
.hero h1{font-family:var(--serif);font-size:clamp(1.8rem,4vw,2.9rem);line-height:1.2;margin-bottom:20px;font-weight:900}
.hero h1 span{color:var(--gold-light)}
.hero-sub{font-size:1rem;color:rgba(255,255,255,.82);line-height:1.7;margin-bottom:32px;max-width:520px}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap}
.btn-hero-primary{background:var(--gold);color:var(--navy-dark);font-weight:700;font-size:.9rem;padding:13px 28px;border-radius:var(--radius);border:none;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.btn-hero-primary:hover{background:var(--gold-light);transform:translateY(-1px)}
.btn-hero-secondary{background:transparent;color:#fff;font-weight:600;font-size:.9rem;padding:13px 28px;border-radius:var(--radius);border:2px solid rgba(255,255,255,.4);cursor:pointer;transition:all .15s;text-decoration:none}
.btn-hero-secondary:hover{border-color:#fff;background:rgba(255,255,255,.08)}
.hero-card{background:rgba(255,255,255,.07);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);border-radius:var(--radius-lg);padding:28px;animation:fadeUp .7s ease both}
.hero-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.hero-stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius);padding:16px;text-align:center}
.hero-stat-val{font-family:var(--serif);font-size:1.8rem;font-weight:900;color:var(--gold-light)}
.hero-stat-label{font-size:.7rem;color:rgba(255,255,255,.6);letter-spacing:.5px;text-transform:uppercase;margin-top:2px}
.hero-steps{display:flex;flex-direction:column;gap:10px}
.hero-step{display:flex;align-items:center;gap:10px;font-size:.82rem;color:rgba(255,255,255,.8)}
.hero-step-num{width:22px;height:22px;border-radius:50%;background:var(--gold);color:var(--navy-dark);font-weight:700;font-size:.7rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
@media(max-width:900px){.hero-inner{grid-template-columns:1fr}.hero-card{display:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* ── SECTION WRAPPER ── */
.section{padding:64px 24px}
.section-alt{background:var(--white)}
.section-inner{max-width:1200px;margin:0 auto}
.section-label{font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.section-title{font-family:var(--serif);font-size:clamp(1.5rem,3vw,2rem);font-weight:900;color:var(--navy);margin-bottom:12px}
.section-sub{font-size:.95rem;color:var(--text-light);max-width:580px;line-height:1.7}
.section-header{margin-bottom:40px}
.divider{width:48px;height:3px;background:var(--gold);border-radius:2px;margin:16px 0}

/* ── CARDS ── */
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:28px;transition:box-shadow .2s,transform .2s;animation:fadeUp .6s ease both}
.card:hover{box-shadow:var(--shadow-lg);transform:translateY(-2px)}
.card-icon{width:48px;height:48px;border-radius:var(--radius);background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:16px}
.card-title{font-family:var(--serif);font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:8px}
.card-desc{font-size:.85rem;color:var(--text-light);line-height:1.6}
.card-accent{border-top:3px solid var(--gold)}

/* ── HOW IT WORKS ── */
.steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0;position:relative}
.steps-grid::before{content:'';position:absolute;top:28px;left:14%;right:14%;height:2px;background:var(--gray-200);z-index:0}
.step-item{text-align:center;padding:0 16px;position:relative;z-index:1}
.step-num{width:56px;height:56px;border-radius:50%;background:var(--navy);color:#fff;font-family:var(--serif);font-size:1.2rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:3px solid var(--white);box-shadow:0 0 0 3px var(--navy)}
.step-title{font-weight:700;font-size:.9rem;color:var(--navy);margin-bottom:6px}
.step-desc{font-size:.8rem;color:var(--text-light);line-height:1.5}
@media(max-width:700px){.steps-grid::before{display:none}.steps-grid{grid-template-columns:1fr 1fr}}

/* ── PORTAL CARDS ── */
.portal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media(max-width:900px){.portal-grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.portal-grid{grid-template-columns:1fr}}
.portal-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:32px 28px;cursor:pointer;transition:all .2s;text-align:center;text-decoration:none;display:block}
.portal-card:hover{border-color:var(--navy);box-shadow:var(--shadow-lg);transform:translateY(-3px)}
.portal-card-icon{font-size:2.5rem;margin-bottom:16px}
.portal-card-title{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:8px}
.portal-card-desc{font-size:.83rem;color:var(--text-light);line-height:1.6;margin-bottom:16px}
.portal-card-tag{font-size:.72rem;font-weight:600;color:var(--gold);letter-spacing:.5px;text-transform:uppercase}
.portal-card.featured{background:var(--navy);border-color:var(--navy)}
.portal-card.featured .portal-card-title,.portal-card.featured .portal-card-desc,.portal-card.featured .portal-card-tag{color:#fff}
.portal-card.featured .portal-card-tag{color:var(--gold-light)}

/* ── DASHBOARD LAYOUT ── */
.dash-layout{display:grid;grid-template-columns:220px 1fr;gap:0;min-height:calc(100vh - 140px);background:var(--bg)}
@media(max-width:768px){.dash-layout{grid-template-columns:1fr}}
.sidebar{background:var(--navy-dark);color:#fff;padding:0}
.sidebar-header{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.sidebar-title{font-family:var(--serif);font-size:.85rem;font-weight:700;color:var(--gold-light);letter-spacing:.5px;text-transform:uppercase}
.sidebar-sub{font-size:.7rem;color:rgba(255,255,255,.5);margin-top:2px}
.sidebar-nav{padding:12px 0}
.sidebar-item{display:flex;align-items:center;gap:10px;padding:11px 20px;font-size:.83rem;color:rgba(255,255,255,.75);cursor:pointer;transition:all .15s;border-left:3px solid transparent;background:none;border-top:none;border-right:none;border-bottom:none;width:100%;text-align:left}
.sidebar-item:hover{background:rgba(255,255,255,.06);color:#fff}
.sidebar-item.active{background:rgba(200,146,10,.12);border-left-color:var(--gold);color:var(--gold-light)}
.sidebar-item-icon{width:18px;text-align:center;flex-shrink:0}
.sidebar-divider{height:1px;background:rgba(255,255,255,.08);margin:8px 0}
@media(max-width:768px){.sidebar{display:none}}
.dash-content{padding:28px;overflow-x:auto}
.dash-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.dash-title{font-family:var(--serif);font-size:1.4rem;font-weight:700;color:var(--navy)}
.dash-sub{font-size:.83rem;color:var(--text-light);margin-top:2px}

/* ── STAT ROW ── */
.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:28px}
.stat-box{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:20px;border-left:4px solid var(--navy)}
.stat-box-val{font-family:var(--serif);font-size:1.8rem;font-weight:900;color:var(--navy)}
.stat-box-label{font-size:.75rem;color:var(--text-light);margin-top:4px;letter-spacing:.3px}
.stat-box.gold{border-left-color:var(--gold)}
.stat-box.green{border-left-color:#166534}
.stat-box.red{border-left-color:var(--red)}

/* ── TABLE ── */
.table-wrap{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm)}
.table-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--gray-200);flex-wrap:wrap;gap:10px}
.table-title{font-weight:700;font-size:.9rem;color:var(--navy)}
table{width:100%;border-collapse:collapse;font-size:.83rem}
thead{background:var(--gray-50)}
th{padding:11px 16px;text-align:left;font-size:.72rem;font-weight:700;color:var(--text-light);letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
td{padding:12px 16px;border-top:1px solid var(--gray-100);color:var(--text);vertical-align:middle}
tr:hover td{background:var(--gray-50)}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;padding:3px 9px;border-radius:20px;letter-spacing:.3px}
.badge-green{background:#dcfce7;color:#166534}
.badge-red{background:#fee2e2;color:#991b1b}
.badge-yellow{background:#fef9c3;color:#854d0e}
.badge-blue{background:#dbeafe;color:#1e40af}
.badge-gray{background:var(--gray-100);color:var(--gray-600)}

/* ── FORM ── */
.form-panel{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:28px;box-shadow:var(--shadow-sm)}
.form-title{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:4px}
.form-sub{font-size:.82rem;color:var(--text-light);margin-bottom:24px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.form-grid{grid-template-columns:1fr}}
.form-group{display:flex;flex-direction:column;gap:5px}
.form-group.full{grid-column:1/-1}
label{font-size:.78rem;font-weight:600;color:var(--gray-700);letter-spacing:.2px}
input,select,textarea{font-family:var(--sans);font-size:.87rem;padding:9px 13px;border:1.5px solid var(--gray-300);border-radius:var(--radius);color:var(--text);background:var(--white);outline:none;transition:border-color .15s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--navy)}
textarea{resize:vertical;min-height:80px}
select option{background:var(--white)}
.form-hint{font-size:.72rem;color:var(--text-light)}

/* ── BUTTONS ── */
.btn{font-family:var(--sans);font-size:.85rem;font-weight:600;padding:10px 22px;border-radius:var(--radius);border:none;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--navy);color:#fff}
.btn-primary:hover{background:var(--navy-light)}
.btn-gold{background:var(--gold);color:var(--navy-dark)}
.btn-gold:hover{background:var(--gold-light)}
.btn-outline{background:transparent;color:var(--navy);border:2px solid var(--navy)}
.btn-outline:hover{background:var(--navy);color:#fff}
.btn-danger{background:var(--red);color:#fff}
.btn-success{background:#166534;color:#fff}
.btn-sm{padding:6px 14px;font-size:.78rem}
.btn-full{width:100%;justify-content:center}
.btn:disabled{opacity:.5;cursor:not-allowed}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--white);border-radius:var(--radius-lg);padding:32px;max-width:520px;width:100%;box-shadow:var(--shadow-lg);animation:slideUp .25s ease}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.modal-title{font-family:var(--serif);font-size:1.2rem;font-weight:700;color:var(--navy);margin-bottom:4px}
.modal-sub{font-size:.82rem;color:var(--text-light);margin-bottom:24px}
.modal-close{position:absolute;top:16px;right:16px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--gray-400)}
.modal-wrap{position:relative}

/* ── QR ── */
.qr-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-lg)}
.qr-label{font-size:.72rem;color:var(--text-light);letter-spacing:.5px;text-transform:uppercase;text-align:center}
.qr-value{font-size:.7rem;color:var(--navy);word-break:break-all;text-align:center;font-family:monospace;background:var(--white);border:1px solid var(--gray-200);padding:6px 10px;border-radius:var(--radius);width:100%}

/* ── VERIFIER ── */
.verify-box{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow);max-width:680px;margin:0 auto}
.verify-result{padding:24px;border-radius:var(--radius-lg);margin-top:20px;animation:fadeUp .3s ease}
.verify-result.success{background:#f0fdf4;border:1.5px solid #86efac}
.verify-result.fail{background:#fef2f2;border:1.5px solid #fca5a5}
.verify-result-icon{font-size:2rem;margin-bottom:8px}
.verify-result-title{font-family:var(--serif);font-size:1.1rem;font-weight:700;margin-bottom:8px}
.verify-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;font-size:.82rem}
.verify-field{background:var(--white);padding:8px 12px;border-radius:var(--radius);border:1px solid var(--gray-200)}
.verify-field-key{font-size:.68rem;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px}
.verify-field-val{color:var(--text);margin-top:2px;font-weight:500}

/* ── ABOUT ── */
.team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.team-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:24px;text-align:center;transition:box-shadow .2s}
.team-card:hover{box-shadow:var(--shadow)}
.team-avatar{width:64px;height:64px;border-radius:50%;background:var(--navy);color:#fff;font-family:var(--serif);font-size:1.3rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.team-name{font-weight:700;font-size:.9rem;color:var(--navy);margin-bottom:4px}
.team-role{font-size:.78rem;color:var(--text-light)}
.team-dept{font-size:.72rem;color:var(--gold);font-weight:600;margin-top:4px}
.info-box{background:var(--gold-pale);border:1px solid rgba(200,146,10,.25);border-left:4px solid var(--gold);border-radius:var(--radius-lg);padding:24px;margin-top:32px}
.info-box-title{font-family:var(--serif);font-weight:700;color:var(--navy);margin-bottom:8px}
.info-box-text{font-size:.87rem;color:var(--text-light);line-height:1.7}

/* ── CONTACT ── */
.contact-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:32px;align-items:start}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr}}
.contact-info-item{display:flex;gap:14px;margin-bottom:20px;align-items:flex-start}
.contact-info-icon{width:40px;height:40px;border-radius:var(--radius);background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.contact-info-label{font-size:.72rem;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px}
.contact-info-val{font-size:.88rem;color:var(--text);margin-top:2px}

/* ── FOOTER ── */
.footer{background:var(--navy-dark);color:rgba(255,255,255,.7);padding:40px 24px 20px;margin-top:auto}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:40px;margin-bottom:32px}
@media(max-width:768px){.footer-top{grid-template-columns:1fr}}
.footer-brand-name{font-family:var(--serif);font-size:1rem;font-weight:700;color:#fff;margin-bottom:4px}
.footer-brand-sub{font-size:.75rem;color:rgba(255,255,255,.5)}
.footer-brand-desc{font-size:.8rem;margin-top:12px;line-height:1.6}
.footer-col-title{font-size:.75rem;font-weight:700;color:var(--gold-light);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.footer-link{display:block;font-size:.82rem;color:rgba(255,255,255,.6);margin-bottom:7px;cursor:pointer;transition:color .15s;background:none;border:none;text-align:left;padding:0}
.footer-link:hover{color:#fff}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.08);margin-bottom:16px}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;font-size:.75rem;flex-wrap:wrap;gap:8px}
.footer-bottom-left{color:rgba(255,255,255,.4)}
.footer-bottom-right{display:flex;gap:16px}

/* ── TOAST ── */
.toast{position:fixed;bottom:24px;right:24px;z-index:300;background:var(--navy-dark);color:#fff;padding:12px 20px;border-radius:var(--radius-lg);font-size:.83rem;box-shadow:var(--shadow-lg);display:flex;align-items:center;gap:10px;animation:slideUp .25s ease;max-width:320px;border-left:4px solid var(--gold)}
.toast.success{border-left-color:#4ade80}
.toast.error{border-left-color:#f87171}

/* ── UPLOAD ZONE ── */
.upload-zone{border:2px dashed var(--gray-300);border-radius:var(--radius-lg);padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:var(--gray-50)}
.upload-zone:hover,.upload-zone.drag{border-color:var(--navy);background:#eef2ff}
.upload-zone-icon{font-size:2rem;margin-bottom:10px}
.upload-zone-text{font-size:.87rem;color:var(--text-light)}
.upload-zone-hint{font-size:.75rem;color:var(--gray-400);margin-top:4px}

/* ── DID BOX ── */
.did-box{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:12px 14px;font-family:monospace;font-size:.75rem;color:var(--navy);word-break:break-all;line-height:1.7;margin-top:12px}
.did-label{font-size:.68rem;font-weight:700;color:var(--text-light);letter-spacing:.5px;text-transform:uppercase;margin-bottom:5px;font-family:var(--sans)}

/* ── MISC ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:700px){.two-col{grid-template-columns:1fr}}
.alert{padding:12px 16px;border-radius:var(--radius);font-size:.83rem;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px}
.alert-info{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe}
.alert-success{background:#dcfce7;color:#166534;border:1px solid #86efac}
.alert-warn{background:#fef9c3;color:#854d0e;border:1px solid #fde68a}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px;background:var(--gray-100);color:var(--gray-600);margin:2px}
.loading-row{display:flex;align-items:center;gap:10px;color:var(--text-light);font-size:.87rem;padding:12px 0}
.spinner{width:18px;height:18px;border:2px solid var(--gray-200);border-top-color:var(--navy);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state{text-align:center;padding:48px 24px;color:var(--text-light)}
.empty-state-icon{font-size:3rem;margin-bottom:12px}
.empty-state-text{font-size:.9rem}
.section-tabs{display:flex;border-bottom:2px solid var(--gray-200);margin-bottom:24px;gap:0}
.s-tab{font-size:.83rem;font-weight:600;color:var(--text-light);padding:10px 20px;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;background:none;border-top:none;border-left:none;border-right:none;transition:all .15s}
.s-tab:hover{color:var(--navy)}
.s-tab.active{color:var(--navy);border-bottom-color:var(--navy)}
.page-header{background:linear-gradient(90deg,var(--navy-dark),var(--navy));color:#fff;padding:32px 24px}
.page-header-inner{max-width:1200px;margin:0 auto}
.page-header h2{font-family:var(--serif);font-size:1.6rem;font-weight:900;margin-bottom:4px}
.page-header p{font-size:.87rem;color:rgba(255,255,255,.75)}
.breadcrumb{font-size:.75rem;color:rgba(255,255,255,.5);margin-bottom:12px;display:flex;gap:6px;align-items:center}
.breadcrumb span{color:rgba(255,255,255,.3)}
`;

// ─── Shared Data Store ────────────────────────────────────────────────────────
const useStore = () => {
  const [dids, setDids] = useState([
    { did: genDID("Demo Student"), name: "Rahul Sharma", rollNo: "CSE21001", dept: "CSE ICBT", email: "rahul@soet.mgmu.ac.in", year: "2025", active: true, created: "2024-08-01", hash: genHash() },
    { did: genDID("Demo2"), name: "Priya Patel", rollNo: "CSE21002", dept: "CSE ICBT", email: "priya@soet.mgmu.ac.in", year: "2025", active: true, created: "2024-08-01", hash: genHash() },
  ]);
  const [credentials, setCredentials] = useState([
    { id: "vc:001", type: "Bachelor of Technology", issuedTo: "Rahul Sharma", toDID: dids[0]?.did, rollNo: "CSE21001", dept: "CSE ICBT", cgpa: "8.4", year: "2025", issuer: "MGMU / SoET", status: "valid", ipfs: genIPFS(), hash: genHash(), issued: "2025-06-15", txHash: genHash() },
    { id: "vc:002", type: "Bachelor of Technology", issuedTo: "Priya Patel", toDID: dids[1]?.did, rollNo: "CSE21002", dept: "CSE ICBT", cgpa: "9.1", year: "2025", issuer: "MGMU / SoET", status: "valid", ipfs: genIPFS(), hash: genHash(), issued: "2025-06-15", txHash: genHash() },
  ]);
  const [chain, setChain] = useState([
    { num: 0, hash: genHash(), data: "GENESIS", ts: "2024-01-01" },
    { num: 1, hash: genHash(), data: "DID_REGISTRY_DEPLOY", ts: "2024-08-01" },
    { num: 2, hash: genHash(), data: "VC_ISSUE:BTech:CSE21001", ts: "2025-06-15" },
    { num: 3, hash: genHash(), data: "VC_ISSUE:BTech:CSE21002", ts: "2025-06-15" },
  ]);

  const addBlock = (data) => setChain(p => { const l = p[p.length - 1]; return [...p, { num: l.num + 1, hash: genHash(), data, ts: today() }]; });

  const registerDID = (info) => {
    const d = { ...info, did: genDID(info.name), active: true, created: today(), hash: genHash() };
    setDids(p => [d, ...p]);
    addBlock(`DID_CREATE:${info.rollNo}`);
    return d;
  };

  const issueCred = (data) => {
    const c = { ...data, id: "vc:" + Math.random().toString(36).slice(2), ipfs: genIPFS(), hash: genHash(), issued: today(), txHash: genHash(), status: "valid", issuer: "MGMU / SoET" };
    setCredentials(p => [c, ...p]);
    addBlock(`VC_ISSUE:${data.type}:${data.rollNo}`);
    return c;
  };

  const revokeCred = (id) => { setCredentials(p => p.map(c => c.id === id ? { ...c, status: "revoked" } : c)); addBlock("VC_REVOKE"); };

  return { dids, credentials, chain, registerDID, issueCred, revokeCred };
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [wallet, setWallet] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const store = useStore();

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const connectWallet = async () => {
    if (wallet) { setWallet(null); return; }
    showToast("Connecting to MetaMask…", "info");
    setTimeout(() => {
      const addr = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setWallet(addr);
      showToast("Wallet connected: " + addr.slice(0, 8) + "…" + addr.slice(-4), "success");
    }, 1200);
  };

  const nav = (p) => { setPage(p); setMenuOpen(false); window.scrollTo(0, 0); };

  const navItems = [
    { key: "home", label: "Home" },
    { key: "user", label: "Student Portal" },
    { key: "issuer", label: "Issuer Portal" },
    { key: "verifier", label: "Verify Degree" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <>
      <style>{CSS}</style>

      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <span>🏛️ Mahatma Gandhi Mission University — School of Engineering & Technology, CSE ICBT Dept.</span>
          <span>Helpdesk: <a href="mailto:did@soet.mgmu.ac.in">did@soet.mgmu.ac.in</a></span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="brand" onClick={() => nav("home")}>
            <div className="brand-emblem">
              <svg viewBox="0 0 32 32"><path d="M16 2L4 8v8c0 7 5.4 13.5 12 15.4C22.6 29.5 28 23 28 16V8L16 2zm-1 19l-5-5 1.4-1.4L15 18.2l7.6-7.6L24 12l-9 9z"/></svg>
            </div>
            <div className="brand-text">
              <div className="brand-uni">MGMU — SoET | CSE ICBT</div>
              <div className="brand-dept">Decentralized Identity & Degree Verification</div>
            </div>
          </div>

          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            {navItems.map(n => (
              <button key={n.key} className={`nav-link ${page === n.key ? "active" : ""}`} onClick={() => nav(n.key)}>{n.label}</button>
            ))}
          </div>

          <div className="nav-right">
            <button className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet}>
              {wallet ? <><div className="wallet-dot" />{wallet.slice(0, 6)}…{wallet.slice(-4)}</> : "🦊 Connect Wallet"}
            </button>
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Pages */}
      {page === "home" && <HomePage nav={nav} store={store} />}
      {page === "user" && <UserPage store={store} wallet={wallet} showToast={showToast} nav={nav} />}
      {page === "issuer" && <IssuerPage store={store} wallet={wallet} showToast={showToast} />}
      {page === "verifier" && <VerifierPage store={store} />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage showToast={showToast} />}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand-name">MGMU — Decentralized Identity System</div>
              <div className="footer-brand-sub">School of Engineering & Technology | CSE ICBT</div>
              <div className="footer-brand-desc">A blockchain-powered degree verification platform built on Ethereum (Sepolia) and IPFS. Secure, tamper-proof, and instantly verifiable credentials.</div>
            </div>
            <div>
              <div className="footer-col-title">Navigation</div>
              {navItems.map(n => <button key={n.key} className="footer-link" onClick={() => nav(n.key)}>{n.label}</button>)}
            </div>
            <div>
              <div className="footer-col-title">Technology</div>
              {["Ethereum Sepolia Testnet","IPFS via Pinata","W3C DID Standard","React + Vite","Hardhat + Solidity","Cloudflare Pages"].map(t => <div key={t} className="footer-link" style={{cursor:"default"}}>{t}</div>)}
            </div>
          </div>
          <hr className="footer-divider" />
          <div className="footer-bottom">
            <div className="footer-bottom-left">© 2025 MGMU SoET — CSE ICBT Department. Final Year Project — Blockchain & Web3.</div>
            <div className="footer-bottom-right">
              <span style={{color:"rgba(255,255,255,.4)"}}>Built with Ethereum + IPFS + React</span>
            </div>
          </div>
        </div>
      </footer>

      {toast && <div className={`toast ${toast.type}`}>{toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"} {toast.msg}</div>}
    </>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ nav, store }) {
  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">🔐 Blockchain-Powered Identity</div>
            <h1>Tamper-Proof Degree<br /><span>Verification System</span></h1>
            <p className="hero-sub">MGMU School of Engineering & Technology presents a decentralized identity platform built on Ethereum blockchain. Issue, manage, and verify academic credentials instantly — without any middleman.</p>
            <div className="hero-btns">
              <button className="btn-hero-primary" onClick={() => nav("verifier")}>🔍 Verify a Degree</button>
              <button className="btn-hero-secondary" onClick={() => nav("user")}>Student Portal →</button>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-stat-grid">
              {[["DIDs Registered", store.dids.length], ["Credentials Issued", store.credentials.length], ["Blocks on Chain", store.chain.length], ["Verified Today", store.credentials.filter(c => c.status === "valid").length]].map(([l, v]) => (
                <div key={l} className="hero-stat"><div className="hero-stat-val">{v}</div><div className="hero-stat-label">{l}</div></div>
              ))}
            </div>
            <div className="hero-steps">
              {["Student registers DID on blockchain", "SoET issues degree as Verifiable Credential", "Credential stored on IPFS, hash on Ethereum", "Employer verifies instantly — no middleman"].map((s, i) => (
                <div key={i} className="hero-step"><div className="hero-step-num">{i + 1}</div><span>{s}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Portals */}
      <div className="section section-alt">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">Portals</div>
            <div className="section-title">Choose Your Role</div>
            <div className="divider" />
            <div className="section-sub">Access the portal that matches your role in the MGMU degree verification ecosystem.</div>
          </div>
          <div className="portal-grid">
            {[
              { icon: "🎓", title: "Student Portal", desc: "Register your Decentralized Identifier, view your issued degree credentials, and generate QR codes to share with employers.", tag: "For Students", key: "user" },
              { icon: "🏛️", title: "Issuer Portal", desc: "University administrators issue and manage degree credentials on-chain. Bulk upload via CSV for graduation ceremonies.", tag: "For University Admin", key: "issuer", featured: true },
              { icon: "🔍", title: "Verify a Degree", desc: "Employers and institutions instantly verify any degree by searching a student name, roll number, or credential ID.", tag: "For Employers & Institutions", key: "verifier" },
            ].map(p => (
              <div key={p.key} className={`portal-card ${p.featured ? "featured" : ""}`} onClick={() => nav(p.key)}>
                <div className="portal-card-icon">{p.icon}</div>
                <div className="portal-card-title">{p.title}</div>
                <div className="portal-card-desc">{p.desc}</div>
                <div className="portal-card-tag">{p.tag} →</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">Features</div>
            <div className="section-title">Why Blockchain Credentials?</div>
            <div className="divider" />
          </div>
          <div className="card-grid">
            {[
              { icon: "🔒", title: "Tamper-Proof", desc: "Every credential is cryptographically signed and anchored on Ethereum. Impossible to forge or alter." },
              { icon: "⚡", title: "Instant Verification", desc: "Employers verify degrees in seconds — no phone calls, no emails, no waiting days for confirmation." },
              { icon: "🌐", title: "Decentralized Storage", desc: "Credentials stored on IPFS. No single server can lose or hide your degree certificate." },
              { icon: "🪪", title: "Self-Sovereign Identity", desc: "Students own their credentials. Share only what you choose, with whoever you choose." },
              { icon: "📄", title: "W3C Standard", desc: "Built on the W3C DID and Verifiable Credentials standards — globally interoperable." },
              { icon: "📱", title: "QR Code Sharing", desc: "One QR code lets any employer instantly verify your degree from their phone or laptop." },
            ].map((f, i) => (
              <div key={i} className="card card-accent" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="card-icon"><span>{f.icon}</span></div>
                <div className="card-title">{f.title}</div>
                <div className="card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="section section-alt">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">Process</div>
            <div className="section-title">How It Works</div>
            <div className="divider" />
          </div>
          <div className="steps-grid">
            {[
              { n: "01", title: "Register DID", desc: "Student creates a Decentralized Identifier on Ethereum — your permanent digital identity." },
              { n: "02", title: "University Issues VC", desc: "SoET admin signs and issues a Verifiable Credential (degree) to the student's DID." },
              { n: "03", title: "Stored on IPFS", desc: "Encrypted credential stored on IPFS. Only the hash is recorded on Ethereum blockchain." },
              { n: "04", title: "Student Shares QR", desc: "Student presents a QR code or share link to any employer or institution." },
              { n: "05", title: "Instant Verification", desc: "Verifier checks on-chain in seconds. No calls, no paperwork, no waiting." },
            ].map((s, i) => (
              <div key={i} className="step-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="section" style={{ background: "var(--navy-dark)", color: "#fff", textAlign: "center" }}>
        <div className="section-inner">
          <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: 2, color: "var(--gold-light)", marginBottom: 12, textTransform: "uppercase" }}>Get Started Today</div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, marginBottom: 16 }}>Your Degree. Your Blockchain. Your Control.</h2>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: ".95rem", maxWidth: 520, margin: "0 auto 28px" }}>MGMU SoET students can register their decentralized identity and receive tamper-proof degree credentials backed by Ethereum.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-hero-primary" onClick={() => nav("user")}>Register as Student</button>
            <button className="btn-hero-secondary" onClick={() => nav("verifier")}>Verify a Degree</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── USER / STUDENT PAGE ──────────────────────────────────────────────────────
function UserPage({ store, wallet, showToast }) {
  const [tab, setTab] = useState("register");
  const [form, setForm] = useState({ name: "", rollNo: "", dept: "CSE ICBT", email: "", year: "2025" });
  const [loading, setLoading] = useState(false);
  const [myDID, setMyDID] = useState(store.dids[0] || null);
  const [qrModal, setQrModal] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = () => {
    if (!form.name || !form.rollNo) { showToast("Name and Roll No are required", "error"); return; }
    setLoading(true);
    setTimeout(() => {
      const d = store.registerDID(form);
      setMyDID(d);
      setLoading(false);
      setTab("dashboard");
      showToast("DID registered on Ethereum Sepolia!", "success");
    }, 1800);
  };

  const myCreds = myDID ? store.credentials.filter(c => c.rollNo === myDID.rollNo) : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Student Portal</div>
          <h2>🎓 Student Portal</h2>
          <p>Register your Decentralized Identifier and manage your academic credentials</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          {!wallet && <div className="alert alert-warn">⚠️ Please connect your MetaMask wallet (top-right) to register or view credentials on-chain.</div>}
          <div className="dash-layout" style={{ minHeight: "auto", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--gray-200)", boxShadow: "var(--shadow)" }}>
            <div className="sidebar">
              <div className="sidebar-header">
                <div className="sidebar-title">Student Portal</div>
                <div className="sidebar-sub">{myDID ? myDID.name : "Not registered"}</div>
              </div>
              <div className="sidebar-nav">
                {[["register", "📝", "Register DID"], ["dashboard", "🪪", "My Identity"], ["credentials", "📄", "My Credentials"], ["share", "📤", "Share / QR"]].map(([k, ic, l]) => (
                  <button key={k} className={`sidebar-item ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}><span className="sidebar-item-icon">{ic}</span>{l}</button>
                ))}
              </div>
            </div>
            <div className="dash-content">
              {/* Register */}
              {tab === "register" && (
                <div>
                  <div className="dash-header">
                    <div><div className="dash-title">Register Your DID</div><div className="dash-sub">Create your blockchain identity on Ethereum Sepolia</div></div>
                  </div>
                  <div className="two-col">
                    <div className="form-panel">
                      <div className="form-title">Student Information</div>
                      <div className="form-sub">Your details will be stored as a DID Document on IPFS with a hash on Ethereum.</div>
                      <div className="form-grid">
                        <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" /></div>
                        <div className="form-group"><label>Roll Number *</label><input value={form.rollNo} onChange={e => set("rollNo", e.target.value)} placeholder="e.g. CSE21001" /></div>
                        <div className="form-group"><label>Department</label><select value={form.dept} onChange={e => set("dept", e.target.value)}><option>CSE ICBT</option><option>Computer Science</option><option>Information Technology</option></select></div>
                        <div className="form-group"><label>Passing Year</label><select value={form.year} onChange={e => set("year", e.target.value)}>{["2023","2024","2025","2026"].map(y => <option key={y}>{y}</option>)}</select></div>
                        <div className="form-group full"><label>College Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="rollno@soet.mgmu.ac.in" /></div>
                      </div>
                      {loading ? <div className="loading-row"><div className="spinner" />Registering on Ethereum Sepolia…</div>
                        : <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={handleRegister}>⬡ Register on Blockchain</button>}
                    </div>
                    <div>
                      <div className="info-box">
                        <div className="info-box-title">What happens when you register?</div>
                        <div className="info-box-text">
                          1. Your information is hashed using SHA-256<br />
                          2. A unique DID is created: <code style={{ fontSize: ".75rem" }}>did:ethr:0x…</code><br />
                          3. DID Document stored on IPFS<br />
                          4. Hash anchored on Ethereum Sepolia<br />
                          5. You now own your digital identity
                        </div>
                      </div>
                      <div style={{ marginTop: 16, background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 12, fontSize: ".88rem" }}>Already Registered Students</div>
                        {store.dids.slice(0, 4).map(d => (
                          <div key={d.did} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: ".82rem" }}>
                            <span>{d.name} <span style={{ color: "var(--text-light)" }}>({d.rollNo})</span></span>
                            <span className="badge badge-green">Active</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard */}
              {tab === "dashboard" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">My Identity</div><div className="dash-sub">Your Decentralized Identifier on Ethereum</div></div></div>
                  {!myDID ? <div className="empty-state"><div className="empty-state-icon">🪪</div><div className="empty-state-text">No DID registered yet. Go to Register DID tab.</div></div> : (
                    <>
                      <div className="stat-row">
                        <div className="stat-box"><div className="stat-box-val">{myDID.active ? "Active" : "Revoked"}</div><div className="stat-box-label">Status</div></div>
                        <div className="stat-box gold"><div className="stat-box-val">{myCreds.length}</div><div className="stat-box-label">Credentials</div></div>
                        <div className="stat-box green"><div className="stat-box-val">{myDID.created}</div><div className="stat-box-label">Registered</div></div>
                      </div>
                      <div className="form-panel">
                        <div className="did-label">Decentralized Identifier (DID)</div>
                        <div className="did-box">
                          {myDID.did}<br />
                          <span style={{ color: "var(--text-light)" }}>NAME: {myDID.name} | ROLL: {myDID.rollNo} | DEPT: {myDID.dept}</span><br />
                          <span style={{ color: "var(--text-light)" }}>TX_HASH: {shortHash(myDID.hash)}</span>
                        </div>
                        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard?.writeText(myDID.did); showToast?.("DID copied!", "success"); }}>📋 Copy DID</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setTab("share")}>📤 Share Credential</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 10, fontSize: ".9rem" }}>Switch Identity</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {store.dids.map(d => <button key={d.did} className={`btn btn-sm ${myDID.did === d.did ? "btn-primary" : "btn-outline"}`} onClick={() => setMyDID(d)}>{d.name}</button>)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Credentials */}
              {tab === "credentials" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">My Credentials</div><div className="dash-sub">Verifiable credentials issued to your DID</div></div></div>
                  {myCreds.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-text">No credentials issued yet. Contact SoET admin to issue your degree.</div></div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {myCreds.map(c => <CredCard key={c.id} cred={c} onQR={() => setQrModal(c)} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Share */}
              {tab === "share" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Share Credential</div><div className="dash-sub">Generate QR code for employer verification</div></div></div>
                  {myCreds.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📤</div><div className="empty-state-text">No credentials to share yet.</div></div> : (
                    <div className="two-col">
                      <div>
                        {myCreds.filter(c => c.status === "valid").map(c => (
                          <div key={c.id} style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>{c.type}</div>
                            <div style={{ fontSize: ".82rem", color: "var(--text-light)", marginBottom: 12 }}>Issued by {c.issuer} · {c.issued}</div>
                            <button className="btn btn-primary btn-sm" onClick={() => setQrModal(c)}>📱 Generate QR Code</button>
                          </div>
                        ))}
                      </div>
                      <div className="info-box">
                        <div className="info-box-title">How Sharing Works</div>
                        <div className="info-box-text">
                          Share the QR code with any employer or institution. When they scan it, they are directed to the Verifier Portal which checks the credential on the Ethereum blockchain — no personal data exposed, just a cryptographic proof.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal modal-wrap" onClick={e => e.stopPropagation()}>
            <div className="modal-title">QR Code — Degree Credential</div>
            <div className="modal-sub">{qrModal.type} · {qrModal.issuedTo} · {qrModal.issuer}</div>
            <div className="qr-wrap">
              <QRCanvas value={qrModal.id + qrModal.hash} size={160} />
              <div className="qr-label">Scan to Verify on Blockchain</div>
              <div className="qr-value">did-verify://cred/{qrModal.id}?hash={shortHash(qrModal.hash)}&ipfs={qrModal.ipfs.slice(0, 16)}</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ISSUER PAGE ──────────────────────────────────────────────────────────────
function IssuerPage({ store, wallet, showToast }) {
  const [tab, setTab] = useState("issue");
  const [form, setForm] = useState({ name: "", rollNo: "", dept: "CSE ICBT", cgpa: "", year: "2025", type: "Bachelor of Technology" });
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleIssue = () => {
    if (!form.name || !form.rollNo) { showToast("Name and Roll No required", "error"); return; }
    setLoading(true);
    setTimeout(() => { store.issueCred(form); setLoading(false); setTab("manage"); showToast("Credential issued and anchored on Ethereum!", "success"); }, 2000);
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(l => l.trim()).slice(1);
      setTimeout(() => {
        let count = 0;
        lines.forEach(line => {
          const [name, rollNo, dept, cgpa, year] = line.split(",").map(s => s.trim());
          if (name && rollNo) { store.issueCred({ name, rollNo, dept: dept || "CSE ICBT", cgpa: cgpa || "N/A", year: year || "2025", type: "Bachelor of Technology" }); count++; }
        });
        setCsvResult(count);
        setCsvLoading(false);
        showToast(`Bulk issued ${count} credentials on-chain!`, "success");
      }, 2500);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Issuer Portal</div>
          <h2>🏛️ Issuer Portal</h2>
          <p>MGMU SoET Administration — Issue and manage degree credentials on Ethereum blockchain</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          {!wallet && <div className="alert alert-warn">⚠️ Connect MetaMask wallet to issue credentials. Only authorized university admin can issue on behalf of SoET.</div>}
          <div className="dash-layout" style={{ minHeight: "auto", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--gray-200)", boxShadow: "var(--shadow)" }}>
            <div className="sidebar">
              <div className="sidebar-header"><div className="sidebar-title">Admin Panel</div><div className="sidebar-sub">SoET — CSE ICBT</div></div>
              <div className="sidebar-nav">
                {[["issue", "📝", "Issue Credential"], ["bulk", "📦", "Bulk Upload CSV"], ["manage", "📋", "Manage Issued"], ["dids", "🪪", "Registered DIDs"]].map(([k, ic, l]) => (
                  <button key={k} className={`sidebar-item ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}><span className="sidebar-item-icon">{ic}</span>{l}</button>
                ))}
              </div>
            </div>
            <div className="dash-content">
              {tab === "issue" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Issue Degree Credential</div><div className="dash-sub">Sign and anchor a Verifiable Credential on Ethereum</div></div></div>
                  <div className="two-col">
                    <div className="form-panel">
                      <div className="form-title">Degree Information</div>
                      <div className="form-sub">All fields will be signed with the university's private key and stored on IPFS.</div>
                      <div className="form-grid">
                        <div className="form-group"><label>Credential Type</label>
                          <select value={form.type} onChange={e => set("type", e.target.value)}>
                            <option>Bachelor of Technology</option><option>Master of Technology</option><option>PhD</option><option>Diploma</option><option>Certificate Course</option>
                          </select></div>
                        <div className="form-group"><label>Department</label>
                          <select value={form.dept} onChange={e => set("dept", e.target.value)}>
                            <option>CSE ICBT</option><option>Computer Science</option><option>Information Technology</option><option>Electronics</option><option>Mechanical</option><option>Civil</option>
                          </select></div>
                        <div className="form-group"><label>Student Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name as on record" /></div>
                        <div className="form-group"><label>Roll Number *</label><input value={form.rollNo} onChange={e => set("rollNo", e.target.value)} placeholder="e.g. CSE21001" /></div>
                        <div className="form-group"><label>CGPA</label><input value={form.cgpa} onChange={e => set("cgpa", e.target.value)} placeholder="e.g. 8.5" /></div>
                        <div className="form-group"><label>Year of Passing</label><select value={form.year} onChange={e => set("year", e.target.value)}>{["2022","2023","2024","2025","2026"].map(y => <option key={y}>{y}</option>)}</select></div>
                      </div>
                      {loading ? <div className="loading-row"><div className="spinner" />Signing & anchoring on Ethereum…</div>
                        : <button className="btn btn-gold btn-full" style={{ marginTop: 8 }} onClick={handleIssue}>⬡ Sign & Issue on Blockchain</button>}
                    </div>
                    <div>
                      <div className="info-box">
                        <div className="info-box-title">Credential Issuance Flow</div>
                        <div className="info-box-text">
                          1. Credential data signed with SoET private key<br />
                          2. JSON-LD Verifiable Credential created<br />
                          3. Encrypted and uploaded to IPFS via Pinata<br />
                          4. IPFS hash + metadata stored on Ethereum<br />
                          5. Smart contract emits CredentialIssued event<br />
                          6. Student can now present and share credential
                        </div>
                      </div>
                      <div style={{ marginTop: 16, background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 8, fontSize: ".88rem" }}>Quick Stats</div>
                        <div className="stat-row" style={{ marginBottom: 0 }}>
                          <div className="stat-box"><div className="stat-box-val">{store.credentials.length}</div><div className="stat-box-label">Total Issued</div></div>
                          <div className="stat-box green"><div className="stat-box-val">{store.credentials.filter(c => c.status === "valid").length}</div><div className="stat-box-label">Valid</div></div>
                          <div className="stat-box red"><div className="stat-box-val">{store.credentials.filter(c => c.status === "revoked").length}</div><div className="stat-box-label">Revoked</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "bulk" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Bulk Upload via CSV</div><div className="dash-sub">Issue credentials to all graduating students at once</div></div></div>
                  <div className="two-col">
                    <div className="form-panel">
                      <div className="form-title">Upload Graduation CSV</div>
                      <div className="form-sub">Upload a CSV file with student records. Credentials will be issued to all valid entries.</div>
                      <div className="upload-zone" onClick={() => document.getElementById("csv-input").click()}>
                        <div className="upload-zone-icon">📂</div>
                        <div className="upload-zone-text">Click to upload CSV file</div>
                        <div className="upload-zone-hint">Format: Name, Roll No, Dept, CGPA, Year</div>
                        <input id="csv-input" type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
                      </div>
                      {csvLoading && <div className="loading-row" style={{ marginTop: 12 }}><div className="spinner" />Processing CSV and issuing credentials on-chain…</div>}
                      {csvResult !== null && !csvLoading && (
                        <div className="alert alert-success" style={{ marginTop: 12 }}>✅ Successfully issued <strong>{csvResult} credentials</strong> on the Ethereum blockchain.</div>
                      )}
                    </div>
                    <div>
                      <div className="info-box">
                        <div className="info-box-title">CSV Format Guide</div>
                        <div className="info-box-text">
                          <strong>Required columns (first row = headers):</strong><br /><br />
                          <code style={{ fontSize: ".75rem", background: "var(--white)", padding: "8px 12px", borderRadius: "var(--radius)", display: "block", border: "1px solid var(--gray-200)", marginTop: 8 }}>
                            Name,RollNo,Dept,CGPA,Year<br />
                            Rahul Sharma,CSE21001,CSE ICBT,8.4,2025<br />
                            Priya Patel,CSE21002,CSE ICBT,9.1,2025
                          </code>
                          <br />Each row creates one Verifiable Credential anchored on Ethereum.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "manage" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Issued Credentials</div><div className="dash-sub">{store.credentials.length} total credentials on-chain</div></div></div>
                  <div className="table-wrap">
                    <div className="table-head"><div className="table-title">All Issued Credentials</div></div>
                    <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr><th>Student</th><th>Roll No</th><th>Type</th><th>Dept</th><th>CGPA</th><th>Year</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          {store.credentials.map(c => (
                            <tr key={c.id}>
                              <td style={{ fontWeight: 600 }}>{c.issuedTo}</td>
                              <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{c.rollNo}</span></td>
                              <td>{c.type}</td>
                              <td>{c.dept}</td>
                              <td>{c.cgpa}</td>
                              <td>{c.year}</td>
                              <td>{c.issued}</td>
                              <td><span className={`badge ${c.status === "valid" ? "badge-green" : "badge-red"}`}>{c.status}</span></td>
                              <td>{c.status === "valid" && <button className="btn btn-danger btn-sm" onClick={() => { store.revokeCred(c.id); showToast("Credential revoked on-chain", "info"); }}>Revoke</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {tab === "dids" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Registered Student DIDs</div><div className="dash-sub">{store.dids.length} students on Ethereum</div></div></div>
                  <div className="table-wrap">
                    <div className="table-head"><div className="table-title">DID Registry</div></div>
                    <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr><th>Name</th><th>Roll No</th><th>Dept</th><th>DID (short)</th><th>Registered</th><th>Status</th></tr></thead>
                        <tbody>
                          {store.dids.map(d => (
                            <tr key={d.did}>
                              <td style={{ fontWeight: 600 }}>{d.name}</td>
                              <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{d.rollNo}</span></td>
                              <td>{d.dept}</td>
                              <td><span style={{ fontFamily: "monospace", fontSize: ".73rem", color: "var(--navy)" }}>{shortHash(d.did)}</span></td>
                              <td>{d.created}</td>
                              <td><span className={`badge ${d.active ? "badge-green" : "badge-red"}`}>{d.active ? "Active" : "Revoked"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── VERIFIER PAGE ────────────────────────────────────────────────────────────
function VerifierPage({ store }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("name");

  const verify = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      let found = null;
      if (tab === "name") found = store.credentials.find(c => c.issuedTo.toLowerCase().includes(query.toLowerCase()) || c.rollNo.toLowerCase() === query.toLowerCase());
      else if (tab === "did") found = store.credentials.find(c => c.toDID?.includes(query) || c.id === query);
      else found = store.credentials.find(c => c.hash.startsWith(query) || c.ipfs.startsWith(query) || c.id === query);
      setResult(found ? { ok: found.status === "valid", cred: found } : { ok: false, cred: null });
      setLoading(false);
    }, 1800);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Verify Degree</div>
          <h2>🔍 Degree Verification</h2>
          <p>Instantly verify any MGMU SoET degree credential on the Ethereum blockchain</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="verify-box">
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔐</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>On-Chain Degree Verification</div>
                <div style={{ fontSize: ".83rem", color: "var(--text-light)" }}>Powered by Ethereum Sepolia + IPFS · W3C DID Standard · MGMU SoET</div>
              </div>

              <div className="section-tabs">
                {[["name", "👤 By Name / Roll No"], ["did", "🔗 By DID"], ["hash", "🔑 By Credential ID"]].map(([k, l]) => (
                  <button key={k} className={`s-tab ${tab === k ? "active" : ""}`} onClick={() => { setTab(k); setResult(null); setQuery(""); }}>{l}</button>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>{tab === "name" ? "Student Name or Roll Number" : tab === "did" ? "Decentralized Identifier (DID)" : "Credential ID / IPFS Hash"}</label>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && verify()}
                  placeholder={tab === "name" ? "e.g. Rahul Sharma or CSE21001" : tab === "did" ? "did:ethr:0x…" : "vc:abc123… or Qm…"} />
              </div>

              {tab === "name" && store.dids.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Quick Select</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {store.dids.slice(0, 5).map(d => <button key={d.did} className="btn btn-outline btn-sm" onClick={() => setQuery(d.rollNo)}>{d.name} ({d.rollNo})</button>)}
                  </div>
                </div>
              )}

              {loading ? <div className="loading-row"><div className="spinner" />Querying Ethereum Sepolia…</div>
                : <button className="btn btn-primary btn-full" onClick={verify}>⬡ Verify on Blockchain</button>}

              {result && (
                <div className={`verify-result ${result.ok ? "success" : "fail"}`}>
                  <div className="verify-result-icon">{result.ok ? "✅" : "❌"}</div>
                  <div className="verify-result-title" style={{ color: result.ok ? "#166534" : "#991b1b" }}>
                    {result.ok ? "Degree Verified — Authentic & Valid" : result.cred ? "Degree REVOKED by University" : "Credential Not Found on Blockchain"}
                  </div>
                  {result.cred && (
                    <>
                      <div className="verify-detail-grid">
                        {[["Student", result.cred.issuedTo], ["Roll No", result.cred.rollNo], ["Degree", result.cred.type], ["Department", result.cred.dept], ["CGPA", result.cred.cgpa], ["Year", result.cred.year], ["Issued By", result.cred.issuer], ["Issue Date", result.cred.issued], ["Status", result.cred.status.toUpperCase()], ["IPFS", result.cred.ipfs.slice(0, 20) + "…"]].map(([k, v]) => (
                          <div key={k} className="verify-field"><div className="verify-field-key">{k}</div><div className="verify-field-val">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, fontFamily: "monospace", fontSize: ".72rem", color: "var(--text-light)", wordBreak: "break-all", background: "var(--white)", padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)" }}>
                        TX_HASH: {shortHash(result.cred.txHash)} · IPFS: {result.cred.ipfs.slice(0, 30)}…
                      </div>
                    </>
                  )}
                  {!result.cred && <div style={{ fontSize: ".85rem", color: "#991b1b", marginTop: 8 }}>No credential matching "{query}" was found in the MGMU SoET blockchain registry.</div>}
                </div>
              )}
            </div>

            <div style={{ marginTop: 32 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Recently Verified</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Roll No</th><th>Degree</th><th>Year</th><th>Status</th></tr></thead>
                  <tbody>
                    {store.credentials.slice(0, 6).map(c => (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => { setQuery(c.rollNo); setTab("name"); }}>
                        <td style={{ fontWeight: 600 }}>{c.issuedTo}</td>
                        <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{c.rollNo}</span></td>
                        <td>{c.type}</td>
                        <td>{c.year}</td>
                        <td><span className={`badge ${c.status === "valid" ? "badge-green" : "badge-red"}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> About</div>
          <h2>About This Project</h2>
          <p>Decentralized Identity & Degree Verification — MGMU SoET CSE ICBT Final Year Project</p>
        </div>
      </div>
      <div className="section section-alt">
        <div className="section-inner">
          <div className="two-col" style={{ alignItems: "start" }}>
            <div>
              <div className="section-label">The Project</div>
              <div className="section-title">Blockchain-Powered Academic Identity</div>
              <div className="divider" />
              <p style={{ fontSize: ".92rem", color: "var(--text-light)", lineHeight: 1.8, marginBottom: 16 }}>
                This project is a final year B.Tech Computer Science (CSE ICBT) project developed at the School of Engineering and Technology, Mahatma Gandhi Mission University. It addresses the critical problem of degree certificate fraud by implementing a decentralized, blockchain-based credential verification system.
              </p>
              <p style={{ fontSize: ".92rem", color: "var(--text-light)", lineHeight: 1.8, marginBottom: 16 }}>
                Built on Ethereum (Sepolia Testnet), IPFS, and the W3C Decentralized Identifiers standard, the platform allows universities to issue tamper-proof digital degree credentials that any employer can verify instantly — without contacting the university.
              </p>
              <div className="info-box">
                <div className="info-box-title">Technology Stack</div>
                <div className="info-box-text">
                  <strong>Blockchain:</strong> Ethereum Sepolia Testnet · Solidity · Hardhat<br />
                  <strong>Storage:</strong> IPFS via Pinata<br />
                  <strong>Frontend:</strong> React + Vite<br />
                  <strong>Wallet:</strong> MetaMask / ethers.js<br />
                  <strong>Standard:</strong> W3C DID Core v1.0 · Verifiable Credentials v1.0<br />
                  <strong>Deployment:</strong> Cloudflare Pages + GitHub
                </div>
              </div>
            </div>
            <div>
              <div className="section-label">Institution</div>
              <div className="section-title">MGMU — SoET</div>
              <div className="divider" />
              <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 20 }}>
                {[["University", "Mahatma Gandhi Mission University (MGMU)"], ["College", "School of Engineering & Technology (SoET)"], ["Department", "Computer Science — CSE ICBT"], ["Program", "Bachelor of Technology (B.Tech)"], ["Academic Year", "2021–2025"], ["Project Type", "Final Year Major Project"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--gray-100)", fontSize: ".85rem", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontWeight: 600, color: "var(--navy)" }}>{k}</span>
                    <span style={{ color: "var(--text-light)" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>Project Objectives</div>
                {["Eliminate degree certificate fraud using blockchain", "Give students ownership over their credentials", "Enable instant employer verification (< 3 seconds)", "Implement W3C DID & VC international standards", "Deploy on live infrastructure for real-world use"].map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: ".85rem", color: "var(--text-light)", alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--navy)", color: "#fff", fontSize: ".65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    {o}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">Team</div>
            <div className="section-title">Project Team — CSE ICBT</div>
            <div className="divider" />
          </div>
          <div className="team-grid">
            {[
              { name: "Member 1", role: "Frontend Developer", icon: "F" },
              { name: "Member 2", role: "Blockchain Developer", icon: "B" },
              { name: "Member 3", role: "Backend & IPFS Integration", icon: "I" },
              { name: "Member 4", role: "Project Lead & Deployment", icon: "P" },
            ].map((m, i) => (
              <div key={i} className="team-card">
                <div className="team-avatar">{m.icon}</div>
                <div className="team-name">[{m.name}]</div>
                <div className="team-role">{m.role}</div>
                <div className="team-dept">SoET — CSE ICBT · 2025</div>
              </div>
            ))}
          </div>
          <div className="info-box" style={{ marginTop: 24 }}>
            <div className="info-box-title">Project Guide</div>
            <div className="info-box-text">[Guide Name] · Department of Computer Science · School of Engineering & Technology · MGMU</div>
          </div>
        </div>
      </div>

      <div className="section section-alt">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">References</div>
            <div className="section-title">Technical Standards & References</div>
            <div className="divider" />
          </div>
          <div className="card-grid">
            {[
              { icon: "📘", title: "W3C DID Core v1.0", desc: "Sporny et al. (2022) — Decentralized Identifiers specification. World Wide Web Consortium Recommendation." },
              { icon: "📗", title: "Verifiable Credentials v1.0", desc: "Sporny, Longley, Chadwick (2019) — W3C Recommendation for credential data model." },
              { icon: "📙", title: "did:ethr Method", desc: "Reed et al. (2020) — Ethereum-based DID method specification using ERC1056 smart contract." },
              { icon: "📕", title: "IPFS Whitepaper", desc: "Benet (2014) — InterPlanetary File System: content-addressed, versioned, peer-to-peer file system." },
            ].map((r, i) => (
              <div key={i} className="card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="card-icon"><span>{r.icon}</span></div>
                <div className="card-title">{r.title}</div>
                <div className="card-desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage({ showToast }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Student", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSend = () => {
    if (!form.name || !form.email || !form.message) { showToast("Please fill all required fields", "error"); return; }
    setSent(true);
    showToast("Message sent to SoET DID team!", "success");
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Contact</div>
          <h2>Contact Us</h2>
          <p>Get in touch with the MGMU SoET DID project team</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="contact-grid">
            <div>
              <div className="section-label">Get In Touch</div>
              <div className="section-title">Contact SoET DID Team</div>
              <div className="divider" />
              <p style={{ fontSize: ".88rem", color: "var(--text-light)", lineHeight: 1.7, marginBottom: 28 }}>
                For degree verification support, credential issuance requests, or technical queries about the DID platform, contact the CSE ICBT department.
              </p>
              {[
                { icon: "🏛️", label: "Institution", val: "Mahatma Gandhi Mission University\nSchool of Engineering & Technology" },
                { icon: "📚", label: "Department", val: "Computer Science — CSE ICBT\nFinal Year Project Team" },
                { icon: "📧", label: "Email", val: "did@soet.mgmu.ac.in" },
                { icon: "📍", label: "Address", val: "MGMU Campus\nAurangabad, Maharashtra, India" },
              ].map((c, i) => (
                <div key={i} className="contact-info-item">
                  <div className="contact-info-icon"><span>{c.icon}</span></div>
                  <div><div className="contact-info-label">{c.label}</div><div className="contact-info-val" style={{ whiteSpace: "pre-line" }}>{c.val}</div></div>
                </div>
              ))}
            </div>

            <div className="form-panel">
              {sent ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Message Sent!</div>
                  <div style={{ fontSize: ".85rem", color: "var(--text-light)" }}>The SoET DID team will respond to {form.email} within 2–3 working days.</div>
                  <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => { setSent(false); setForm({ name: "", email: "", role: "Student", message: "" }); }}>Send Another</button>
                </div>
              ) : (
                <>
                  <div className="form-title">Send a Message</div>
                  <div className="form-sub">For verification support, credential queries, or project feedback.</div>
                  <div className="form-grid">
                    <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your full name" /></div>
                    <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
                    <div className="form-group full"><label>Your Role</label>
                      <select value={form.role} onChange={e => set("role", e.target.value)}>
                        <option>Student</option><option>Employer / Recruiter</option><option>University Admin</option><option>Researcher</option><option>Other</option>
                      </select></div>
                    <div className="form-group full"><label>Message *</label><textarea value={form.message} onChange={e => set("message", e.target.value)} placeholder="Describe your query…" rows={4} /></div>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleSend}>📨 Send Message</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── CRED CARD ────────────────────────────────────────────────────────────────
function CredCard({ cred, onQR }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderLeft: "4px solid var(--navy)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--serif)", fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>{cred.type}</span>
          <span className={`badge ${cred.status === "valid" ? "badge-green" : "badge-red"}`}>{cred.status}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "6px 20px", marginBottom: 10 }}>
          {[["Issued To", cred.issuedTo], ["Roll No", cred.rollNo], ["Department", cred.dept], ["CGPA", cred.cgpa], ["Year", cred.year], ["Issued By", cred.issuer], ["Issue Date", cred.issued]].map(([k, v]) => (
            <div key={k}><div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: ".4px" }}>{k}</div><div style={{ fontSize: ".83rem", color: "var(--text)", fontWeight: 500 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: ".7rem", color: "var(--text-light)" }}>IPFS: {cred.ipfs.slice(0, 28)}… · TX: {shortHash(cred.txHash)}</div>
      </div>
      {onQR && cred.status === "valid" && (
        <button className="btn btn-outline btn-sm" style={{ flexShrink: 0 }} onClick={onQR}>📱 QR Code</button>
      )}
    </div>
  );
}
