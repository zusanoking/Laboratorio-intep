// js/prestamos.js
let _activos = [];

async function cargarSelectArticulos() {
  const res  = await apiFetch('/inventario/disponibles');
  const arts = await res.json();
  const sel  = document.getElementById('p-articulo');
  sel.innerHTML = '<option value="">— Seleccionar —</option>';
  arts.forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.dataset.cantidad   = a.cantidad;
    o.dataset.disponible = a.disponible;
    o.dataset.esKit      = a.es_kit;
    o.dataset.cat        = a.categoria;
    o.dataset.desc       = a.descripcion || '';
    o.dataset.nombre     = a.nombre;
    o.textContent = a.nombre + ' (disponible: ' + a.disponible + (a.cantidad > 1 ? '/' + a.cantidad : '') + ')';
    sel.appendChild(o);
  });
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

  const disp   = parseInt(opt.dataset.disponible);
  const dispEl = document.getElementById('p-art-disp');
  dispEl.className   = 'badge badge-in';
  dispEl.textContent = disp + ' disponible' + (disp !== 1 ? 's' : '');
  document.getElementById('p-art-total').textContent = 'Total: ' + opt.dataset.cantidad;

  const cantRow = document.getElementById('p-cant-row');
  cantRow.style.display = parseInt(opt.dataset.cantidad) > 1 ? 'block' : 'none';
  document.getElementById('p-cantidad').max   = disp;
  document.getElementById('p-cantidad').value = 1;

  document.getElementById('p-completo-row').style.display = opt.dataset.esKit == '1' ? 'block' : 'none';
}

// esta es la funcion nueva que agregue 

async function registrarPrestamo() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const artId  = document.getElementById('p-articulo').value;
  const sel    = document.getElementById('p-articulo');
  const opt    = sel.options[sel.selectedIndex];

  if (!nombre) {
    showAlert('⚠️ Ingresa el nombre de quien solicita', 'error');
    return;
  }

  if (!artId) {
    showAlert('⚠️ Selecciona un artículo', 'error');
    return;
  }

  const esKit = opt.dataset.esKit == '1';

  const body = {
    articulo_id: parseInt(artId),
    nombre_solicitante: nombre,
    tipo_persona: document.getElementById('p-tipo').value,
    identificacion: document.getElementById('p-id').value.trim(),
    programa: document.getElementById('p-programa').value.trim(),
    cantidad: parseInt(opt.dataset.cantidad) > 1
      ? parseInt(document.getElementById('p-cantidad').value)
      : 1,
    estado_salida: document.getElementById('p-estado').value,
    completo_salida: esKit
      ? document.getElementById('p-completo').value
      : 'N/A',
    observaciones: document.getElementById('p-obs').value.trim()
  };

  const res = await apiFetch('/prestamos', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    showAlert('❌ ' + data.error, 'error');
    return;
  }

  showAlert('✅ Préstamo registrado correctamente');

  await cargarSelectArticulos();
  cargarInicio();

  const otraVez = confirm(
    `✅ Préstamo registrado para ${nombre}.\n\n¿Desea agregar otro artículo ?`
  );

  if (otraVez) {

    // Solo limpiar artículo
    document.getElementById('p-articulo').value = '';
    document.getElementById('p-art-info').style.display = 'none';
    document.getElementById('p-cant-row').style.display = 'none';
    document.getElementById('p-completo-row').style.display = 'none';
    document.getElementById('p-obs').value = '';
    document.getElementById('p-estado').value = 'Bueno';
    document.getElementById('p-cantidad').value = 1;
    document.getElementById('p-articulo')
      .scrollIntoView({ behavior: 'smooth' });
    document.getElementById('p-articulo').focus();
  } else {
    // Limpiar todo
    ['p-nombre','p-id','p-programa','p-obs']
      .forEach(x => document.getElementById(x).value = '');
    document.getElementById('p-articulo').value = '';
    document.getElementById('p-art-info').style.display = 'none';
    document.getElementById('p-cant-row').style.display = 'none';
    document.getElementById('p-completo-row').style.display = 'none';
  }
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
    p.articulo_nombre.toLowerCase().includes(q)
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
        <button class="btn btn-success btn-sm" onclick="openModalDevolucion(${p.id}, ${p.es_kit})">📥 Devolver</button>
      </div>
      <div class="loan-body">
        <div style="font-size:14px;font-weight:600;">${p.articulo_nombre}${p.cantidad > 1 ? ` <span style="font-weight:400;color:#888;">(x${p.cantidad})</span>` : ''}</div>
        <div style="font-size:12px;color:#888;margin-bottom:8px;">${p.categoria}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${badgeEstado(p.estado_salida)}
          ${badgeCompleto(p.completo_salida)}
        </div>
        ${p.observaciones ? `<div style="font-size:11px;color:#aaa;margin-top:6px;">📝 ${p.observaciones}</div>` : ''}
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:8px;">🕐 Prestado el ${fmt(p.fecha_prestamo)}</div>
    </div>`).join('');
}

let _devPrestamoId = null;
let _devEsKit      = false;

function openModalDevolucion(prestamoId, esKit) {
  _devPrestamoId = prestamoId;
  _devEsKit      = esKit == 1 || esKit === true;
  const p = _activos.find(x => x.id === prestamoId);
  document.getElementById('modal-dev-info').innerHTML =
    `<strong>${p.articulo_nombre}</strong>${p.cantidad > 1 ? ' (x' + p.cantidad + ')' : ''}<br>
    Prestado a <strong>${p.nombre_solicitante}</strong> el ${fmt(p.fecha_prestamo)}`;
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

  const res  = await apiFetch('/devoluciones/' + _devPrestamoId, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();

  if (!res.ok) { showAlert('❌ ' + data.error, 'error'); return; }

  closeModal('modal-devolucion');
  showAlert('✅ Devolución registrada correctamente');
  await cargarActivos();
  cargarInicio();
}


