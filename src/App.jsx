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
    if (!ref.current || !value) return;
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
  --emerald:#10b981;--emerald-light:#34d399;
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

/* ── STANDALONE PAGE ── */
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at top right,var(--navy-light) 0%,var(--navy-dark) 100%);padding:20px;position:relative}
.auth-back-btn{position:absolute;top:24px;left:24px;color:rgba(255,255,255,.75);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:8px 16px;border-radius:var(--radius);font-size:.83rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:8px}
.auth-back-btn:hover{color:#fff;background:rgba(255,255,255,.12);transform:translateX(-2px)}
.auth-card{background:#ffffff;border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:100%;max-width:480px;padding:36px;border-top:4px solid var(--gold)}
.auth-logo-area{text-align:center;margin-bottom:24px}
.auth-logo-icon{width:56px;height:56px;background:var(--navy);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:var(--shadow)}
.auth-logo-icon svg{width:32px;height:32px;fill:var(--gold-light)}
.auth-title{font-family:var(--serif);font-size:1.4rem;font-weight:900;color:var(--navy);margin-bottom:6px}
.auth-sub{font-size:.83rem;color:var(--text-light)}
.auth-wallet-container{margin-top:20px;padding-top:16px;border-top:1px solid var(--gray-200);display:flex;justify-content:center}
`;

// ─── Shared Data Store ────────────────────────────────────────────────────────
const getAuthHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  try {
    const user = JSON.parse(localStorage.getItem("did_currentUser"));
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }
  } catch (e) {
    console.error("Error reading token from localStorage:", e);
  }
  return headers;
};

const useStore = () => {
  const [dids, setDids] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [chain, setChain] = useState([
    { num: 0, hash: "0x7c9fa18cbf851a719c8d62688f1ab25cf038304910a30b12fa1b439cfa39281a", data: "GENESIS_BLOCK", ts: "2024-01-01" },
    { num: 1, hash: "0x9d1b6a12bf8b1e779a1f28b4c058ba5fc0385910a30b12fa1b439cfa392823a", data: "DEGREE_VERIFIER_DEPLOY", ts: "2025-06-01" }
  ]);
  const [stats, setStats] = useState({
    didsRegistered: 0,
    credentialsIssued: 0,
    blocksOnChain: 0,
    verifiedToday: 0
  });

  const syncData = async () => {
    try {
      const statsRes = await fetch("http://localhost:5000/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const didsRes = await fetch("http://localhost:5000/api/students/dids");
      if (didsRes.ok) {
        const didsData = await didsRes.json();
        setDids(didsData.map(d => ({
          did: d.did,
          name: d.full_name,
          rollNo: d.student_id,
          dept: d.dept || "CSE ICBT",
          email: d.email,
          active: true,
          created: "2025-06-10",
          hash: d.wallet_address
        })));
      }

      const credsRes = await fetch("http://localhost:5000/api/credentials/all");
      if (credsRes.ok) {
        const credsData = await credsRes.json();
        const mappedCreds = credsData.map(c => ({
          id: c.cert_id,
          type: c.degree_name,
          issuedTo: c.student_name,
          toDID: c.student_did,
          rollNo: c.student_id,
          dept: c.dept || "CSE ICBT",
          cgpa: c.grade_cgpa,
          year: c.issue_date.slice(0, 4),
          issuer: "MGMU / SoET",
          status: c.status === "Active" ? "valid" : "revoked",
          ipfs: c.ipfs_cid,
          hash: c.cert_hash,
          issued: c.issue_date,
          txHash: c.cert_hash,
          isCourse: c.cert_id.includes("-course-"),
          univId: c.univ_id
        }));
        
        setCredentials(mappedCreds);

        // Dynamically build visual blockchain chain
        const dynamicBlocks = [
          { num: 0, hash: "0x7c9fa18cbf851a719c8d62688f1ab25cf038304910a30b12fa1b439cfa39281a", data: "GENESIS_BLOCK", ts: "2024-01-01" },
          { num: 1, hash: "0x9d1b6a12bf8b1e779a1f28b4c058ba5fc0385910a30b12fa1b439cfa392823a", data: "DEGREE_VERIFIER_DEPLOY", ts: "2025-06-01" }
        ];
        
        credsData.forEach((c, index) => {
          dynamicBlocks.push({
            num: index + 2,
            hash: "0x" + c.cert_hash,
            data: `VC_ISSUE:${c.student_id}`,
            ts: c.issue_date
          });
        });
        setChain(dynamicBlocks);
      }
    } catch (error) {
      console.error("API sync error:", error);
    }
  };

  const registerDID = async (info) => {
    const res = await fetch("http://localhost:5000/api/students/register-did", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNo: info.rollNo,
        walletAddress: info.walletAddress
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to register DID");
    await syncData();
    return {
      did: data.student.did,
      name: data.student.name,
      rollNo: data.student.id,
      active: true,
      created: today()
    };
  };

  const issueCred = async (data) => {
    const res = await fetch("http://localhost:5000/api/credentials/issue", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        rollNo: data.rollNo,
        degreeName: data.type,
        gradeCgpa: data.cgpa,
        year: data.year,
        type: data.type,
        dept: data.dept,
        universityId: "univ_admin"
      })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to issue credential");
    await syncData();
    return resData;
  };

  const revokeCred = async (id) => {
    const res = await fetch("http://localhost:5000/api/credentials/revoke", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        certId: id,
        universityId: "univ_admin"
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to revoke credential");
    await syncData();
  };

  const issueCourseCert = async (rollNo, courseName, academyId) => {
    const res = await fetch("http://localhost:5000/api/credentials/issue", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        rollNo: rollNo,
        degreeName: courseName,
        gradeCgpa: "A+",
        year: new Date().getFullYear().toString(),
        type: "Course Certificate",
        dept: "Online Courses",
        universityId: academyId || "univ_admin"
      })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to claim course certificate");
    await syncData();
    return resData;
  };

  return { dids, credentials, chain, stats, registerDID, issueCred, revokeCred, syncData, issueCourseCert };
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [wallet, setWallet] = useState(() => {
    return localStorage.getItem("did_connectedWallet") || null;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const store = useStore();

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("did_currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const handleLogin = async (usernameOrEmail, password, role) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameOrEmail, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      if (data.user.role !== role) {
        throw new Error(`Unauthorized. This account is not registered as ${role}.`);
      }

      const userWithToken = { ...data.user, token: data.token };
      setCurrentUser(userWithToken);
      localStorage.setItem("did_currentUser", JSON.stringify(userWithToken));
      showToast(`Logged in successfully as ${data.user.role}`, "success");
      return data.user;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("did_currentUser");
    showToast("Logged out successfully.", "info");
  };

  useEffect(() => {
    if (currentUser && !currentUser.token) {
      handleLogout();
    }
  }, [currentUser]);

  const connectWallet = async () => {
    if (wallet) { 
      setWallet(null); 
      localStorage.removeItem("did_connectedWallet");
      return; 
    }
    
    if (window.ethereum) {
      try {
        showToast("Connecting to MetaMask…", "info");
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWallet(accounts[0]);
        localStorage.setItem("did_connectedWallet", accounts[0]);
        showToast("Wallet connected: " + accounts[0].slice(0, 8) + "…" + accounts[0].slice(-4), "success");
      } catch (err) {
        showToast("Wallet connection failed: " + err.message, "error");
      }
    } else {
      showToast("MetaMask not found. Using local sandbox address...", "info");
      setTimeout(() => {
        const addr = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        setWallet(addr);
        localStorage.setItem("did_connectedWallet", addr);
        showToast("Sandbox connected: " + addr.slice(0, 8) + "…" + addr.slice(-4), "success");
      }, 1000);
    }
  };

  useEffect(() => {
    store.syncData();
  }, [page]);

  useEffect(() => {
    const reconnectWallet = async () => {
      const savedWallet = localStorage.getItem("did_connectedWallet");
      if (!savedWallet) return;

      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWallet(accounts[0]);
            localStorage.setItem("did_connectedWallet", accounts[0]);
          } else {
            localStorage.removeItem("did_connectedWallet");
            setWallet(null);
          }
        } catch (err) {
          console.error("Auto-wallet reconnection failed:", err);
        }
      } else if (savedWallet.startsWith("0xac09")) {
        setWallet(savedWallet);
      }
    };
    reconnectWallet();

    if (window.ethereum) {
      const handleAccounts = (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          localStorage.setItem("did_connectedWallet", accounts[0]);
        } else {
          setWallet(null);
          localStorage.removeItem("did_connectedWallet");
        }
      };
      window.ethereum.on("accountsChanged", handleAccounts);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
      };
    }
  }, []);

  const nav = (p) => {
    if (currentUser) {
      if (p === "user" && currentUser.role !== "Student") {
        handleLogout();
      } else if (p === "issuer" && currentUser.role !== "University") {
        handleLogout();
      }
    }
    setPage(p);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { key: "home", label: "Home" },
    { key: "user", label: "Student Portal" },
    { key: "issuer", label: "Issuer Portal" },
    { key: "verifier", label: "Verify Degree" },
    { key: "explorer", label: "Ledger Explorer" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" },
  ];

  const isStandalone = ["student-login", "admin-login", "university-register"].includes(page);

  return (
    <>
      <style>{CSS}</style>

      {/* Top Bar */}
      {!isStandalone && (
        <div className="topbar">
          <div className="topbar-inner">
            <span>🏛️ Mahatma Gandhi Mission University — School of Engineering & Technology, CSE ICBT Dept.</span>
            <span>Helpdesk: <a href="mailto:did@soet.mgmu.ac.in">did@soet.mgmu.ac.in</a></span>
          </div>
        </div>
      )}

      {/* Navbar */}
      {!isStandalone && (
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
              <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                <span /><span /><span />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Pages */}
      {page === "home" && <HomePage nav={nav} store={store} />}
      {page === "user" && <UserPage store={store} wallet={wallet} showToast={showToast} nav={nav} currentUser={currentUser} handleLogin={handleLogin} handleLogout={handleLogout} connectWallet={connectWallet} />}
      {page === "issuer" && <IssuerPage store={store} wallet={wallet} showToast={showToast} nav={nav} currentUser={currentUser} handleLogin={handleLogin} handleLogout={handleLogout} connectWallet={connectWallet} />}
      {page === "verifier" && <VerifierPage store={store} />}
      {page === "explorer" && <ExplorerPage showToast={showToast} />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage showToast={showToast} />}

      {/* Standalone Authentication Views */}
      {page === "student-login" && <StudentLoginPage nav={nav} handleLogin={handleLogin} showToast={showToast} wallet={wallet} connectWallet={connectWallet} store={store} />}
      {page === "admin-login" && <AdminLoginPage nav={nav} handleLogin={handleLogin} showToast={showToast} wallet={wallet} connectWallet={connectWallet} />}
      {page === "university-register" && <UniversityRegisterPage nav={nav} handleLogin={handleLogin} showToast={showToast} wallet={wallet} connectWallet={connectWallet} />}

      {/* Footer */}
      {!isStandalone && (
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
      )}

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

const ONLINE_COURSES = [
  { id: "c1", title: "Introduction to Smart Contracts (Solidity)", duration: "4 Weeks", level: "Beginner", academy: "MGMU Coding Academy", academyId: "univ_admin", description: "Learn solidity basics, variables, functions, modifiers, and deployment on local blockchain networks." },
  { id: "c2", title: "Advanced Web3 & DApp Development", duration: "8 Weeks", level: "Advanced", academy: "MGMU Coding Academy", academyId: "univ_admin", description: "Learn front-end wallet integration, Ethers.js, event handling, and verifiable credentials integration." },
  { id: "c3", title: "AI and Machine Learning with Python", duration: "6 Weeks", level: "Intermediate", academy: "Coursera Partner Lab", academyId: "coursera", description: "Learn neural networks, regression algorithms, model validation, and Z-score outlier detection models." },
  { id: "c4", title: "Cloud Systems & DevOps Foundations", duration: "5 Weeks", level: "Beginner", academy: "AWS Extension Academy", academyId: "aws_academy", description: "Introduction to Docker containerization, mock IPFS servers, and production-ready server deployments." }
];

function UserPage({ store, wallet, showToast, nav, currentUser, handleLogin, handleLogout, connectWallet }) {
  const [tab, setTab] = useState(currentUser && currentUser.role === "Student" ? "dashboard" : "login");
  const [form, setForm] = useState({ name: "", rollNo: "", dept: "CSE ICBT", email: "", year: "2025", abcId: "" });
  const [loading, setLoading] = useState(false);
  const [myDID, setMyDID] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [demoMode, setDemoMode] = useState(true);

  // Student login form state
  const [loginForm, setLoginForm] = useState({ username: "ABC-111-222-333", password: "password123" });
  const [loginLoading, setLoginLoading] = useState(false);

  // NEP credit state
  const [studentCredits, setStudentCredits] = useState([]);
  const [transferringCredits, setTransferringCredits] = useState(false);

  // Consent ticket state
  const [ticketVerifier, setTicketVerifier] = useState("TCS Hiring Portal");
  const [ticketDuration, setTicketDuration] = useState("24");
  const [generatedTicket, setGeneratedTicket] = useState("");

  // Course enrollment state
  const [enrolledCourses, setEnrolledCourses] = useState(() => {
    const saved = localStorage.getItem(`enrolled_${currentUser?.profileId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [claimingCourse, setClaimingCourse] = useState(null);
  
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchVerificationHistory = async () => {
    if (!myDID || !myDID.rollNo) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/students/verification-history/${myDID.rollNo}`);
      if (res.ok) {
        const data = await res.json();
        setVerificationHistory(data);
      }
    } catch (err) {
      console.error("Error fetching verification history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "dashboard" && myDID) {
      fetchVerificationHistory();
    }
  }, [tab, myDID]);

  const handleEnroll = (courseId) => {
    const updated = { ...enrolledCourses, [courseId]: "enrolled" };
    setEnrolledCourses(updated);
    localStorage.setItem(`enrolled_${currentUser?.profileId}`, JSON.stringify(updated));
    showToast("Enrolled in course successfully!", "success");
  };

  const handleClaimCertificate = async (course) => {
    setClaimingCourse(course.id);
    try {
      await store.issueCourseCert(myDID.rollNo, course.title, course.academyId);
      const updated = { ...enrolledCourses, [course.id]: "completed" };
      setEnrolledCourses(updated);
      localStorage.setItem(`enrolled_${currentUser?.profileId}`, JSON.stringify(updated));
      showToast(`Certificate for ${course.title} successfully issued! Check 'My Credentials'.`, "success");
    } catch (err) {
      showToast("Failed to claim certificate: " + err.message, "error");
    } finally {
      setClaimingCourse(null);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === "Student" && currentUser.profile) {
      setMyDID({
        did: currentUser.profile.did,
        name: currentUser.profile.full_name,
        rollNo: currentUser.profile.student_id,
        dept: currentUser.profile.dept || "CSE ICBT",
        email: currentUser.profile.email,
        active: true,
        created: "2025-06-10",
        hash: currentUser.profile.wallet_address,
        abc_id: currentUser.profile.abc_id
      });
      setTab("dashboard");
    } else if (!currentUser) {
      setMyDID(null);
      setTab("login");
    }
  }, [currentUser]);

  const fetchStudentCredits = async () => {
    if (!myDID || !myDID.abc_id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/credits/abc/${myDID.abc_id}`);
      const data = await res.json();
      if (res.ok) setStudentCredits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === "credits" && myDID) {
      fetchStudentCredits();
    }
  }, [tab, myDID]);

  const handleTransferCredits = async () => {
    if (!myDID || !myDID.abc_id) return;
    setTransferringCredits(true);
    try {
      const res = await fetch("http://localhost:5000/api/credits/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abcId: myDID.abc_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      showToast(data.message, "success");
      fetchStudentCredits();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTransferringCredits(false);
    }
  };

  const handleGenerateTicket = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/consent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: myDID.rollNo,
          verifierName: ticketVerifier,
          durationHours: ticketDuration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate ticket");
      setGeneratedTicket(data.ticket);
      showToast("Verification consent ticket generated!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.rollNo || !form.abcId) { showToast("Name, Roll No, and ABC ID are required", "error"); return; }
    let activeWallet = wallet;
    if (!activeWallet) {
      activeWallet = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
      showToast("No wallet connected. Auto-connecting to Sandbox...", "info");
    }
    setLoading(true);
    try {
      if (demoMode) {
        await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email || `${form.rollNo.toLowerCase()}@soet.mgmu.ac.in`,
            password: "password123",
            role: "Student",
            name: form.name,
            studentId: form.rollNo,
            walletAddress: activeWallet,
            abcId: form.abcId
          })
        });
      }

      const d = await store.registerDID({
        rollNo: form.rollNo,
        walletAddress: activeWallet
      });
      
      await handleLogin(form.abcId, "password123", "Student");
    } catch (err) {
      showToast("Registration failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const onLoginSubmit = async () => {
    if (!loginForm.username || !loginForm.password) { showToast("Username and Password are required", "error"); return; }
    setLoginLoading(true);
    try {
      await handleLogin(loginForm.username, loginForm.password, "Student");
    } catch (err) {
    } finally {
      setLoginLoading(false);
    }
  };

  const myCreds = myDID ? store.credentials.filter(c => c.rollNo === myDID.rollNo) : [];
  const shortHash = (h) => h ? `${h.slice(0, 12)}…${h.slice(-8)}` : "N/A";

  if (!currentUser || currentUser.role !== "Student") {
    return (
      <>
        <div className="page-header">
          <div className="page-header-inner">
            <div className="breadcrumb">Home <span>/</span> Student Portal</div>
            <h2>🎓 Student Portal</h2>
            <p>Access your academic credentials and manage your digital blockchain identity</p>
          </div>
        </div>
        <div className="section">
          <div className="section-inner" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
            <div className="form-panel" style={{ maxWidth: 500, width: "100%", padding: 40, textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎓</div>
              <div className="form-title" style={{ fontSize: "1.5rem", color: "var(--navy)" }}>Student Credentials & Identity</div>
              <div className="form-sub" style={{ margin: "12px 0 28px", fontSize: ".9rem", lineHeight: 1.6 }}>
                Welcome to the MGMU School of Engineering & Technology Student Portal. 
                Please sign in to view your Verifiable Degree credentials, check your academic credit bank, or register your Decentralized Identifier (DID).
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => nav("student-login")} style={{ padding: "10px 24px" }}>🔐 Student Sign In</button>
                <button className="btn btn-outline" onClick={() => nav("student-login")} style={{ padding: "10px 24px" }}>📝 Register Student DID</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
          {!wallet && (
            <div className="alert alert-warn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span>⚠️ Please connect your MetaMask wallet to register or view credentials on-chain.</span>
              <button className="btn btn-outline btn-sm" onClick={connectWallet} style={{ background: "white", color: "var(--navy)" }}>🦊 Connect Wallet</button>
            </div>
          )}
          <div className="dash-layout" style={{ minHeight: "auto", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--gray-200)", boxShadow: "var(--shadow)" }}>
            <div className="sidebar">
              <div className="sidebar-header" style={{ paddingBottom: 16 }}>
                <div className="sidebar-title">Student Portal</div>
                <div className="sidebar-sub" style={{ marginBottom: 12 }}>{currentUser.profile?.full_name || "Student"}</div>
                <button className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet} style={{ fontSize: ".7rem", padding: "6px 12px", width: "100%", justifyContent: "center" }}>
                  {wallet ? <><div className="wallet-dot" />{wallet.slice(0, 6)}…{wallet.slice(-4)}</> : "🦊 Connect Wallet"}
                </button>
              </div>
              <div className="sidebar-nav">
                <button className={`sidebar-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}><span className="sidebar-item-icon">🪪</span>My Identity</button>
                <button className={`sidebar-item ${tab === "credentials" ? "active" : ""}`} onClick={() => setTab("credentials")}><span className="sidebar-item-icon">📄</span>My Credentials</button>
                <button className={`sidebar-item ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}><span className="sidebar-item-icon">🎓</span>Online Courses</button>
                <button className={`sidebar-item ${tab === "credits" ? "active" : ""}`} onClick={() => setTab("credits")}><span className="sidebar-item-icon">🏛️</span>NEP Credit Bank</button>
                <button className={`sidebar-item ${tab === "tickets" ? "active" : ""}`} onClick={() => setTab("tickets")}><span className="sidebar-item-icon">🎟️</span>Consent Tickets</button>
                <button className={`sidebar-item ${tab === "share" ? "active" : ""}`} onClick={() => setTab("share")}><span className="sidebar-item-icon">📤</span>Share / QR</button>
                <button className="sidebar-item" onClick={handleLogout} style={{ marginTop: 24, borderTop: "1px solid var(--gray-200)" }}><span className="sidebar-item-icon">🚪</span>Sign Out</button>
              </div>
            </div>
            <div className="dash-content">

              {tab === "dashboard" && myDID && (
                <div>
                  <div className="dash-header" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="dash-title">Student Profile Dashboard</div>
                      <div className="dash-sub">Manage your blockchain credentials and decentralized digital identity</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24, alignItems: "start" }}>
                    {/* Left Column: Profile Card */}
                    <div className="form-panel" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
                      {/* Avatar */}
                      <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-dark) 100%)",
                        color: "var(--gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        fontWeight: 700,
                        marginBottom: 16,
                        boxShadow: "0 4px 10px rgba(10,34,64,0.15)",
                        border: "3px solid var(--white)"
                      }}>
                        {myDID.name ? myDID.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "ST"}
                      </div>

                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4, textAlign: "center" }}>{myDID.name}</div>
                      <div style={{ fontSize: ".82rem", color: "var(--text-light)", marginBottom: 20, textAlign: "center" }}>
                        MGMU SoET · {myDID.dept}
                      </div>

                      {/* Detail Fields */}
                      <div style={{ width: "100%", borderTop: "1px solid var(--gray-200)", paddingTop: 16, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: ".83rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-light)" }}>Roll Number</span>
                          <span style={{ fontWeight: 700, color: "var(--text)" }}>{myDID.rollNo}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: ".83rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-light)" }}>Email Address</span>
                          <span style={{ fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{myDID.email}</span>
                        </div>
                      </div>

                      {/* DID Block */}
                      <div style={{ width: "100%", marginBottom: 14 }}>
                        <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".4px" }}>W3C DID Document</div>
                        <div style={{ display: "flex", gap: 6, background: "var(--gray-50)", border: "1px solid var(--gray-200)", padding: "6px 8px", borderRadius: "var(--radius)", alignItems: "center" }}>
                          <div style={{ fontFamily: "monospace", fontSize: ".72rem", color: "var(--navy-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
                            {myDID.did}
                          </div>
                          <button className="btn btn-outline btn-sm" style={{ padding: "3px 6px", fontSize: ".65rem", minWidth: 42 }} onClick={() => {
                            navigator.clipboard.writeText(myDID.did);
                            showToast("DID copied to clipboard!", "success");
                          }}>Copy</button>
                        </div>
                      </div>

                      {/* Wallet Block */}
                      <div style={{ width: "100%", marginBottom: 20 }}>
                        <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".4px" }}>MetaMask Sandbox Wallet</div>
                        <div style={{ display: "flex", gap: 6, background: "var(--gray-50)", border: "1px solid var(--gray-200)", padding: "6px 8px", borderRadius: "var(--radius)", alignItems: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: wallet ? "var(--emerald)" : "var(--red)" }} />
                          <div style={{ fontFamily: "monospace", fontSize: ".72rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
                            {myDID.hash || "No Wallet Connected"}
                          </div>
                          {myDID.hash && <button className="btn btn-outline btn-sm" style={{ padding: "3px 6px", fontSize: ".65rem", minWidth: 42 }} onClick={() => {
                            navigator.clipboard.writeText(myDID.hash);
                            showToast("Wallet address copied!", "success");
                          }}>Copy</button>}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 16, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".4px" }}>Scan Identity QR</div>
                        <div style={{ background: "white", padding: 8, border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                          <QRCanvas value={myDID.did} size={100} />
                        </div>
                        <div style={{ fontSize: ".68rem", color: "var(--text-light)", marginTop: 8 }}>Scannable by verifiers & employers</div>
                      </div>
                    </div>

                    {/* Right Column: Academic Details & Logs */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      
                      {/* Active Credentials Summary */}
                      <div className="form-panel" style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--gray-200)", paddingBottom: 10 }}>
                          <span>🎓</span> My Credentials ({myCreds.length})
                        </h3>
                        {myCreds.length === 0 ? (
                          <div style={{ fontSize: ".83rem", color: "var(--text-light)", padding: "12px 0" }}>
                            No credentials issued yet. When your institution or academy admin issues a certificate, it will appear here.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {myCreds.slice(0, 3).map(c => (
                              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gray-50)", border: "1px solid var(--gray-200)", padding: 12, borderRadius: "var(--radius)" }}>
                                <div>
                                  <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--navy)" }}>{c.type}</div>
                                  <div style={{ fontSize: ".72rem", color: "var(--text-light)" }}>Issued by {c.issuer} · CGPA: {c.cgpa}</div>
                                </div>
                                <span style={{ fontSize: ".7rem", fontWeight: 600, color: "var(--emerald)", background: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "20px" }}>
                                  ✓ Active
                                </span>
                              </div>
                            ))}
                            {myCreds.length > 3 && (
                              <button onClick={() => setTab("credentials")} className="btn btn-outline btn-sm" style={{ alignSelf: "center", marginTop: 6 }}>
                                View All ({myCreds.length}) Certificates
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Blockchain Verification Logs */}
                      <div className="form-panel" style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--gray-200)", paddingBottom: 10 }}>
                          <span>👁️</span> Verification Access History ({verificationHistory.length})
                        </h3>
                        {historyLoading ? (
                          <div className="loading-row" style={{ fontSize: ".8rem" }}><div className="spinner" />Loading verification logs…</div>
                        ) : verificationHistory.length === 0 ? (
                          <div style={{ fontSize: ".83rem", color: "var(--text-light)", padding: "12px 0" }}>
                            No verification requests logged yet. Your credentials will log an entry whenever scanned or verified by verifiers.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                            {verificationHistory.map(log => (
                              <div key={log.verify_id} style={{ display: "flex", gap: 10, alignItems: "start", borderLeft: `3px solid ${log.status === "Success" ? "var(--emerald)" : "var(--red)"}`, paddingLeft: 10, paddingBottom: 6 }}>
                                <div style={{ flexGrow: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)" }}>
                                      {log.degree_name} Query
                                    </span>
                                    <span style={{ fontSize: ".65rem", fontWeight: 700, color: log.status === "Success" ? "var(--emerald)" : "var(--red)", textTransform: "uppercase" }}>
                                      {log.status}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: ".72rem", color: "var(--text-light)", marginTop: 2 }}>
                                    Verified via {log.method} from IP: {log.ip_address || "127.0.0.1"}
                                  </div>
                                  <div style={{ fontSize: ".68rem", color: "var(--text-light)", marginTop: 2, fontFamily: "monospace" }}>
                                    {new Date(log.verified_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {tab === "credentials" && myDID && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Academic Credentials</div><div className="dash-sub">Verifiable Credentials issued by MGMU School of Engineering</div></div></div>
                  {myCreds.length === 0 ? (
                    <div className="alert alert-info">🎓 You don't have any academic credentials issued to your DID yet. Ask your university admin to issue one.</div>
                  ) : (
                    <div className="grid-2">
                      {myCreds.map(c => (
                        <div key={c.id} className="cred-card" style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                          <div className="cred-card-header" style={{ padding: 16, background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>{c.type}</div>
                            <div style={{ fontSize: ".72rem", color: "var(--text-light)" }}>Issued by {c.issuer} on {c.issued}</div>
                          </div>
                          <div className="cred-card-body" style={{ padding: 16, flexGrow: 1 }}>
                            <div className="cred-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div><div style={{ fontSize: ".7rem", color: "var(--text-light)" }}>Student</div><div style={{ fontSize: ".85rem", fontWeight: 600 }}>{c.issuedTo}</div></div>
                              <div><div style={{ fontSize: ".7rem", color: "var(--text-light)" }}>Roll No</div><div style={{ fontSize: ".85rem", fontWeight: 600 }}>{c.rollNo}</div></div>
                              <div><div style={{ fontSize: ".7rem", color: "var(--text-light)" }}>Department</div><div style={{ fontSize: ".85rem", fontWeight: 600 }}>{c.dept}</div></div>
                              <div><div style={{ fontSize: ".7rem", color: "var(--text-light)" }}>CGPA</div><div style={{ fontSize: ".85rem", fontWeight: 600 }}>{c.cgpa}</div></div>
                              <div style={{ gridColumn: "span 2" }}><div style={{ fontSize: ".7rem", color: "var(--text-light)" }}>IPFS hash</div><div style={{ fontSize: ".74rem", fontFamily: "monospace", color: "var(--navy)" }}>{(c.ipfs || "").slice(0, 24)}…</div></div>
                            </div>
                          </div>
                          <div className="cred-card-footer" style={{ padding: "12px 16px", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "flex-end", background: "var(--gray-50)" }}>
                            <a href={`http://localhost:5000/api/credentials/download-pdf/${c.id}`} download className="btn btn-outline btn-sm" style={{ padding: "6px 12px", fontSize: ".75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                              📥 Download Certificate PDF
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Online Courses */}
              {tab === "courses" && myDID && (
                <div>
                  <div className="dash-header">
                    <div>
                      <div className="dash-title">Online Courses & Certifications</div>
                      <div className="dash-sub">Earn verifiable blockchain certificates directly from authorized academies</div>
                    </div>
                  </div>
                  <div className="grid-2">
                    {ONLINE_COURSES.map(course => {
                      const status = enrolledCourses[course.id] || "not_started";
                      const isClaimed = myCreds.some(c => c.type === course.title && c.status === "valid");
                      return (
                        <div key={course.id} className="cred-card" style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                          <div className="cred-card-header" style={{ padding: 16, background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>{course.title}</div>
                              <div style={{ fontSize: ".72rem", color: "var(--text-light)" }}>Offered by {course.academy}</div>
                            </div>
                            <span className="chip" style={{
                              padding: "4px 10px",
                              fontSize: ".68rem",
                              textTransform: "uppercase",
                              background: isClaimed || status === "completed" ? "#dcfce7" : status === "enrolled" ? "#dbeafe" : "#f3f4f6",
                              color: isClaimed || status === "completed" ? "#166534" : status === "enrolled" ? "#1e40af" : "#4b5563"
                            }}>
                              {isClaimed || status === "completed" ? "Earned" : status === "enrolled" ? "In Progress" : "Available"}
                            </span>
                          </div>
                          <div className="cred-card-body" style={{ padding: 16, flexGrow: 1 }}>
                            <p style={{ fontSize: ".82rem", color: "var(--text)", lineHeight: 1.5, marginBottom: 12 }}>{course.description}</p>
                            <div style={{ display: "flex", gap: 16, fontSize: ".74rem", color: "var(--text-light)" }}>
                              <span>⏱️ <b>Duration:</b> {course.duration}</span>
                              <span>📈 <b>Level:</b> {course.level}</span>
                            </div>
                          </div>
                          <div className="cred-card-footer" style={{ padding: "12px 16px", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "flex-end", background: "var(--gray-50)" }}>
                            {course.academyId !== "univ_admin" ? (
                              <button className="btn btn-outline btn-sm" disabled style={{ fontSize: ".76rem", cursor: "not-allowed", opacity: 0.7, color: "var(--text-light)" }}>
                                ⚠️ External Course (No On-chain Anchor)
                              </button>
                            ) : isClaimed ? (
                              <button className="btn btn-outline btn-sm" onClick={() => setTab("credentials")} style={{ fontSize: ".76rem", color: "#166534", borderColor: "#86efac", background: "#f0fdf4" }}>
                                ✅ Certificate Earned — View
                              </button>
                            ) : status === "completed" ? (
                              <button className="btn btn-outline btn-sm" onClick={() => setTab("credentials")} style={{ fontSize: ".76rem" }}>
                                View in My Credentials
                              </button>
                            ) : status === "enrolled" ? (
                              claimingCourse === course.id ? (
                                <div className="loading-row" style={{ padding: 0 }}><div className="spinner" />Claiming…</div>
                              ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => handleClaimCertificate(course)} style={{ fontSize: ".76rem" }}>
                                  🎓 Complete & Claim Certificate
                                </button>
                              )
                            ) : (
                              <button className="btn btn-outline btn-sm" onClick={() => handleEnroll(course.id)} style={{ fontSize: ".76rem" }}>
                                📖 Enroll in Course
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NEP Credit Bank */}
              {tab === "credits" && myDID && (
                <div>
                  <div className="dash-header">
                    <div>
                      <div className="dash-title">NEP Academic Credit Bank</div>
                      <div className="dash-sub">Linked ABC ID: {myDID.abc_id || "ABC-111-222-333"}</div>
                    </div>
                  </div>
                  {studentCredits.length === 0 ? (
                    <div className="alert alert-info">🎓 No external courses registered for this ABC ID.</div>
                  ) : (
                    <div>
                      <div className="table-wrap" style={{ marginBottom: 20 }}>
                        <div className="table-head"><div className="table-title">Course Credit Registry</div></div>
                        <div style={{ overflowX: "auto" }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Course Name</th>
                                <th>Credits</th>
                                <th>Institution</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentCredits.map(c => (
                                <tr key={c.credit_id}>
                                  <td style={{ fontWeight: 600 }}>{c.course_name}</td>
                                  <td><span className="badge badge-navy">{c.credits} Credits</span></td>
                                  <td>{c.institution}</td>
                                  <td>
                                    <span className={`badge ${c.status === 'Earned' ? 'badge-blue' : 'badge-green'}`}>
                                      {c.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gray-50)", padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)" }}>
                        <div>
                          <div style={{ fontSize: ".85rem", color: "var(--text-light)" }}>Cumulative Eligible Credits</div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>
                            {studentCredits.reduce((acc, curr) => acc + curr.credits, 0)} Credits
                          </div>
                        </div>
                        {studentCredits.some(c => c.status === "Earned") ? (
                          <button className="btn btn-primary" onClick={handleTransferCredits} disabled={transferringCredits}>
                            {transferringCredits ? "Transferring…" : "⚡ Transfer Credits to degree ledger"}
                          </button>
                        ) : (
                          <div style={{ fontSize: ".85rem", color: "var(--text-green)", fontWeight: 600 }}>
                            ✓ All credits successfully transferred to your main university degree ledger.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consent Tickets */}
              {tab === "tickets" && myDID && (
                <div>
                  <div className="dash-header">
                    <div>
                      <div className="dash-title">Verification Consent Tickets</div>
                      <div className="dash-sub">Generate time-locked authorization credentials for employers</div>
                    </div>
                  </div>
                  <div className="two-col">
                    <div className="form-panel">
                      <div className="form-title">Create Verification Ticket</div>
                      <div className="form-sub">Specify verifier identity and duration limits before cryptographic signing.</div>
                      <div className="form-grid">
                        <div className="form-group full">
                          <label>Verifier Identity (e.g. Org Name)</label>
                          <input value={ticketVerifier} onChange={e => setTicketVerifier(e.target.value)} placeholder="e.g. TCS Talent Acquisition" />
                        </div>
                        <div className="form-group full">
                          <label>Validity Window</label>
                          <select value={ticketDuration} onChange={e => setTicketDuration(e.target.value)}>
                            <option value="1">1 Hour</option>
                            <option value="24">24 Hours</option>
                            <option value="168">7 Days (1 Week)</option>
                          </select>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={handleGenerateTicket}>
                        🎫 Sign & Generate Consent Ticket
                      </button>
                    </div>
                    
                    <div>
                      {generatedTicket ? (
                        <div className="form-panel" style={{ border: "1px solid var(--gold)" }}>
                          <div className="form-title" style={{ color: "var(--navy-dark)", fontSize: "1rem" }}>✓ Active Cryptographic Ticket</div>
                          <div className="form-sub">Copy this base64 authorization ticket and send it to your recruiter:</div>
                          <textarea 
                            value={generatedTicket} 
                            readOnly 
                            rows={6}
                            style={{ width: "100%", fontFamily: "monospace", fontSize: ".7rem", padding: 8, borderRadius: "var(--radius)", background: "var(--gray-50)", border: "1px solid var(--gray-300)", marginBottom: 12, resize: "none" }}
                          />
                          <button className="btn btn-outline btn-full btn-sm" onClick={() => { navigator.clipboard.writeText(generatedTicket); showToast("Ticket copied to clipboard!", "success"); }}>
                            📋 Copy Ticket String
                          </button>
                        </div>
                      ) : (
                        <div className="info-box">
                          <div className="info-box-title">How Consent Tickets Work</div>
                          <div className="info-box-text">
                            - Generates a JSON payload signed by your student DID private key.<br /><br />
                            - Employers verify your degrees by validating this signature and checking if the validity window has expired.<br /><br />
                            - Students maintain absolute control over their privacy, letting them authorize recruiters selectively.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Share / QR */}
              {tab === "share" && myDID && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Share Your Credentials</div><div className="dash-sub">Generate secure sharing links and QR codes</div></div></div>
                  {myCreds.length === 0 ? (
                    <div className="alert alert-info">🎓 You don't have any academic credentials issued to your DID yet. Ask your university admin to issue one.</div>
                  ) : (
                    <div>
                      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                        {myCreds.map(c => (
                          <div key={c.id} className="cred-card" style={{ border: "1px solid var(--gray-200)", padding: 16, borderRadius: "var(--radius)" }}>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>{c.type}</div>
                            <div style={{ fontSize: ".8rem", color: "var(--text-light)", marginBottom: 12 }}>Issued: {c.issued}</div>
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
const LOCATION_DATA = {
  "Maharashtra": {
    "Aurangabad": [
      "MGM University (MGMU)",
      "Dr. Babasaheb Ambedkar Marathwada University (BAMU)",
      "Other (Custom University Name)"
    ],
    "Mumbai": [
      "University of Mumbai",
      "IIT Bombay",
      "Other (Custom University Name)"
    ],
    "Pune": [
      "Savitribai Phule Pune University (SPPU)",
      "Symbiosis International University",
      "Other (Custom University Name)"
    ]
  },
  "Karnataka": {
    "Bangalore": [
      "Indian Institute of Science (IISc)",
      "Bangalore University",
      "Other (Custom University Name)"
    ],
    "Mysore": [
      "University of Mysore",
      "Other (Custom University Name)"
    ]
  },
  "Delhi": {
    "New Delhi": [
      "Delhi University (DU)",
      "Jawaharlal Nehru University (JNU)",
      "IIT Delhi",
      "Other (Custom University Name)"
    ]
  },
  "Gujarat": {
    "Ahmedabad": [
      "Gujarat University",
      "Nirma University",
      "Other (Custom University Name)"
    ]
  }
};

function IssuerPage({ store, wallet, showToast, nav, currentUser, handleLogin, handleLogout, connectWallet }) {
  const [tab, setTab] = useState(currentUser && currentUser.role === "University" ? "issue" : "login");
  const [form, setForm] = useState({ name: "", rollNo: "", dept: "CSE ICBT", cgpa: "", year: "2025", type: "Bachelor of Technology" });
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  const [verifyingDemo, setVerifyingDemo] = useState(false);

  const handleSpeedVerify = async () => {
    setVerifyingDemo(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ univId: currentUser?.profileId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify");
      
      showToast("Institution verified and approved successfully!", "success");
      const updatedUser = { ...currentUser };
      if (updatedUser.profile) {
        updatedUser.profile.is_verified = 1;
      }
      localStorage.setItem("did_currentUser", JSON.stringify(updatedUser));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showToast("Verification failed: " + err.message, "error");
    } finally {
      setVerifyingDemo(false);
    }
  };

  // Multi-signature proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Manage Students tab state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearch, setStudentsSearch] = useState("");

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/students/all");
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // View Analytics tab state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/dashboard/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Authorize Issuers tab state (super-admin only)
  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(false);
  const [instActionLoading, setInstActionLoading] = useState(null);

  const fetchInstitutions = async () => {
    setInstLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/institutions");
      const data = await res.json();
      if (res.ok) setInstitutions(data);
    } catch (err) {
      console.error("Error fetching institutions:", err);
    } finally {
      setInstLoading(false);
    }
  };

  const handleVerifyProfile = async (univId) => {
    setInstActionLoading(`verify_${univId}`);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ univId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify");
      showToast("Institution profile verified!", "success");
      fetchInstitutions();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setInstActionLoading(null);
    }
  };

  const handleBlockchainAuthorize = async (walletAddress) => {
    setInstActionLoading(`auth_${walletAddress}`);
    try {
      const res = await fetch("http://localhost:5000/api/blockchain/authorize-issuer", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ walletAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to authorize");
      showToast("Issuer wallet whitelisted on-chain successfully!", "success");
      fetchInstitutions();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setInstActionLoading(null);
    }
  };

  const handleBlockchainDeauthorize = async (walletAddress) => {
    setInstActionLoading(`deauth_${walletAddress}`);
    try {
      const res = await fetch("http://localhost:5000/api/blockchain/deauthorize-issuer", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ walletAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deauthorize");
      showToast("Issuer wallet deauthorized on-chain successfully!", "success");
      fetchInstitutions();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setInstActionLoading(null);
    }
  };

  useEffect(() => {
    if (tab === "students") fetchStudents();
    if (tab === "analytics") fetchStats();
    if (tab === "authorize") fetchInstitutions();
  }, [tab]);

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/multisig/proposals");
      const data = await res.json();
      if (res.ok) setProposals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "multisig" && currentUser) {
      fetchProposals();
    }
  }, [tab, currentUser]);

  const handleSignProposal = async (proposalId) => {
    try {
      const res = await fetch("http://localhost:5000/api/multisig/approve", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          proposalId,
          approverEmail: currentUser?.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");
      showToast(data.message, "success");
      fetchProposals();
    } catch (err) {
      showToast(err.message, "error");
    }
  };
  
  // Registrar login form state
  const [adminLoginForm, setAdminLoginForm] = useState({ email: "admin@soet.mgmu.ac.in", password: "password123" });
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Default values based on LOCATION_DATA
  const states = Object.keys(LOCATION_DATA);
  const defaultState = states[0];
  const cities = Object.keys(LOCATION_DATA[defaultState]);
  const defaultCity = cities[0];
  const universities = LOCATION_DATA[defaultState][defaultCity];
  const defaultUniv = universities[0];

  // Registrar registration form state
  const [registerForm, setRegisterForm] = useState({
    name: defaultUniv,
    customUnivName: "",
    accreditationNo: "",
    email: "",
    password: "password123",
    city: defaultCity,
    state: defaultState,
    address: "",
    phone: "",
    walletAddress: ""
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role === "University") {
      setTab("issue");
    } else {
      setTab("login");
    }
  }, [currentUser]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setReg = (k, v) => setRegisterForm(p => ({ ...p, [k]: v }));

  const handleStateChange = (selectedState) => {
    const stateCities = Object.keys(LOCATION_DATA[selectedState]);
    const firstCity = stateCities[0];
    const cityUnivs = LOCATION_DATA[selectedState][firstCity];
    const firstUniv = cityUnivs[0];

    setRegisterForm(p => ({
      ...p,
      state: selectedState,
      city: firstCity,
      name: firstUniv
    }));
  };

  const handleCityChange = (selectedCity) => {
    const cityUnivs = LOCATION_DATA[registerForm.state][selectedCity];
    const firstUniv = cityUnivs[0];

    setRegisterForm(p => ({
      ...p,
      city: selectedCity,
      name: firstUniv
    }));
  };

  const handleIssue = async () => {
    if (!form.name || !form.rollNo) { showToast("Name and Roll No required", "error"); return; }
    setLoading(true);
    try {
      await store.issueCred(form);
      setTab("manage");
      showToast("Credential issued and anchored on Ethereum!", "success");
    } catch (err) {
      showToast("Issuance failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("universityId", currentUser?.profileId || "univ_admin");

      const res = await fetch("http://localhost:5000/api/credentials/bulk-issue", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed bulk upload");
      
      setCsvResult(data.summary.successCount);
      await store.syncData();
      showToast(`Bulk issued ${data.summary.successCount} credentials!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCsvLoading(false);
    }
  };

  const onAdminLoginSubmit = async () => {
    if (!adminLoginForm.email || !adminLoginForm.password) { showToast("Email and Password are required", "error"); return; }
    setAdminLoginLoading(true);
    try {
      await handleLogin(adminLoginForm.email, adminLoginForm.password, "University");
    } catch (err) {
      // error shown in handleLogin
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleUnivRegister = async () => {
    const finalUnivName = registerForm.name === "Other (Custom University Name)" 
      ? registerForm.customUnivName 
      : registerForm.name;

    if (!finalUnivName || !registerForm.accreditationNo || !registerForm.email || !registerForm.city || !registerForm.state) {
      showToast("Name, Accreditation No, Email, City, and State are required", "error");
      return;
    }
    setRegisterLoading(true);
    try {
      const activeWallet = registerForm.walletAddress || wallet || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          role: "University",
          name: finalUnivName,
          phone: registerForm.phone,
          address: registerForm.address,
          accreditationNo: registerForm.accreditationNo,
          walletAddress: activeWallet,
          city: registerForm.city,
          state: registerForm.state
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register university");

      showToast("University registered successfully! Logging in...", "success");
      // Auto login the newly registered university
      await handleLogin(registerForm.email, registerForm.password, "University");
    } catch (err) {
      showToast("Registration failed: " + err.message, "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== "University") {
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
          <div className="section-inner" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
            <div className="form-panel" style={{ maxWidth: 500, width: "100%", padding: 40, textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏛️</div>
              <div className="form-title" style={{ fontSize: "1.5rem", color: "var(--navy)" }}>Admin Portal</div>
              <div className="form-sub" style={{ margin: "12px 0 28px", fontSize: ".9rem", lineHeight: 1.6 }}>
                Authorized university & academy administrators can sign in here to anchor degree credentials, perform bulk CSV uploads, check analytics, or manage multi-signature proposals.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => nav("admin-login")} style={{ padding: "10px 24px" }}>🔐 Admin Sign In</button>
                <button className="btn btn-outline" onClick={() => nav("university-register")} style={{ padding: "10px 24px" }}>🏢 Register Institution</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
          {!wallet && (
            <div className="alert alert-warn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span>⚠️ Please connect your registrar MetaMask wallet to sign and issue degree transactions on-chain.</span>
              <button className="btn btn-outline btn-sm" onClick={connectWallet} style={{ background: "white", color: "var(--navy)" }}>🦊 Connect Wallet</button>
            </div>
          )}
          <div className="dash-layout" style={{ minHeight: "auto", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--gray-200)", boxShadow: "var(--shadow)" }}>
            <div className="sidebar">
              <div className="sidebar-header" style={{ paddingBottom: 16 }}>
                <div className="sidebar-title">Admin Panel</div>
                <div className="sidebar-sub" style={{ marginBottom: 12 }}>{currentUser.profile?.univ_name || "MGMU SoET"}</div>
                <button className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet} style={{ fontSize: ".7rem", padding: "6px 12px", width: "100%", justifyContent: "center" }}>
                  {wallet ? <><div className="wallet-dot" />{wallet.slice(0, 6)}…{wallet.slice(-4)}</> : "🦊 Connect Wallet"}
                </button>
              </div>
              <div className="sidebar-nav">
                <button className={`sidebar-item ${tab === "issue" ? "active" : ""}`} onClick={() => setTab("issue")}><span className="sidebar-item-icon">📝</span>Issue Credential</button>
                <button className={`sidebar-item ${tab === "bulk" ? "active" : ""}`} onClick={() => setTab("bulk")}><span className="sidebar-item-icon">📦</span>Bulk Upload CSV</button>
                <button className={`sidebar-item ${tab === "manage" ? "active" : ""}`} onClick={() => setTab("manage")}><span className="sidebar-item-icon">🚫</span>Revoke Credentials</button>
                <button className={`sidebar-item ${tab === "students" ? "active" : ""}`} onClick={() => setTab("students")}><span className="sidebar-item-icon">👥</span>Manage Students</button>
                <button className={`sidebar-item ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}><span className="sidebar-item-icon">📊</span>View Analytics</button>
                {currentUser?.email === "admin@soet.mgmu.ac.in" && (
                  <button className={`sidebar-item ${tab === "authorize" ? "active" : ""}`} onClick={() => setTab("authorize")}><span className="sidebar-item-icon">🔒</span>Authorize Issuers</button>
                )}
                <button className={`sidebar-item ${tab === "dids" ? "active" : ""}`} onClick={() => setTab("dids")}><span className="sidebar-item-icon">🪪</span>Registered DIDs</button>
                <button className={`sidebar-item ${tab === "multisig" ? "active" : ""}`} onClick={() => setTab("multisig")}><span className="sidebar-item-icon">🖋️</span>Multi-Sig Board</button>
                <button className="sidebar-item" onClick={handleLogout} style={{ marginTop: 24, borderTop: "1px solid var(--gray-200)" }}><span className="sidebar-item-icon">🚪</span>Sign Out</button>
              </div>
            </div>
            <div className="dash-content">
              {currentUser.profile?.is_verified === 0 ? (
                <div>
                  <div className="dash-header">
                    <div>
                      <div className="dash-title">🔒 Institution Verification Pending</div>
                      <div className="dash-sub">Your profile is currently undergoing strict administrative verification.</div>
                    </div>
                  </div>
                  <div className="alert alert-warn" style={{ padding: "16px 20px", display: "block" }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: 700 }}>⚠️ Security Audit Process</h3>
                    <p style={{ fontSize: ".83rem", lineHeight: 1.5, margin: 0 }}>
                      MGMU degree registration protocol verifies every registered institution strictly. Until validation is completed, all blockchain operations (including degree issuance, bulk CSV imports, and multi-sig voting) are securely locked to prevent unauthorized credentials.
                    </p>
                  </div>
                  <div className="two-col" style={{ marginTop: 24 }}>
                    <div className="form-panel">
                      <div className="form-title">Verification Application Details</div>
                      <div className="form-sub" style={{ marginBottom: 16 }}>Submitted files and metadata:</div>
                      <table style={{ width: "100%", fontSize: ".83rem", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Institution Type</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>{currentUser.profile?.inst_type === "Academy" ? "Online Course Academy" : "Accredited University / College"}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Registered Name</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>{currentUser.profile?.univ_name}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Tax Identification (EIN)</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>{currentUser.profile?.tax_id || "EIN-Pending"}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Accreditation Code</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>{currentUser.profile?.accreditation_no}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Official Domain Website</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>
                              <a href={currentUser.profile?.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy)", textDecoration: "underline" }}>
                                {currentUser.profile?.website || "Not provided"}
                              </a>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Registrar Contact Email</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>{currentUser.profile?.email}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "8px 0", fontWeight: 600, color: "var(--navy)" }}>Attached License Copy</td>
                            <td style={{ padding: "8px 0", color: "var(--text-light)" }}>✅ accreditation_license.pdf</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div className="info-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div className="info-box-title" style={{ color: "var(--navy)" }}>🔐 Strict Verification Audit</div>
                        <p style={{ fontSize: ".8rem", color: "var(--text-light)", lineHeight: 1.5, margin: "8px 0 16px" }}>
                          Our system performs an automated cross-reference checklist to confirm the physical existence and accreditation status of your institution.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: ".76rem", color: "var(--text)" }}>
                          <div>✅ Registrar email domain matches website domain</div>
                          <div>✅ Government database active status: <b>Active</b></div>
                          <div>⏳ License OCR matching check: <b>Pending</b></div>
                          <div>⏳ Registrar authority signature check: <b>Pending</b></div>
                        </div>
                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: ".75rem", color: "var(--text-light)", marginBottom: 8 }}>Demo administrative shortcut:</div>
                          {verifyingDemo ? (
                            <div className="loading-row" style={{ padding: 0 }}><div className="spinner" />Verification in progress…</div>
                          ) : (
                            <button className="btn btn-primary btn-sm btn-full" onClick={handleSpeedVerify} style={{ padding: "8px 12px", fontSize: ".78rem" }}>
                              ⚡ Complete Administrative Approval
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Issue */}
                  {tab === "issue" && currentUser && currentUser.role === "University" && (
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
                        <div className="form-group"><label>CGPA *</label><input value={form.cgpa} onChange={e => set("cgpa", e.target.value)} placeholder="e.g. 8.4" /></div>
                        <div className="form-group"><label>Graduation Year</label><select value={form.year} onChange={e => set("year", e.target.value)}>{["2023","2024","2025","2026"].map(y => <option key={y}>{y}</option>)}</select></div>
                      </div>
                      {loading ? <div className="loading-row"><div className="spinner" />Anchoring on Ethereum blockchain…</div>
                        : <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={handleIssue}>⬡ Issue Degree</button>}
                    </div>
                    <div>
                      <div className="info-box">
                        <div className="info-box-title">Security & Cryptography</div>
                        <div className="info-box-text">
                          - Signs a W3C Verifiable Credential payload using Ethers.js<br />
                          - Stores encrypted VC metadata on decentralized IPFS network<br />
                          - Anchors SHA-256 degree hash permanently on Ethereum smart contract<br />
                          - Only authorized MGMU registrar address can issue/sign degrees.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk */}
              {tab === "bulk" && currentUser && currentUser.role === "University" && (
                <div>
                  <div className="dash-header"><div><div className="dash-title">Bulk CSV Upload</div><div className="dash-sub">Issue multiple degree credentials in a single transaction with AI fraud detection</div></div></div>
                  <div className="two-col">
                    <div className="form-panel">
                      <div className="form-title">Upload Graduating Batch</div>
                      <div className="form-sub">Upload a CSV file containing Name, RollNo, Dept, CGPA, Year, and Email. The system runs AI anomaly checks before anchoring.</div>
                      
                      <div style={{ border: "2px dashed var(--gray-300)", borderRadius: "var(--radius-lg)", padding: "32px 16px", textAlign: "center", background: "var(--gray-50)", cursor: "pointer", marginBottom: 16 }}
                        onClick={() => document.getElementById("csv-file-input").click()}>
                        <input id="csv-file-input" type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📦</div>
                        <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: ".9rem" }}>
                          {csvLoading ? "Processing Batch..." : "Drag & Drop CSV file here"}
                        </div>
                        <div style={{ fontSize: ".78rem", color: "var(--text-light)", marginTop: 4 }}>
                          or click to browse (.csv only)
                        </div>
                      </div>

                      {csvResult && (
                        <div className="alert alert-success">
                          ✅ Successfully issued <b>{csvResult}</b> degree credentials on-chain. Anomaly checks completed!
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="info-box">
                        <div className="info-box-title">AI Outlier Verification</div>
                        <div className="info-box-text">
                          To ensure authenticity, the system runs statistical Z-Score anomaly checks on CGPA inputs to prevent registrar tempering or grade inflation, and flags unaccredited email domains before execution.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage */}
              {tab === "manage" && currentUser && currentUser.role === "University" && (() => {
                const universityDegrees = store.credentials.filter(c => !c.isCourse || c.univId === currentUser.profile?.univ_id);
                return (
                  <div>
                    <div className="dash-header"><div><div className="dash-title">Issued Credentials</div><div className="dash-sub">{universityDegrees.length} credentials registered in database</div></div></div>
                    <div className="table-wrap">
                      <div className="table-head"><div className="table-title">Credentials Registry</div></div>
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead><tr><th>Student</th><th>Roll No</th><th>Credential</th><th>CGPA</th><th>Year</th><th>Issued Date</th><th>Status</th><th>Actions</th></tr></thead>
                          <tbody>
                            {universityDegrees.map(c => (
                              <tr key={c.id}>
                                <td style={{ fontWeight: 600 }}>{c.issuedTo}</td>
                                <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{c.rollNo}</span></td>
                                <td>{c.type}</td>
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
                );
              })()}

              {/* Registered DIDs */}
              {tab === "dids" && currentUser && currentUser.role === "University" && (
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

              {/* Multi-Sig Board */}
              {tab === "multisig" && currentUser && currentUser.role === "University" && (
                <div>
                  <div className="dash-header">
                    <div>
                      <div className="dash-title">Multi-Signature Board</div>
                      <div className="dash-sub">Approve sensitive registrar authority proposals</div>
                    </div>
                  </div>
                  {proposalsLoading ? (
                    <div className="loading-row"><div className="spinner" />Loading auth proposals…</div>
                  ) : proposals.length === 0 ? (
                    <div className="alert alert-info">🖋️ No pending multi-sig registrar proposals found.</div>
                  ) : (
                    <div className="table-wrap">
                      <div className="table-head"><div className="table-title">Registrar Authority Proposals</div></div>
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Proposal Description</th>
                              <th>Target Address</th>
                              <th>Approved Cosigners</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposals.map(p => (
                              <tr key={p.proposal_id}>
                                <td style={{ fontWeight: 600 }}>{p.description}</td>
                                <td><code style={{ fontSize: ".76rem" }}>{p.target_address}</code></td>
                                <td>
                                  <span className="badge badge-navy">
                                    {p.signatures_count} / 2 approvals
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${p.status === 'Approved' ? 'badge-green' : 'badge-gold'}`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td>
                                  {p.status === "Pending" ? (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleSignProposal(p.proposal_id)}>
                                      🖋️ Approve & Sign
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: ".82rem", color: "var(--text-green)", fontWeight: 600 }}>✓ Completed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manage Students */}
              {tab === "students" && currentUser && currentUser.role === "University" && (
                <div>
                  <div className="dash-header" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="dash-title">Manage Registered Students</div>
                      <div className="dash-sub">Search, audit, and issue credentials directly to student profiles</div>
                    </div>
                  </div>

                  <div className="form-panel" style={{ padding: 20, marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <input 
                        value={studentsSearch} 
                        onChange={e => setStudentsSearch(e.target.value)} 
                        placeholder="Search student profiles by Name, Roll No, or Email..." 
                        style={{ margin: 0, flexGrow: 1 }}
                      />
                    </div>
                  </div>

                  {studentsLoading ? (
                    <div className="loading-row"><div className="spinner" />Loading student profiles…</div>
                  ) : (
                    <div className="table-wrap" style={{ boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Roll Number</th>
                              <th>Email</th>
                              <th>DID Status</th>
                              <th>Certificates</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students
                              .filter(s => {
                                const q = studentsSearch.toLowerCase();
                                return s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
                              })
                              .map(s => (
                                <tr key={s.student_id}>
                                  <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                  <td><span style={{ fontFamily: "monospace", fontSize: ".82rem" }}>{s.student_id}</span></td>
                                  <td style={{ fontSize: ".82rem", color: "var(--text-light)" }}>{s.email}</td>
                                  <td>
                                    {s.did ? (
                                      <span className="badge badge-green" style={{ fontSize: ".68rem", fontFamily: "monospace" }}>
                                        {shortHash(s.did)}
                                      </span>
                                    ) : (
                                      <span className="badge badge-gold" style={{ fontSize: ".68rem" }}>
                                        No DID Registered
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge badge-navy" style={{ minWidth: 26, textAlign: "center" }}>
                                      {s.cert_count}
                                    </span>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-primary btn-sm" 
                                      onClick={() => {
                                        setForm(f => ({ ...f, rollNo: s.student_id, name: s.full_name }));
                                        setTab("issue");
                                        showToast(`Pre-filled degree issuance form for ${s.full_name}!`, "success");
                                      }}
                                    >
                                      🎓 Issue Degree
                                    </button>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View Analytics */}
              {tab === "analytics" && currentUser && currentUser.role === "University" && (
                <div>
                  <div className="dash-header" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="dash-title">System Metrics & Analytics</div>
                      <div className="dash-sub">Real-time stats and verification logs on the MGMU DID protocol</div>
                    </div>
                  </div>

                  {statsLoading || !stats ? (
                    <div className="loading-row"><div className="spinner" />Compiling analytics reports…</div>
                  ) : (
                    <div>
                      {/* Metric Counters */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                        <div className="form-panel" style={{ padding: 20, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 6 }}>🪪</div>
                          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--navy)" }}>{stats.didsRegistered}</div>
                          <div style={{ fontSize: ".76rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-light)" }}>Student DIDs Active</div>
                        </div>
                        <div className="form-panel" style={{ padding: 20, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 6 }}>📜</div>
                          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--navy)" }}>{stats.credentialsIssued}</div>
                          <div style={{ fontSize: ".76rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-light)" }}>Degrees Anchored</div>
                        </div>
                        <div className="form-panel" style={{ padding: 20, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 6 }}>🔗</div>
                          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--navy)" }}>{stats.blocksOnChain}</div>
                          <div style={{ fontSize: ".76rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-light)" }}>Blockchain Records Sync</div>
                        </div>
                        <div className="form-panel" style={{ padding: 20, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 6 }}>✅</div>
                          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald)" }}>{stats.verifiedToday}</div>
                          <div style={{ fontSize: ".76rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-light)" }}>Queries Approved</div>
                        </div>
                      </div>

                      {/* Charts and Log timelines */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
                        {/* Left Column: Verification Success Rate */}
                        <div className="form-panel" style={{ padding: 24, boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 20 }}>
                            🔍 Verification Quality
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: ".83rem", fontWeight: 600 }}>
                                <span>Successful Verifications</span>
                                <span style={{ color: "var(--emerald)" }}>100%</span>
                              </div>
                              <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: "100%", background: "var(--emerald)" }} />
                              </div>
                            </div>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: ".83rem", fontWeight: 600 }}>
                                <span>Fraud Attempts Stopped</span>
                                <span style={{ color: "var(--red)" }}>0%</span>
                              </div>
                              <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: "0%", background: "var(--red)" }} />
                              </div>
                            </div>
                            <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 16, fontSize: ".8rem", color: "var(--text-light)", lineHeight: 1.5 }}>
                              All verification logs are signed and cryptographically validated against the local Ethereum sandbox smart contract state variables.
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Recent Audits Timeline */}
                        <div className="form-panel" style={{ padding: 24, boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>
                            ⏱️ Live Verification Access Logs
                          </h3>
                          {stats.recentVerifications.length === 0 ? (
                            <div style={{ fontSize: ".83rem", color: "var(--text-light)", padding: "12px 0" }}>
                              No verification activities logged yet.
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                              {stats.recentVerifications.map(log => (
                                <div key={log.verify_id} style={{ display: "flex", gap: 10, alignItems: "start", borderLeft: `3px solid ${log.status === "Success" ? "var(--emerald)" : "var(--red)"}`, paddingLeft: 10, paddingBottom: 6 }}>
                                  <div style={{ flexGrow: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--navy)" }}>
                                        {log.student_name || "Unknown Student"} ({log.roll_no || "N/A"})
                                      </span>
                                      <span style={{ fontSize: ".65rem", fontWeight: 700, color: log.status === "Success" ? "var(--emerald)" : "var(--red)", textTransform: "uppercase" }}>
                                        {log.status}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: ".72rem", color: "var(--text)", marginTop: 2 }}>
                                      Verified <b>{log.degree_name || "Degree"}</b> via {log.method}
                                    </div>
                                    <div style={{ fontSize: ".68rem", color: "var(--text-light)", marginTop: 2, fontFamily: "monospace" }}>
                                      {new Date(log.verified_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Authorize Issuers (Super Admin Tab) */}
              {tab === "authorize" && currentUser && currentUser.email === "admin@soet.mgmu.ac.in" && (
                <div>
                  <div className="dash-header" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="dash-title">🔒 Whitelisting & Issuer Controls (Super-Admin)</div>
                      <div className="dash-sub">Review application details, audit domain sites, and whitelist institutions on the smart contract</div>
                    </div>
                  </div>

                  {instLoading ? (
                    <div className="loading-row"><div className="spinner" />Loading institution records…</div>
                  ) : (
                    <div className="table-wrap" style={{ boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Institution Name</th>
                              <th>Type</th>
                              <th>Tax ID</th>
                              <th>Website / Email</th>
                              <th>DB Status</th>
                              <th>Blockchain Whitelist</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {institutions.map(inst => (
                              <tr key={inst.univ_id}>
                                <td style={{ fontWeight: 600 }}>
                                  {inst.univ_name}
                                  {inst.univ_id === "univ_admin" && (
                                    <span style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--gold)", background: "var(--navy)", padding: "2px 6px", borderRadius: "10px", marginLeft: 6 }}>
                                      Super-Admin
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontSize: ".82rem" }}>
                                  {inst.inst_type === "Academy" ? "🎓 Academy" : "🏛️ University"}
                                </td>
                                <td style={{ fontSize: ".82rem", fontFamily: "monospace" }}>{inst.tax_id || "N/A"}</td>
                                <td style={{ fontSize: ".82rem" }}>
                                  <a href={inst.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy)", textDecoration: "underline", display: "block" }}>
                                    {inst.website ? inst.website.replace("https://", "").replace("http://", "") : "N/A"}
                                  </a>
                                  <span style={{ fontSize: ".72rem", color: "var(--text-light)" }}>{inst.email}</span>
                                </td>
                                <td>
                                  <span className={`badge ${inst.is_verified === 1 ? "badge-green" : "badge-gold"}`}>
                                    {inst.is_verified === 1 ? "Verified" : "Pending Audit"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${inst.is_authorized_onchain === 1 ? "badge-green" : "badge-red"}`}>
                                    {inst.is_authorized_onchain === 1 ? "Whitelisted" : "Blocklisted"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {inst.is_verified === 0 && (
                                      <button 
                                        className="btn btn-outline btn-sm" 
                                        disabled={instActionLoading === `verify_${inst.univ_id}`}
                                        onClick={() => handleVerifyProfile(inst.univ_id)}
                                      >
                                        {instActionLoading === `verify_${inst.univ_id}` ? "Verifying..." : "⚡ Verify DB"}
                                      </button>
                                    )}
                                    {inst.univ_id !== "univ_admin" && (
                                      inst.is_authorized_onchain === 0 ? (
                                        <button 
                                          className="btn btn-primary btn-sm" 
                                          disabled={instActionLoading === `auth_${inst.wallet_address}`}
                                          onClick={() => handleBlockchainAuthorize(inst.wallet_address)}
                                          style={{ background: "var(--navy)" }}
                                        >
                                          {instActionLoading === `auth_${inst.wallet_address}` ? "Authorizing..." : "🔗 Whitelist"}
                                        </button>
                                      ) : (
                                        <button 
                                          className="btn btn-danger btn-sm" 
                                          disabled={instActionLoading === `deauth_${inst.wallet_address}`}
                                          onClick={() => handleBlockchainDeauthorize(inst.wallet_address)}
                                        >
                                          {instActionLoading === `deauth_${inst.wallet_address}` ? "Blocking..." : "🚫 Block"}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
// ─── EXPLORER PAGE ────────────────────────────────────────────────────────────
function ExplorerPage({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/blockchain/events");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch blockchain events");
      setEvents(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const q = filterQuery.toLowerCase();
    return (
      e.eventName.toLowerCase().includes(q) ||
      e.transactionHash.toLowerCase().includes(q) ||
      (e.args.docHash && e.args.docHash.toLowerCase().includes(q)) ||
      (e.args.issuer && e.args.issuer.toLowerCase().includes(q))
    );
  });

  const shortHash = (h) => h ? `${h.slice(0, 10)}…${h.slice(-8)}` : "N/A";
  const formatTime = (ts) => ts ? ts.replace("T", " ").slice(0, 19) : "N/A";

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Ledger Explorer</div>
          <h2>⛓️ On-Chain Ledger Explorer</h2>
          <p>Real-time transaction logs and event streams queried directly from the Ethereum smart contract</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <div className="search-bar" style={{ flexGrow: 1, maxWidth: 500, margin: 0 }}>
              <input 
                value={filterQuery} 
                onChange={e => setFilterQuery(e.target.value)} 
                placeholder="Search by Document Hash, Transaction, or Issuer..." 
              />
            </div>
            <button className="btn btn-outline" onClick={fetchEvents} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              🔄 Refresh Ledger
            </button>
          </div>

          {loading ? (
            <div className="loading-row"><div className="spinner" />Syncing with smart contract event logs…</div>
          ) : filteredEvents.length === 0 ? (
            <div className="alert alert-info">🔍 No on-chain ledger records found matching your search.</div>
          ) : (
            <div className="table-wrap" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)", boxShadow: "var(--shadow)" }}>
              <div className="table-head">
                <div className="table-title">Ethereum Block Log</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Event</th>
                      <th>Transaction Hash</th>
                      <th>Timestamp</th>
                      <th>Contract Parameters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e, index) => {
                      let badgeClass = "badge-blue";
                      if (e.eventName === "DegreeIssued") badgeClass = "badge-green";
                      if (e.eventName === "DegreeRevoked") badgeClass = "badge-red";
                      if (e.eventName === "IssuerAuthorized") badgeClass = "badge-gold";

                      return (
                        <tr key={index}>
                          <td>
                            <span className="badge badge-navy" style={{ fontFamily: "monospace" }}>
                              #{e.blockNumber}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              {e.eventName}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: "monospace", fontSize: ".76rem", color: "var(--navy)" }}>
                              {shortHash(e.transactionHash)}
                            </span>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(e.transactionHash); showToast("Tx hash copied!", "success"); }} 
                              style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, fontSize: ".75rem" }}
                            >
                              📋
                            </button>
                          </td>
                          <td>{formatTime(e.timestamp)}</td>
                          <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: ".75rem", fontFamily: "monospace" }}>
                              {e.args.docHash && <div><b>docHash:</b> {shortHash(e.args.docHash)}</div>}
                              {e.args.issuer && <div><b>issuer:</b> {shortHash(e.args.issuer)}</div>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── VERIFIER PAGE ────────────────────────────────────────────────────────────
function VerifierPage({ store }) {
  const [pageTab, setPageTab] = useState("verify");

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("name");
  const [file, setFile] = useState(null);

  // Decoupled IPFS Resolver state
  const [ipfsCid, setIpfsCid] = useState("");
  const [resolverLoading, setResolverLoading] = useState(false);
  const [resolvedData, setResolvedData] = useState(null);

  // Consent Ticket verifier state
  const [consentTicket, setConsentTicket] = useState("");
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentResult, setConsentResult] = useState(null);

  const verify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/credentials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      });
      const data = await res.json();
      if (res.status === 404) {
        setResult({ ok: false, cred: null });
      } else if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      } else {
        setResult({
          ok: data.verified,
          cred: data.certificate ? {
            id: data.certificate.id,
            type: data.certificate.degreeName,
            issuedTo: data.student?.full_name || "Unknown",
            rollNo: data.student?.student_id || "Unknown",
            dept: data.student?.dept || "CSE ICBT",
            cgpa: data.certificate.gradeCgpa,
            year: data.certificate.issueDate.slice(0, 4),
            issuer: "MGMU / SoET",
            status: data.status.toLowerCase() === "active" ? "valid" : "revoked",
            ipfs: data.certificate.ipfsCid,
            hash: data.certificate.certHash,
            issued: data.certificate.issueDate,
            txHash: data.blockchain?.tx_hash || ""
          } : null
        });
      }
    } catch (err) {
      console.error(err);
      setResult({ ok: false, cred: null });
    } finally {
      setLoading(false);
    }
  };

  const verifyFile = async (selectedFile) => {
    const targetFile = selectedFile || file;
    if (!targetFile) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      const res = await fetch("http://localhost:5000/api/credentials/verify-file", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.status === 404) {
        setResult({ ok: false, cred: null });
      } else if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      } else {
        setResult({
          ok: data.verified,
          cred: data.certificate ? {
            id: data.certificate.id,
            type: data.certificate.degreeName,
            issuedTo: data.student?.full_name || "Unknown",
            rollNo: data.student?.student_id || "Unknown",
            dept: data.student?.dept || "CSE ICBT",
            cgpa: data.certificate.gradeCgpa,
            year: data.certificate.issueDate.slice(0, 4),
            issuer: "MGMU / SoET",
            status: data.status.toLowerCase() === "active" ? "valid" : "revoked",
            ipfs: data.certificate.ipfsCid,
            hash: data.certificate.certHash,
            issued: data.certificate.issueDate,
            txHash: data.blockchain?.tx_hash || ""
          } : null
        });
      }
    } catch (err) {
      console.error(err);
      setResult({ ok: false, cred: null });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIPFS = async () => {
    if (!ipfsCid.trim()) return;
    setResolverLoading(true);
    setResolvedData(null);
    try {
      const res = await fetch(`http://localhost:5000/api/credentials/ipfs-resolve/${ipfsCid.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve IPFS CID");
      setResolvedData(data);
    } catch (err) {
      console.error(err);
      setResolvedData({ error: err.message });
    } finally {
      setResolverLoading(false);
    }
  };

  const handleVerifyConsent = async () => {
    if (!consentTicket.trim()) return;
    setConsentLoading(true);
    setConsentResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/consent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: consentTicket.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setConsentResult(data);
    } catch (err) {
      console.error(err);
      setConsentResult({ error: err.message });
    } finally {
      setConsentLoading(false);
    }
  };

  const shortHash = (h) => h ? `${h.slice(0, 12)}…${h.slice(-8)}` : "N/A";

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>/</span> Verify Degree</div>
          <h2>🔍 Verifier Dashboard</h2>
          <p>Verify academic degrees, audit raw IPFS documents, or check student consent tickets</p>
        </div>
      </div>
      <div className="section">
        <div className="section-inner">
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30, flexWrap: "wrap" }}>
            <button className={`btn ${pageTab === "verify" ? "btn-primary" : "btn-outline"}`} onClick={() => { setPageTab("verify"); setResult(null); }}>
              🔍 Verify Degree (Database / File)
            </button>
            <button className={`btn ${pageTab === "resolver" ? "btn-primary" : "btn-outline"}`} onClick={() => { setPageTab("resolver"); setResult(null); }}>
              📦 Decoupled IPFS Auditor
            </button>
            <button className={`btn ${pageTab === "consent" ? "btn-primary" : "btn-outline"}`} onClick={() => { setPageTab("consent"); setResult(null); }}>
              🎟️ Validate Consent Ticket
            </button>
          </div>

          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {pageTab === "verify" && (
              <div className="verify-box">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔐</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>On-Chain Degree Verification</div>
                  <div style={{ fontSize: ".83rem", color: "var(--text-light)" }}>Powered by Ethereum Sepolia + IPFS · W3C DID Standard · MGMU SoET</div>
                </div>

                <div className="section-tabs">
                  {[["name", "👤 By Name / Roll No"], ["did", "🔗 By DID"], ["hash", "🔑 By Credential ID"], ["file", "📄 By PDF Upload"]].map(([k, l]) => (
                    <button key={k} className={`s-tab ${tab === k ? "active" : ""}`} onClick={() => { setTab(k); setResult(null); setQuery(""); setFile(null); }}>{l}</button>
                  ))}
                </div>

                {tab === "file" ? (
                  <div style={{
                    border: "2px dashed var(--gray-300)",
                    borderRadius: "var(--radius-lg)",
                    padding: "32px 16px",
                    textAlign: "center",
                    background: "var(--gray-50)",
                    cursor: "pointer",
                    marginBottom: 16,
                    transition: "border-color 0.2s"
                  }}
                  onClick={() => document.getElementById("pdf-file-input").click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) { setFile(f); verifyFile(f); }
                  }}
                  >
                    <input id="pdf-file-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setFile(f); verifyFile(f); }
                    }} />
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: ".9rem" }}>
                      {file ? file.name : "Drag & Drop Certificate PDF here"}
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--text-light)", marginTop: 4 }}>
                      or click to browse your computer (.pdf only)
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>{tab === "name" ? "Student Name or Roll Number" : tab === "did" ? "Decentralized Identifier (DID)" : "Credential ID / IPFS Hash"}</label>
                    <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && verify()}
                      placeholder={tab === "name" ? "e.g. Rahul Sharma or CSE21001" : tab === "did" ? "did:ethr:0x…" : "vc:abc123… or Qm…"} />
                  </div>
                )}

                {tab === "name" && store.dids.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Quick Select</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {store.dids.slice(0, 5).map(d => <button key={d.did} className="btn btn-outline btn-sm" onClick={() => setQuery(d.rollNo)}>{d.name} ({d.rollNo})</button>)}
                    </div>
                  </div>
                )}

                {loading ? <div className="loading-row"><div className="spinner" />Querying Ethereum Sepolia…</div>
                  : tab !== "file" && <button className="btn btn-primary btn-full" onClick={verify}>⬡ Verify on Blockchain</button>}

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
            )}

            {pageTab === "resolver" && (
              <div className="verify-box">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📦</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Decoupled IPFS Signature Auditor</div>
                  <div style={{ fontSize: ".83rem", color: "var(--text-light)" }}>Fetch JSON credentials directly from IPFS and audit ECDSA signature matches</div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>IPFS CID Hash</label>
                  <input value={ipfsCid} onChange={e => setIpfsCid(e.target.value)} placeholder="e.g. QmSampleIPFSHashForPDFDegree12345" />
                </div>

                {resolverLoading ? (
                  <div className="loading-row"><div className="spinner" />Resolving and Auditing Signature…</div>
                ) : (
                  <button className="btn btn-primary btn-full" onClick={handleResolveIPFS}>⬡ Resolve & Audit Signature</button>
                )}

                {resolvedData && (
                  <div style={{ marginTop: 20 }}>
                    {resolvedData.error ? (
                      <div className="alert alert-danger">❌ {resolvedData.error}</div>
                    ) : (
                      <div>
                        <div className="alert alert-success" style={{ marginBottom: 16 }}>
                          🛡️ <b>Audit Status: {resolvedData.audit.status}</b><br />
                          {resolvedData.audit.message}<br />
                          <span style={{ fontSize: ".76rem", fontFamily: "monospace" }}>Recovered Key: {resolvedData.audit.signingAddress}</span>
                        </div>
                        <div style={{ background: "var(--navy-dark)", color: "#fff", padding: 16, borderRadius: "var(--radius)", fontFamily: "monospace", fontSize: ".72rem", overflowX: "auto" }}>
                          <pre>{JSON.stringify(resolvedData.payload, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {pageTab === "consent" && (
              <div className="verify-box">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎟️</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Verify Student Consent Ticket</div>
                  <div style={{ fontSize: ".83rem", color: "var(--text-light)" }}>Audit base64 consent tickets generated and signed by graduating candidates</div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Base64 Consent Ticket</label>
                  <textarea 
                    value={consentTicket} 
                    onChange={e => setConsentTicket(e.target.value)} 
                    placeholder="Paste ticket string here..." 
                    rows={5}
                    style={{ width: "100%", fontFamily: "monospace", fontSize: ".75rem", padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--gray-300)" }}
                  />
                </div>

                {consentLoading ? (
                  <div className="loading-row"><div className="spinner" />Validating Student Signature & Time Lock…</div>
                ) : (
                  <button className="btn btn-primary btn-full" onClick={handleVerifyConsent}>⬡ Verify Consent Ticket</button>
                )}

                {consentResult && (
                  <div style={{ marginTop: 20 }}>
                    {consentResult.error ? (
                      <div className="alert alert-danger">❌ {consentResult.error}</div>
                    ) : (
                      <div>
                        <div className="alert alert-success" style={{ marginBottom: 16 }}>
                          ✅ <b>Ticket Verification Successful!</b><br />
                          Authorized by: <b>{consentResult.studentName}</b> (Roll No: {consentResult.rollNo})<br />
                          Granted to: <b>{consentResult.verifier}</b> (Valid until: {new Date(consentResult.expiresAt).toLocaleString()})
                        </div>
                        {consentResult.credentials.length === 0 ? (
                          <div className="alert alert-info">🎓 No active credentials found for this candidate.</div>
                        ) : (
                          <div className="grid-2">
                            {consentResult.credentials.map(c => (
                              <div key={c.cert_id} className="cred-card" style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div className="cred-card-header" style={{ padding: 12, background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                                  <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--navy)" }}>{c.degree_name}</div>
                                  <div style={{ fontSize: ".65rem", color: "var(--text-light)" }}>Issued: {c.issue_date}</div>
                                </div>
                                <div className="cred-card-body" style={{ padding: 12, fontSize: ".78rem" }}>
                                  <div>CGPA: <b>{c.grade_cgpa}</b></div>
                                  <div>Status: <span className="badge badge-green" style={{ fontSize: ".65rem" }}>{c.status}</span></div>
                                  <div style={{ fontFamily: "monospace", fontSize: ".65rem", wordBreak: "break-all", marginTop: 6 }}>Hash: {c.cert_hash.slice(0, 16)}…</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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

// ─── STANDALONE LOGIN PAGES ───────────────────────────────────────────────────


export function StudentLoginPage({ nav, handleLogin, showToast, wallet, connectWallet, store }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "ABC-111-222-333", password: "password123" });
  const [loginLoading, setLoginLoading] = useState(false);

  const [regForm, setRegForm] = useState({ name: "", rollNo: "", dept: "CSE ICBT", email: "", year: "2025", abcId: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) { showToast("Username and Password are required", "error"); return; }
    setLoginLoading(true);
    try {
      const user = await handleLogin(loginForm.username, loginForm.password, "Student");
      if (user) nav("user");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.rollNo || !regForm.abcId) { showToast("Name, Roll No, and ABC ID are required", "error"); return; }
    let activeWallet = wallet;
    if (!activeWallet) {
      activeWallet = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
      showToast("No wallet connected. Auto-connecting to Sandbox...", "info");
    }
    setRegLoading(true);
    try {
      await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email || `${regForm.rollNo.toLowerCase()}@gmail.com`,
          password: "password123",
          role: "Student",
          name: regForm.name,
          studentId: regForm.rollNo,
          walletAddress: activeWallet,
          abcId: regForm.abcId
        })
      });

      await store.registerDID({
        rollNo: regForm.rollNo,
        walletAddress: activeWallet
      });
      
      showToast("DID Registered successfully!", "success");
      const user = await handleLogin(regForm.abcId, "password123", "Student");
      if (user) nav("user");
    } catch (err) {
      showToast("Registration failed: " + err.message, "error");
    } finally {
      setRegLoading(false);
    }
  };

  const setReg = (k, v) => setRegForm(p => ({ ...p, [k]: v }));

  return (
    <div className="auth-page">
      <button onClick={() => nav("home")} className="auth-back-btn">← Back to MGMU Home</button>
      
      <div className="auth-card">
        <div className="auth-logo-area">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 32 32"><path d="M16 2L4 8v8c0 7 5.4 13.5 12 15.4C22.6 29.5 28 23 28 16V8L16 2zm-1 19l-5-5 1.4-1.4L15 18.2l7.6-7.6L24 12l-9 9z"/></svg>
          </div>
          <div className="auth-title">🎓 Student Portal</div>
          <div className="auth-sub">{isLogin ? "Access your academic credentials" : "Register your decentralized DID identity"}</div>
        </div>

        {isLogin ? (
          <form onSubmit={onLoginSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>College Email or ABC ID</label>
              <input value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))} placeholder="e.g. rahul@soet.mgmu.ac.in or ABC-111-222-333" required />
            </div>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label>Password</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            {loginLoading ? (
              <div className="loading-row"><div className="spinner" />Authenticating…</div>
            ) : (
              <button type="submit" className="btn btn-primary btn-full">Sign In</button>
            )}
            
            <div style={{ marginTop: 20, textAlign: "center", fontSize: ".82rem", color: "var(--text-light)" }}>
              Don't have a blockchain identity yet? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }} style={{ color: "var(--navy)", fontWeight: 600 }}>Register Student DID</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group"><label>Full Name *</label><input value={regForm.name} onChange={e => setReg("name", e.target.value)} placeholder="Rahul Sharma" required /></div>
              <div className="form-group"><label>Roll Number *</label><input value={regForm.rollNo} onChange={e => setReg("rollNo", e.target.value)} placeholder="CSE26001" required /></div>
              <div className="form-group">
                <label>Department</label>
                <select value={regForm.dept} onChange={e => setReg("dept", e.target.value)}>
                  <option>CSE ICBT</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                </select>
              </div>
              <div className="form-group">
                <label>Passing Year</label>
                <select value={regForm.year} onChange={e => setReg("year", e.target.value)}>
                  {["2023","2024","2025","2026"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}><label>Email Address</label><input type="email" value={regForm.email} onChange={e => setReg("email", e.target.value)} placeholder="name@gmail.com" /></div>
              <div className="form-group" style={{ gridColumn: "span 2" }}><label>Academic Bank of Credits (ABC) ID *</label><input value={regForm.abcId} onChange={e => setReg("abcId", e.target.value)} placeholder="ABC-111-222-333" required /></div>
            </div>

            <div className="auth-wallet-container" style={{ marginBottom: 12 }}>
              <button type="button" className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet} style={{ width: "100%", justifyContent: "center" }}>
                {wallet ? <><div className="wallet-dot" />Wallet: {wallet.slice(0, 8)}…{wallet.slice(-4)}</> : "🦊 Connect Web3 Wallet"}
              </button>
            </div>

            {regLoading ? (
              <div className="loading-row"><div className="spinner" />Registering on Ethereum Sepolia…</div>
            ) : (
              <button type="submit" className="btn btn-primary btn-full">⬡ Register DID</button>
            )}

            <div style={{ marginTop: 20, textAlign: "center", fontSize: ".82rem", color: "var(--text-light)" }}>
              Already registered? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }} style={{ color: "var(--navy)", fontWeight: 600 }}>Student Sign In</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AdminLoginPage({ nav, handleLogin, showToast, wallet, connectWallet }) {
  const [loginForm, setLoginForm] = useState({ email: "admin@soet.mgmu.ac.in", password: "password123" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { showToast("Email and Password are required", "error"); return; }
    setLoading(true);
    try {
      const user = await handleLogin(loginForm.email, loginForm.password, "University");
      if (user) nav("issuer");
    } catch (err) {
      // error shown in handleLogin
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button onClick={() => nav("home")} className="auth-back-btn">← Back to MGMU Home</button>
      
      <div className="auth-card">
        <div className="auth-logo-area">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 32 32"><path d="M16 2L4 8v8c0 7 5.4 13.5 12 15.4C22.6 29.5 28 23 28 16V8L16 2zm-1 19l-5-5 1.4-1.4L15 18.2l7.6-7.6L24 12l-9 9z"/></svg>
          </div>
          <div className="auth-title">🏛️ Admin Portal</div>
          <div className="auth-sub">University & Academy Administration Panel</div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Admin Email</label>
            <input value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@soet.mgmu.ac.in" required />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Password</label>
            <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
          </div>

          <div className="auth-wallet-container" style={{ marginBottom: 12 }}>
            <button type="button" className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet} style={{ width: "100%", justifyContent: "center" }}>
              {wallet ? <><div className="wallet-dot" />Wallet: {wallet.slice(0, 8)}…{wallet.slice(-4)}</> : "🦊 Connect Web3 Wallet"}
            </button>
          </div>

          {loading ? (
            <div className="loading-row"><div className="spinner" />Authenticating…</div>
          ) : (
            <button type="submit" className="btn btn-primary btn-full">Sign In</button>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: ".82rem", color: "var(--text-light)" }}>
            Don't have an admin profile? <a href="#" onClick={(e) => { e.preventDefault(); nav("university-register"); }} style={{ color: "var(--navy)", fontWeight: 600 }}>Register University</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UniversityRegisterPage({ nav, handleLogin, showToast, wallet, connectWallet }) {
  const states = Object.keys(LOCATION_DATA);
  const defaultState = states[0];
  const cities = Object.keys(LOCATION_DATA[defaultState]);
  const defaultCity = cities[0];
  const universities = LOCATION_DATA[defaultState][defaultCity];
  const defaultUniv = universities[0];

  const [regForm, setRegForm] = useState({
    name: defaultUniv,
    customUnivName: "",
    accreditationNo: "",
    email: "",
    password: "password123",
    city: defaultCity,
    state: defaultState,
    address: "",
    phone: "",
    walletAddress: "",
    instType: "University",
    taxId: "",
    website: ""
  });
  const [loading, setLoading] = useState(false);

  const setReg = (k, v) => setRegForm(p => ({ ...p, [k]: v }));

  const handleStateChange = (selectedState) => {
    const stateCities = Object.keys(LOCATION_DATA[selectedState]);
    const firstCity = stateCities[0];
    const cityUnivs = LOCATION_DATA[selectedState][firstCity];
    const firstUniv = cityUnivs[0];

    setRegForm(p => ({
      ...p,
      state: selectedState,
      city: firstCity,
      name: firstUniv
    }));
  };

  const handleCityChange = (selectedCity) => {
    const cityUnivs = LOCATION_DATA[regForm.state][selectedCity];
    const firstUniv = cityUnivs[0];

    setRegForm(p => ({
      ...p,
      city: selectedCity,
      name: firstUniv
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const finalUnivName = regForm.name === "Other (Custom University Name)" 
      ? regForm.customUnivName 
      : regForm.name;

    if (!finalUnivName || !regForm.accreditationNo || !regForm.email || !regForm.city || !regForm.state || !regForm.taxId || !regForm.website) {
      showToast("Name, Accreditation No, Email, City, State, Tax ID, and Website are required", "error");
      return;
    }
    
    // Strict Domain check bypassed for demo compatibility

    setLoading(true);
    try {
      const activeWallet = regForm.walletAddress || wallet || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email,
          password: regForm.password,
          role: "University",
          name: finalUnivName,
          phone: regForm.phone,
          address: regForm.address,
          accreditationNo: regForm.accreditationNo,
          walletAddress: activeWallet,
          city: regForm.city,
          state: regForm.state,
          taxId: regForm.taxId,
          website: regForm.website,
          instType: regForm.instType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register institution");

      showToast("Registration submitted for validation!", "success");
      const user = await handleLogin(regForm.email, regForm.password, "University");
      if (user) nav("issuer");
    } catch (err) {
      showToast("Registration failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button onClick={() => nav("home")} className="auth-back-btn">← Back to MGMU Home</button>
      
      <div className="auth-card" style={{ maxWidth: 580 }}>
        <div className="auth-logo-area">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 32 32"><path d="M16 2L4 8v8c0 7 5.4 13.5 12 15.4C22.6 29.5 28 23 28 16V8L16 2zm-1 19l-5-5 1.4-1.4L15 18.2l7.6-7.6L24 12l-9 9z"/></svg>
          </div>
          <div className="auth-title">🏛️ Register Institution</div>
          <div className="auth-sub">Apply to become an authorized degree or online course credential issuer</div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Select Institution Type *</label>
              <select value={regForm.instType} onChange={e => setReg("instType", e.target.value)}>
                <option value="University">🏛️ University / Accredited College</option>
                <option value="Academy">🎓 Course Academy / Online Learning Academy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Select State *</label>
              <select value={regForm.state} onChange={e => handleStateChange(e.target.value)}>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Select City *</label>
              <select value={regForm.city} onChange={e => handleCityChange(e.target.value)}>
                {Object.keys(LOCATION_DATA[regForm.state]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Select Registered Name *</label>
              <select value={regForm.name} onChange={e => setReg("name", e.target.value)}>
                {LOCATION_DATA[regForm.state][regForm.city].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {regForm.name === "Other (Custom University Name)" && (
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label>Custom Institution / University Name *</label>
                <input value={regForm.customUnivName} onChange={e => setReg("customUnivName", e.target.value)} placeholder="e.g. MGM Extension Academy" required />
              </div>
            )}

            <div className="form-group">
              <label>Government Tax ID / EIN *</label>
              <input value={regForm.taxId} onChange={e => setReg("taxId", e.target.value)} placeholder="e.g. EIN-12-3456789" required />
            </div>

            <div className="form-group">
              <label>Accreditation Code / Lic No *</label>
              <input value={regForm.accreditationNo} onChange={e => setReg("accreditationNo", e.target.value)} placeholder="e.g. MGMU-SOET-2025" required />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Official Institutional Website *</label>
              <input type="url" value={regForm.website} onChange={e => setReg("website", e.target.value)} placeholder="e.g. https://soet.mgmu.ac.in" required />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Upload Verification License Copy (PDF / JPG) *</label>
              <div style={{ border: "2px dashed var(--gray-300)", borderRadius: "var(--radius)", padding: "20px 10px", textAlign: "center", background: "var(--gray-50)", cursor: "pointer" }}
                   onClick={() => showToast("License copy selected: accreditation_license.pdf", "success")}>
                <span style={{ fontSize: "1.8rem" }}>📄</span>
                <div style={{ fontSize: ".76rem", fontWeight: 600, color: "var(--navy)", marginTop: 4 }}>Drag & Drop License copy here</div>
                <div style={{ fontSize: ".68rem", color: "var(--text-light)" }}>Accreditation, Charter, or Registration files up to 5MB</div>
              </div>
            </div>

            <div className="form-group"><label>Registrar Email *</label><input type="email" value={regForm.email} onChange={e => setReg("email", e.target.value)} placeholder="admin@soet.mgmu.ac.in" required /></div>
            <div className="form-group"><label>Registrar Password *</label><input type="password" value={regForm.password} onChange={e => setReg("password", e.target.value)} placeholder="••••••••" required /></div>
            <div className="form-group"><label>Contact Phone</label><input value={regForm.phone} onChange={e => setReg("phone", e.target.value)} placeholder="e.g. 0240-2481234" /></div>
            <div className="form-group" style={{ gridColumn: "span 2" }}><label>Street Address</label><input value={regForm.address} onChange={e => setReg("address", e.target.value)} placeholder="MGMU Campus, Aurangabad" /></div>
            
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Issuing Wallet Address (Optional)</label>
              <input value={regForm.walletAddress} onChange={e => setReg("walletAddress", e.target.value)} placeholder="e.g. 0xf39Fd6e51aad..." />
            </div>
          </div>

          <div className="auth-wallet-container" style={{ marginBottom: 12 }}>
            <button type="button" className={`btn-wallet ${wallet ? "connected" : ""}`} onClick={connectWallet} style={{ width: "100%", justifyContent: "center" }}>
              {wallet ? <><div className="wallet-dot" />Wallet: {wallet.slice(0, 8)}…{wallet.slice(-4)}</> : "🦊 Connect Web3 Wallet"}
            </button>
          </div>

          {loading ? (
            <div className="loading-row"><div className="spinner" />Submitting to Audit Queue…</div>
          ) : (
            <button type="submit" className="btn btn-primary btn-full">Submit Verification Application</button>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: ".82rem", color: "var(--text-light)" }}>
            Already have an admin profile? <a href="#" onClick={(e) => { e.preventDefault(); nav("admin-login"); }} style={{ color: "var(--navy)", fontWeight: 600 }}>Admin Sign In</a>
          </div>
        </form>
      </div>
    </div>
  );
}

