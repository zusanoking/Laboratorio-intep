// js/prestamos.js
let _activos = [];
let _carrito = []; // artículos seleccionados para el préstamo actual

async function cargarSelectArticulos() {
  const res  = await apiFetch('/inventario/disponibles');
  const arts = await res.json();
  const sel  = document.getElementById('p-articulo');
  sel.innerHTML = '<option value="">— Seleccionar artículo —</option>';
  arts.forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.dataset.cantidad   = a.cantidad;
    o.dataset.disponible = a.disponible;
    o.dataset.esKit      = a.es_kit;
    o.dataset.cat        = a.categoria;
    o.dataset.desc       = a.descripcion || '';
    o.dataset.nombre     = a.nombre;
    o.textContent = a.nombre + ' (disp: ' + a.disponible + ')';
    sel.appendChild(o);
  });
  renderCarrito();
}

function actualizarArticulo() {
  const sel  = document.getElementById('p-articulo');
  const opt  = sel.options[sel.selectedIndex];
  const info = document.getElementById('p-art-info');
  if (!sel.value) { info.style.display = 'none'; return; }
  info.style.display = 'block';
  document.getElementById('p-art-nombre').textContent = opt.dataset.nombre;
  document.getElementById('p-art-cat').textContent    = opt.dataset.cat;
  document.getElementById('p-art-desc').textContent   = opt.dataset.desc;
  const disp = parseInt(opt.dataset.disponible);
  const dispEl = document.getElementById('p-art-disp');
  dispEl.className = 'badge badge-in';
  dispEl.textContent = disp + ' disponible' + (disp !== 1 ? 's' : '');
  document.getElementById('p-art-total').textContent = 'Total: ' + opt.dataset.cantidad;
  const cantRow = document.getElementById('p-cant-row');
  cantRow.style.display = parseInt(opt.dataset.cantidad) > 1 ? 'block' : 'none';
  document.getElementById('p-cantidad').max   = disp;
  document.getElementById('p-cantidad').value = 1;
  document.getElementById('p-completo-row').style.display = opt.dataset.esKit == '1' ? 'block' : 'none';
}

function agregarAlCarrito() {
  const sel   = document.getElementById('p-articulo');
  const opt   = sel.options[sel.selectedIndex];
  if (!sel.value) { showAlert('⚠️ Selecciona un artículo', 'error'); return; }

  const esKit   = opt.dataset.esKit == '1';
  const cant    = parseInt(opt.dataset.cantidad) > 1 ? parseInt(document.getElementById('p-cantidad').value) : 1;
  const disp    = parseInt(opt.dataset.disponible);

  if (cant > disp) { showAlert('⚠️ No hay suficiente stock', 'error'); return; }

  // Verificar que no esté ya en el carrito
  if (_carrito.find(x => x.articulo_id == sel.value)) {
    showAlert('⚠️ Ese artículo ya está en la lista', 'error'); return;
  }

  const MAX_ARTICULOS = 5;        // ponemos una restricion de prestar un maximo de 5 articulos 

  if (_carrito.length >= MAX_ARTICULOS) {
    showAlert(
      `⚠️ Solo se permiten ${MAX_ARTICULOS} artículos por préstamo`,
      'error'
    );
    return;
  }

  _carrito.push({
    articulo_id:    parseInt(sel.value),
    nombre:         opt.dataset.nombre,
    cantidad:       cant,
    estado_salida:  document.getElementById('p-estado').value,
    completo_salida: esKit ? document.getElementById('p-completo').value : 'N/A',
    observaciones:  document.getElementById('p-obs').value.trim(),
    esKit
  });

  // Limpiar selector
  sel.value = '';
  document.getElementById('p-art-info').style.display     = 'none';
  document.getElementById('p-cant-row').style.display     = 'none';
  document.getElementById('p-completo-row').style.display = 'none';
  document.getElementById('p-obs').value = '';

  renderCarrito();
  showAlert('✅ Artículo agregado a la lista');
}

function renderCarrito() {
  const c = document.getElementById('carrito-lista');
  if (!c) return;
  if (_carrito.length === 0) {
    c.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:10px 0;">Sin artículos agregados aún</div>';
    return;
  }
  c.innerHTML = _carrito.map((item, i) => `
    <div class="item-row">
      <div>
        <div class="item-name">${item.nombre} ${item.cantidad > 1 ? '(x' + item.cantidad + ')' : ''}</div>
        <div class="item-sub">Estado: ${item.estado_salida} ${item.esKit ? '· ' + item.completo_salida : ''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="quitarDelCarrito(${i})">✕</button>
    </div>`).join('');
}

