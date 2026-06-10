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
    c.innerHTML = '<div class="empty-state"><span class="empty-icon">📦</span>Sin artículos registrados</div>';
    return;
}
c.innerHTML = `
    <table class="inv-table">
    <thead>
        <tr>
        <th>ARTÍCULO</th>
        <th>CATEGORÍA</th>
        <th>CANTIDAD</th>
        <th>ESTADO</th>
        <th>ACCIONES</th>
        </tr>
    </thead>
    <tbody>
        ${lista.map(a => `
        <tr>
            <td>
            <div class="inv-item">
                <div class="inv-icon">🗂️</div>
                <div>
                <div class="item-name">${a.nombre}</div>
                ${a.serie ? `<div class="item-sub">${a.serie}</div>` : ''}
                </div>
            </div>
            </td>
            <td><span class="cat-badge">${a.categoria}</span></td>
            <td><strong>${a.cantidad}</strong></td>
            <td>
            <span class="disp-badge ${a.disponible === 0 ? 'disp-rojo' : a.disponible < a.cantidad ? 'disp-naranja' : 'disp-verde'}">
                ${a.disponible === 0 ? 'Sin stock' : a.disponible + ' disponible' + (a.disponible !== 1 ? 's' : '')}
            </span>
            </td>
            <td>
            <div style="display:flex;gap:6px;justify-content:center;">
                <button onclick="abrirEditar(${a.id},'${a.nombre.replace(/'/g,"\\'")}','${a.categoria}','${(a.serie||'').replace(/'/g,"\\'")}','${(a.descripcion||'').replace(/'/g,"\\'")}','${a.cantidad}')" 
                class="btn btn-primary btn-sm" title="Editar">
                ✏️
                </button>
                <button onclick="confirmarEliminar(${a.id},'${a.nombre.replace(/'/g,"\\'")}','${a.disponible}','${a.cantidad}')" 
                class="btn btn-danger btn-sm" title="Eliminar">
                🗑️
                </button>
            </div>
            </td>
        </tr>`).join('')}
    </tbody>
    </table>`;
}

// ---- EDITAR ARTÍCULO ----
function abrirEditar(id, nombre, categoria, serie, descripcion, cantidad) {
document.getElementById('edit-id').value       = id;
document.getElementById('edit-nombre').value   = nombre;
document.getElementById('edit-cat').value      = categoria;
document.getElementById('edit-serie').value    = serie;
document.getElementById('edit-desc').value     = descripcion;
document.getElementById('edit-cantidad').value = cantidad;
openModal('modal-editar');
}

async function guardarEdicion() {
const id     = document.getElementById('edit-id').value;
const nombre = document.getElementById('edit-nombre').value.trim();
if (!nombre) { showAlert('⚠️ Ingresa el nombre', 'error'); return; }

const body = {
    nombre,
    categoria:   document.getElementById('edit-cat').value,
    serie:       document.getElementById('edit-serie').value.trim(),
    descripcion: document.getElementById('edit-desc').value.trim(),
};

const res  = await apiFetch(`/inventario/${id}`, { method: 'PUT', body: JSON.stringify(body) });
const data = await res.json();
if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }

closeModal('modal-editar');
showAlert('✅ Artículo actualizado');
await cargarInventario();
cargarInicio();
}

// ---- ELIMINAR ARTÍCULO ----
function confirmarEliminar(id, nombre, disponible, cantidad) {
document.getElementById('del-id').value     = id;
document.getElementById('del-nombre').textContent = nombre;
document.getElementById('del-info').textContent   = `${disponible}/${cantidad} unidades disponibles`;
openModal('modal-eliminar');
}

async function ejecutarEliminar() {
const id = document.getElementById('del-id').value;
const res  = await apiFetch(`/inventario/${id}`, { method: 'DELETE' });
const data = await res.json();
if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }
closeModal('modal-eliminar');
showAlert('🗑️ Artículo eliminado');
await cargarInventario();
cargarInicio();
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
  // Cargar inventario
const res  = await apiFetch('/inventario');
const inv  = await res.json();
_inventario = inv;

document.getElementById('stat-total').textContent       = inv.length;
document.getElementById('stat-disponibles').textContent = inv.reduce((s, a) => s + a.disponible, 0);

  // Stock bajo
const sb    = document.getElementById('stock-bajo');
const bajos = inv.filter(a => a.disponible < Math.ceil(a.cantidad / 2) && a.cantidad > 1);
sb.innerHTML = bajos.length === 0
    ? '<div class="empty-state">✅ Sin alertas de stock</div>'
    : bajos.map(a => `
        <div class="stock-row">
        <div>
            <div class="stock-nombre">${a.nombre}</div>
            <div class="stock-cat">${a.categoria}</div>
        </div>
        <div class="stock-cant">${a.disponible}/${a.cantidad} disponibles</div>
        </div>`).join('');

  // Préstamos activos
const res2 = await apiFetch('/prestamos');
const prs  = await res2.json();
document.getElementById('stat-prestados').textContent = prs.length;

  // Últimos movimientos
const um = document.getElementById('ultimos-mov');
um.innerHTML = prs.length === 0
    ? '<div class="empty-state"><span class="empty-icon">🕐</span>Sin movimientos recientes</div>'
    : prs.slice(0, 5).map(p => {
        const cant = p.detalles ? p.detalles.reduce((s, d) => s + d.cantidad, 0) : 1;
        return `
        <div class="mov-row">
            <div class="mov-icon-wrap prestado">📉</div>
            <div class="mov-info">
            <div class="mov-nombre">${p.nombre_solicitante}</div>
            <div class="mov-detalle">${p.detalles?.[0]?.articulo_nombre || ''} • ${fmt(p.fecha_prestamo)}</div>
            </div>
            <div class="mov-cant menos">-${cant}</div>
        </div>`;
    }).join('');
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

cargarInicio();