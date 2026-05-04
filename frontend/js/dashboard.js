// js/dashboard.js — utilidades compartidas y arranque del dashboard

function cerrarSesion() {
localStorage.clear();
window.location.href = 'index.html';
}

/* ---- Petición con auth ---- */
async function apiFetch(endpoint, options = {}) {
const res = await fetch(API + endpoint, {
    ...options,
    headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    ...(options.headers || {})
    }
});
if (res.status === 401) { cerrarSesion(); return; }
return res;
}

/* ---- Alertas ---- */
function showAlert(msg, tipo = 'success') {
const b = document.getElementById('alert-box');
b.className = 'alert alert-' + tipo;
b.textContent = msg;
b.style.display = 'block';
clearTimeout(b._t);
b._t = setTimeout(() => b.style.display = 'none', 4500);
}

/* ---- Modales ---- */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ---- Navegación ---- */
function showTab(tab, btn) {
document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
document.getElementById('sec-' + tab).classList.add('active');
if (btn) btn.classList.add('active');
if (tab === 'inicio')       cargarInicio();
if (tab === 'activos')      cargarActivos();
if (tab === 'devoluciones') cargarDevoluciones();
if (tab === 'inventario')   cargarInventario();
if (tab === 'prestamo')     cargarSelectArticulos();
}

/* ---- Formateador de fecha ---- */
function fmt(f) {
if (!f) return '—';
const d = new Date(f);
return d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
}

/* ---- Badges ---- */
function badgeEstado(e) {
const cls = e === 'Bueno' ? 'badge-ok' : e === 'Regular' ? 'badge-warn' : 'badge-bad';
return `<span class="badge ${cls}">${e}</span>`;
}
function badgeCompleto(c) {
if (!c || c === 'N/A') return '';
return `<span class="badge ${c === 'Completo' ? 'badge-ok' : 'badge-warn'}">${c}</span>`;
}