function quitarDelCarrito(i) {
  _carrito.splice(i, 1);
  renderCarrito();
}

async function registrarPrestamo() {
  const nombre = document.getElementById('p-nombre').value.trim();
  if (!nombre) { showAlert('⚠️ Ingresa el nombre de quien solicita', 'error'); return; }
  if (_carrito.length === 0) { showAlert('⚠️ Agrega al menos un artículo', 'error'); return; }

  const body = {
    nombre_solicitante: nombre,
    tipo_persona:       document.getElementById('p-tipo').value,
    identificacion:     document.getElementById('p-id').value.trim(),
    programa:           document.getElementById('p-programa').value.trim(),
    articulos:          _carrito
  };

  const res  = await apiFetch('/prestamos', { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }

  // Limpiar todo
  ['p-nombre','p-id','p-programa'].forEach(x => document.getElementById(x).value = '');
  _carrito = [];
  renderCarrito();
  document.getElementById('p-articulo').value = '';
  document.getElementById('p-art-info').style.display     = 'none';
  document.getElementById('p-cant-row').style.display     = 'none';
  document.getElementById('p-completo-row').style.display = 'none';

  showAlert('✅ Préstamo registrado correctamente — ' + body.articulos.length + ' artículo(s)');
  await cargarSelectArticulos();
  cargarInicio();
}

async function cargarActivos() {
  const res = await apiFetch('/prestamos');
  _activos  = await res.json();
  renderActivos();
}

function renderActivos() {
  const q     = (document.getElementById('buscar-activos')?.value || '').toLowerCase();
  const lista = _activos.filter(p =>
    p.nombre_solicitante.toLowerCase().includes(q) ||
    (p.detalles && p.detalles.some(d => d.articulo_nombre.toLowerCase().includes(q)))
  );
  const c = document.getElementById('lista-activos');
  if (lista.length === 0) {
    c.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>No hay préstamos activos</div>';
    return;
  }
  c.innerHTML = lista.map(p => `
    <div class="loan-card">
      <div class="loan-header">
        <div>
          <div class="loan-person">
            ${p.nombre_solicitante}
            <span class="badge ${p.tipo_persona === 'Docente' ? 'badge-doc' : 'badge-ok'}" style="margin-left:6px;">${p.tipo_persona}</span>
          </div>
          ${p.identificacion ? `<div class="loan-detail">🪪 ${p.identificacion}</div>` : ''}
          ${p.programa       ? `<div class="loan-detail">📚 ${p.programa}</div>` : ''}
        </div>
        <div style="font-size:11px;color:#94a3b8;">${fmt(p.fecha_prestamo)}</div>
      </div>
      <div class="loan-body">
        ${p.detalles.map(d => `
          <div class="item-row">
            <div>
              <div class="item-name">${d.articulo_nombre}${d.cantidad > 1 ? ' (x' + d.cantidad + ')' : ''}</div>
              <div class="item-sub">${d.categoria} · ${badgeEstado(d.estado_salida)} ${badgeCompleto(d.completo_salida)}</div>
            </div>
            <button class="btn btn-success btn-sm" onclick="openModalDevolucion(${d.detalle_id}, ${d.es_kit})">📥 Devolver</button>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

let _devDetalleId = null;
let _devEsKit     = false;

function openModalDevolucion(detalleId, esKit) {
  _devDetalleId = detalleId;
  _devEsKit     = esKit == 1 || esKit === true;
  const p = _activos.find(x => x.detalles.some(d => d.detalle_id === detalleId));
  const d = p?.detalles.find(d => d.detalle_id === detalleId);
  document.getElementById('modal-dev-info').innerHTML =
    `<strong>${d?.articulo_nombre}</strong>${d?.cantidad > 1 ? ' (x' + d.cantidad + ')' : ''}<br>
    Prestado a <strong>${p?.nombre_solicitante}</strong> el ${fmt(p?.fecha_prestamo)}`;
  document.getElementById('dev-completo-row').style.display = _devEsKit ? 'block' : 'none';
  document.getElementById('dev-obs').value    = '';
  document.getElementById('dev-estado').value = 'Bueno';
  openModal('modal-devolucion');
}

async function confirmarDevolucion() {
  const body = {
    estado_retorno:   document.getElementById('dev-estado').value,
    completo_retorno: _devEsKit ? document.getElementById('dev-completo').value : 'N/A',
    observaciones:    document.getElementById('dev-obs').value.trim()
  };
  const res  = await apiFetch('/devoluciones/' + _devDetalleId, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }
  closeModal('modal-devolucion');
  showAlert('✅ Devolución registrada correctamente');
  await cargarActivos();
  cargarInicio();
}

