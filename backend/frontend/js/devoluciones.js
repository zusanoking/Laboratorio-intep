// js/devoluciones.js
let _devoluciones = [];

async function cargarDevoluciones() {
const res     = await apiFetch('/devoluciones');
_devoluciones = await res.json();
renderDevoluciones();
}

function renderDevoluciones() {
const q = (document.getElementById('buscar-dev')?.value || '').toLowerCase();
const lista = _devoluciones.filter(d =>
    d.nombre_solicitante.toLowerCase().includes(q) ||
    d.articulo_nombre.toLowerCase().includes(q)
);
const c = document.getElementById('lista-devoluciones');
if (lista.length === 0) {
    c.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>Sin devoluciones registradas aún</div>';
    return;
}
c.innerHTML = lista.map(d => `
    <div class="loan-card" style="opacity:0.9;">
    <div class="loan-header">
        <div>
        <div class="loan-person">
            ${d.nombre_solicitante}
            <span class="badge ${d.tipo_persona === 'Docente' ? 'badge-doc' : 'badge-ok'}" style="margin-left:6px;">${d.tipo_persona}</span>
        </div>
        ${d.programa ? `<div class="loan-detail">📚 ${d.programa}</div>` : ''}
        ${d.identificacion ? `<div class="loan-detail">🪪 ${d.identificacion}</div>` : ''}
        </div>
        <span class="badge badge-in">✅ Devuelto</span>
    </div>
    <div class="loan-body">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">${d.articulo_nombre}${d.cantidad > 1 ? ` (x${d.cantidad})` : ''}</div>
        <div style="font-size:12px;color:#888;margin-bottom:8px;">${d.categoria}</div>

        <!-- Estado comparativo salida vs retorno -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <div style="background:white;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:#aaa;margin-bottom:4px;">AL SALIR</div>
            ${badgeEstado(d.estado_salida)}
            <div style="margin-top:4px;">${badgeCompleto(d.completo_salida)}</div>
        </div>
        <div style="background:white;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:#aaa;margin-bottom:4px;">AL REGRESAR</div>
            ${badgeEstado(d.estado_retorno)}
            <div style="margin-top:4px;">${badgeCompleto(d.completo_retorno)}</div>
        </div>
        </div>

        ${d.obs_prestamo  ? `<div style="font-size:11px;color:#aaa;">📝 Salida: ${d.obs_prestamo}</div>` : ''}
        ${d.observaciones ? `<div style="font-size:11px;color:#aaa;margin-top:2px;">📝 Retorno: ${d.observaciones}</div>` : ''}
    </div>
    <div style="font-size:11px;color:#aaa;margin-top:8px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
        <span>Prestado: ${fmt(d.fecha_prestamo)}</span>
        <span>Devuelto: ${fmt(d.fecha_devolucion)}</span>
    </div>
    </div>`).join('');
}
