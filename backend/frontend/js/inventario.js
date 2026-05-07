// js/inventario.js
let _inventario = [];

async function cargarInventario() {
const res  = await apiFetch('/inventario');
_inventario = await res.json();
renderInventario();
}

function renderInventario() {
const q     = (document.getElementById('buscar-inv')?.value || '').toLowerCase();
const lista = _inventario.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.categoria.toLowerCase().includes(q)
);
const c = document.getElementById('lista-inventario');
if (lista.length === 0) {
    c.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div>Sin artículos registrados</div>';
    return;
}
c.innerHTML = lista.map(a => `
    <div class="item-row">
    <div style="flex:1;min-width:0;">
        <div class="item-name">${a.nombre}</div>
        <div class="item-sub">${a.categoria}${a.serie ? ' · ' + a.serie : ''}</div>
        ${a.descripcion ? `<div class="item-sub">${a.descripcion}</div>` : ''}
    </div>
    <div class="item-actions">
        <span class="qty-badge">${a.disponible}/${a.cantidad}</span>
        <span class="badge ${a.disponible === 0 ? 'badge-bad' : a.disponible < a.cantidad ? 'badge-warn' : 'badge-ok'}">
        ${a.disponible === 0 ? 'Agotado' : a.disponible < a.cantidad ? 'Parcial' : 'Disponible'}
        </span>
    </div>
    </div>`).join('');
}

async function agregarArticulo() {
const nombre = document.getElementById('inv-nombre').value.trim();
if (!nombre) { showAlert('⚠️ Ingresa el nombre del artículo', 'error'); return; }

const body = {
    nombre,
    categoria:   document.getElementById('inv-cat').value,
    cantidad:    parseInt(document.getElementById('inv-cant').value) || 1,
    serie:       document.getElementById('inv-serie').value.trim(),
    descripcion: document.getElementById('inv-desc').value.trim(),
    es_kit:      document.getElementById('inv-cat').value === 'Kit'
};

const res  = await apiFetch('/inventario', { method: 'POST', body: JSON.stringify(body) });
const data = await res.json();

if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }

closeModal('modal-agregar');
showAlert('✅ "' + nombre + '" agregado al inventario');
await cargarInventario();
cargarInicio();
}

async function cargarInicio() {
const res  = await apiFetch('/inventario');
const inv  = await res.json();
_inventario = inv;

document.getElementById('stat-total').textContent       = inv.length;
document.getElementById('stat-disponibles').textContent = inv.reduce((s, a) => s + a.disponible, 0);

const sb    = document.getElementById('stock-bajo');
const bajos = inv.filter(a => a.disponible < Math.ceil(a.cantidad / 2) && a.cantidad > 1);
sb.innerHTML = bajos.length === 0
    ? '<div class="empty-state">✅ Sin alertas de stock</div>'
    : bajos.map(a => `
        <div class="item-row">
        <div><div class="item-name">${a.nombre}</div><div class="item-sub">${a.categoria}</div></div>
        <span class="badge badge-warn">${a.disponible}/${a.cantidad} disponible${a.disponible !== 1 ? 's' : ''}</span>
        </div>`).join('');

const res2 = await apiFetch('/prestamos');
const prs  = await res2.json();
document.getElementById('stat-prestados').textContent = prs.length;

const um = document.getElementById('ultimos-mov');
um.innerHTML = prs.length === 0
    ? '<div class="empty-state">🕐 Sin movimientos recientes</div>'
    : prs.slice(0, 6).map(p => `
        <div class="item-row">
        <div>
            <div class="item-name">${p.articulo_nombre}</div>
            <div class="item-sub">${p.nombre_solicitante} · ${p.tipo_persona} · ${fmt(p.fecha_prestamo)}</div>
        </div>
        <span class="badge badge-out">Prestado</span>
        </div>`).join('');
}


async function importarDesdeSheets() {
if (!confirm('¿Importar inventario desde Google Sheets? Los artículos existentes se actualizarán.')) return;

showAlert('⏳ Importando desde Google Sheets...', 'success');

const res  = await apiFetch('/importar', { method: 'POST' });
const data = await res.json();

if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }

showAlert('✅ ' + data.mensaje);
await cargarInventario();
cargarInicio();
}




