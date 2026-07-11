import { useState } from 'react';
import ModalMiembro from '../components/ModalMiembro';
import ModalCredencial from '../components/ModalCredencial';
import TicketMembresia from '../components/TicketMembresia'; 
import { useGymStore } from '../store/useGymStore';
import { useOutletContext } from 'react-router-dom';

export default function Miembros() {
  const { 
    miembros, 
    agregarMiembro, 
    editarMiembro, 
    eliminarMiembro, 
    planes, 
    renovarMembresia,
    registrarMiembroConSuscripcion 
  } = useGymStore(); 
  
  const { rol } = useOutletContext();
  
  const [busqueda, setBusqueda] = useState('');
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false);
  const [credencialAbierta, setCredencialAbierta] = useState(null);
  
  const [miembroAEditar, setMiembroAEditar] = useState(null);
  const [miembroARenovar, setMiembroARenovar] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [ticketImpresion, setTicketImpresion] = useState(null);

  const miembrosFiltrados = miembros.filter(miembro => 
    miembro.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    miembro.matricula.toLowerCase().includes(busqueda.toLowerCase())
  );

  // === NUEVA FUNCIÓN AÑADIDA PARA EVITAR EL CRASHEO ===
  const enviarWhatsApp = (miembro) => {
    if (!miembro.telefono) {
      alert(`El cliente ${miembro.nombre} no tiene un número de teléfono registrado.`);
      return;
    }
    // Limpiamos el número para que solo queden dígitos
    const numeroLimpio = miembro.telefono.replace(/\D/g, '');
    const mensaje = `Hola ${miembro.nombre}, nos comunicamos del gimnasio para saludarte.`;
    const url = `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };
  // ====================================================

  const handleGuardarFormulario = (datosMiembro) => {
    if (datosMiembro.id) {
      editarMiembro(datosMiembro.id, datosMiembro);
    } else {
      const planIdSeleccionado = datosMiembro.planId ? planes.find(p => p.id === parseInt(datosMiembro.planId)) : null;
      
      if (planIdSeleccionado) {
        const folioStr = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
        registrarMiembroConSuscripcion(datosMiembro, planIdSeleccionado, folioStr);

        const hoy = new Date();
        hoy.setDate(hoy.getDate() + planIdSeleccionado.duracionDias);
        
        setTicketImpresion({
          miembro: { ...datosMiembro, matricula: 'GENERANDO...' }, 
          plan: planIdSeleccionado,
          total: planIdSeleccionado.precio,
          folio: folioStr,
          nuevaFecha: hoy.toISOString().split('T')[0]
        });
        
        setTimeout(() => { window.print(); }, 100);
      } else {
        agregarMiembro({
          ...datosMiembro, 
          estado: 'Inactivo',
          matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
          fechaRegistro: new Date().toISOString().split('T')[0],
          fechaVencimiento: 'Sin suscripción'
        });
      }
    }
    setIsModalRegistroOpen(false);
  };

  const handleEliminar = (id, nombre) => {
    if (window.confirm(`⚠️ ¿Eliminar permanentemente a "${nombre}" del sistema?`)) {
      eliminarMiembro(id);
    }
  };

  const abrirModalCrear = () => {
    setMiembroAEditar(null);
    setIsModalRegistroOpen(true);
  };

  const abrirModalEditar = (miembro) => {
    setMiembroAEditar(miembro);
    setIsModalRegistroOpen(true);
  };

  const procesarRenovacion = (e) => {
    e.preventDefault();
    const plan = planes.find(p => p.id === parseInt(planSeleccionado));
    
    if (plan && miembroARenovar) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + plan.duracionDias);
      const nuevaFecha = hoy.toISOString().split('T')[0];
      const folioStr = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;

      renovarMembresia(miembroARenovar.id, plan, folioStr);

      setTicketImpresion({
        miembro: miembroARenovar,
        plan: plan,
        total: plan.precio,
        folio: folioStr,
        nuevaFecha: nuevaFecha
      });

      setMiembroARenovar(null);
      setPlanSeleccionado('');

      setTimeout(() => { window.print(); }, 100);
    }
  };

  const exportarAExcel = () => {
    if (miembros.length === 0) {
      alert("No hay miembros registrados para exportar.");
      return;
    }

    const tablaHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .header { background-color: #1e3a8a; color: #ffffff; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #cbd5e1; height: 40px; }
          .celda { border: 1px solid #cbd5e1; text-align: center; font-size: 12px; height: 30px; }
          .activo { color: #059669; font-weight: bold; }
          .vencido { color: #e11d48; font-weight: bold; }
          .titulo { font-size: 20px; font-weight: bold; text-align: center; height: 50px; background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="titulo">Directorio de Miembros</td></tr>
          <tr>
            <th class="header">Matrícula</th>
            <th class="header">Nombre del Cliente</th>
            <th class="header">Teléfono</th>
            <th class="header">Correo Electrónico</th>
            <th class="header">Estado Actual</th>
            <th class="header">Fecha de Registro</th>
            <th class="header">Fecha de Vencimiento</th>
          </tr>
          ${miembros.map(m => `
            <tr>
              <td class="celda">${m.matricula}</td>
              <td class="celda"><b>${m.nombre}</b></td>
              <td class="celda">${m.telefono || 'N/A'}</td>
              <td class="celda">${m.email || 'N/A'}</td>
              <td class="celda ${m.estado === 'Activo' ? 'activo' : 'vencido'}">${m.estado}</td>
              <td class="celda">${m.fechaRegistro}</td>
              <td class="celda">${m.fechaVencimiento}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tablaHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Directorio_Miembros_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {ticketImpresion && (
        <TicketMembresia miembro={ticketImpresion.miembro} plan={ticketImpresion.plan} total={ticketImpresion.total} folio={ticketImpresion.folio} nuevaFecha={ticketImpresion.nuevaFecha} />
      )}

      <div className="space-y-6 relative print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Directorio de Miembros</h2>
          </div>
          <div className="flex gap-3">
            {rol === 'admin' && (
              <button onClick={exportarAExcel} className="px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-500/30">
                <span>📗</span> Excel
              </button>
            )}
            <button onClick={abrirModalCrear} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30">
              + Agregar Miembro
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl shadow-lg border border-slate-800">
          <input type="text" placeholder="🔍 Buscar por nombre o ID..." className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-100" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                  <th className="p-5 font-bold">Miembro</th>
                  <th className="p-5 font-bold">Vencimiento</th>
                  <th className="p-5 font-bold">Estado</th>
                  <th className="p-5 font-bold text-center">Contacto</th>
                  <th className="p-5 font-bold text-center">Administración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {miembrosFiltrados.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-xl">👤</div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400">{miembro.nombre}</div>
                          <div className="text-xs font-mono font-bold text-blue-500">{miembro.matricula}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-semibold text-slate-300">📅 {miembro.fechaVencimiento}</div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${miembro.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {miembro.estado}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-3">
                        <button onClick={() => enviarWhatsApp(miembro)} className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm transition-colors border border-emerald-500/30" title="WhatsApp">
                          💬
                        </button>
                        <button onClick={() => setCredencialAbierta(miembro)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-slate-700" title="Ver QR">
                          📱
                        </button>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setMiembroARenovar(miembro)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                          💳 Renovar
                        </button>
                        <button onClick={() => abrirModalEditar(miembro)} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-bold transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(miembro.id, miembro.nombre)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors">
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <ModalMiembro isOpen={isModalRegistroOpen} onClose={() => setIsModalRegistroOpen(false)} onSave={handleGuardarFormulario} miembroAEditar={miembroAEditar} />
        <ModalCredencial isOpen={!!credencialAbierta} onClose={() => setCredencialAbierta(null)} miembro={credencialAbierta} />

        {miembroARenovar && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-black text-white">Renovar Membresía</h3>
                <button onClick={() => setMiembroARenovar(null)} className="text-blue-200 hover:text-white">✕</button>
              </div>
              <form onSubmit={procesarRenovacion} className="p-6">
                <p className="text-slate-300 text-sm mb-4">Cliente: <span className="font-bold text-white">{miembroARenovar.nombre}</span></p>
                <select required className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white mb-6 font-medium" value={planSeleccionado} onChange={(e) => setPlanSeleccionado(e.target.value)}>
                  <option value="" disabled>Elige un paquete...</option>
                  {planes.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.nombre} - ${plan.precio} MXN</option>
                  ))}
                </select>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setMiembroARenovar(null)} className="px-4 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 rounded-xl">Cancelar</button>
                  <button type="submit" className="px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-md">Cobrar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}