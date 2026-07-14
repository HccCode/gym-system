import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import ModalMiembro from '../components/ModalMiembro';
import TicketMembresia from '../components/TicketMembresia'; 
import { useGymStore } from '../store/useGymStore';
import { useOutletContext } from 'react-router-dom';

export default function Miembros() {
  const { 
    miembros, 
    editarMiembro, 
    eliminarMiembro, 
    planes, 
    renovarMembresia,
    configuracion 
  } = useGymStore(); 
  
  const { rol } = useOutletContext();
  
  // Estados de control de la vista
  const [busqueda, setBusqueda] = useState('');
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false);
  const [miembroAEditar, setMiembroAEditar] = useState(null);
  const [miembroARenovar, setMiembroARenovar] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [ticketImpresion, setTicketImpresion] = useState(null);

  // 🔥 ESTADO CLAVE: Guarda temporalmente al miembro al que se le está generando la tarjeta
  const [miembroParaTarjeta, setMiembroParaTarjeta] = useState(null);
  const tarjetaRef = useRef(null);

  const miembrosFiltrados = miembros.filter(miembro => 
    miembro.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    miembro.matricula.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ==========================================
  // 🔥 FLUJO MAESTRO: AUTOMATIZACIÓN DE UN SOLO CLIC
  // ==========================================
  const procesarYEnviarAcceso = (miembro) => {
    if (!miembro.telefono) {
      alert(`El cliente ${miembro.nombre} no tiene un número de teléfono registrado.`);
      return;
    }

    // 1. Cargamos al miembro en el generador oculto
    setMiembroParaTarjeta(miembro);

    // 2. Le damos 100ms a React para pintar la info en el DOM oculto antes de tomar la captura
    setTimeout(async () => {
      if (!tarjetaRef.current) return;

      try {
        // Generamos el lienzo digital a partir del HTML en escala x2 para máxima definición del QR
        const canvas = await html2canvas(tarjetaRef.current, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        // Descargamos de forma automática el archivo .png en la computadora
        const link = document.createElement('a');
        link.download = `Pase-${miembro.nombre.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 3. Abrimos el chat de WhatsApp con el mensaje personalizado
        const numeroLimpio = miembro.telefono.replace(/\D/g, '');
        const nombreGym = configuracion?.nombreGym || 'GYMSYSTEM';
        const mensaje = `¡Hola *${miembro.nombre}*! 👋 Bienvenido a *${nombreGym}*.\n\nTe adjunto tu Pase Digital oficial de acceso. Favor de guardarlo en tu galería de imágenes para escanearlo al entrar. ¡Muchas gracias! 💪`;
        
        const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');

        // Limpiamos el generador oculto
        setMiembroParaTarjeta(null);
      } catch (error) {
        console.error("Error generando la tarjeta de acceso:", error);
        setMiembroParaTarjeta(null);
      }
    }, 100);
  };

  const handleGuardarFormulario = (datosMiembro) => {
    editarMiembro(datosMiembro.id, datosMiembro);
    setIsModalRegistroOpen(false);
  };

  const handleEliminar = (id, nombre) => {
    if (window.confirm(`⚠️ ¿Eliminar permanentemente a "${nombre}" del sistema?`)) {
      eliminarMiembro(id);
    }
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

  return (
    <>
      {ticketImpresion && <TicketMembresia {...ticketImpresion} />}

      {/* ========================================================
          📸 RENDERIZADOR OCULTO (Pinta y captura la tarjeta tal cual tu imagen)
          ======================================================== */}
      {miembroParaTarjeta && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0px', zIndex: -10 }}>
          <div 
            ref={tarjetaRef} 
            className="w-[320px] bg-white rounded-[2.5rem] p-6 flex flex-col items-center border border-stone-200"
            style={{ contentVisibility: 'auto' }}
          >
            {/* Avatar Circular */}
            <div className="w-20 h-20 bg-stone-100 rounded-full mb-4 overflow-hidden shadow-inner border-2 border-stone-200 flex items-center justify-center">
               {miembroParaTarjeta.foto ? (
                 <img src={miembroParaTarjeta.foto} alt="Avatar" className="w-full h-full object-cover"/>
               ) : (
                 <span className="text-3xl">👤</span>
               )}
            </div>

            {/* Datos del Miembro */}
            <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight text-center px-2 leading-tight">
              {miembroParaTarjeta.nombre}
            </h2>
            <p className="text-stone-400 font-bold text-xs mb-5 uppercase tracking-widest mt-1">
              {miembroParaTarjeta.matricula}
            </p>
            
            {/* QR Generado en Contenedor */}
            <div className="bg-stone-50 p-4 rounded-2xl mb-5 border border-stone-100 flex items-center justify-center shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${miembroParaTarjeta.matricula}`} 
                alt="QR Code" 
                className="w-28 h-28" 
              />
            </div>
            
            {/* Badge de Estado */}
            <div className="w-full text-center border-t border-stone-100 pt-4 mb-2">
               <span className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                 miembroParaTarjeta.estado === 'Activo' 
                   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                   : 'bg-red-50 text-red-700 border border-red-200/50'
               }`}>
                 {miembroParaTarjeta.estado}
               </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INTERFAZ PRINCIPAL DEL DIRECTORIO
          ======================================================== */}
      <div className="space-y-6 relative print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Directorio de Miembros</h2>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-[#111111] p-2 rounded-xl border border-stone-800/60 shadow-lg">
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o matrícula..." 
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-stone-800/60 rounded-lg focus:outline-none focus:border-red-500 text-stone-200 transition-colors" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        {/* Tabla Forja */}
        <div className="bg-[#111111] rounded-xl border border-stone-800/60 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-stone-800/60 text-xs text-stone-400 uppercase tracking-widest">
                  <th className="p-5 font-bold">Miembro</th>
                  <th className="p-5 font-bold">Vencimiento</th>
                  <th className="p-5 font-bold">Estado</th>
                  <th className="p-5 font-bold text-center">Acceso Digital</th>
                  <th className="p-5 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {miembrosFiltrados.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-[#1a1a1a] border border-stone-700 flex items-center justify-center text-xl overflow-hidden shadow-inner">
                          {miembro.foto ? <img src={miembro.foto} alt="foto" className="w-full h-full object-cover"/> : '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-red-400 transition-colors">{miembro.nombre}</div>
                          <div className="text-xs font-mono font-bold text-stone-500">{miembro.matricula}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-semibold text-stone-300">📅 {miembro.fechaVencimiento}</div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-md text-xs font-bold border ${miembro.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {miembro.estado}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center">
                        {/* 🔥 NUEVO BOTÓN AUTOMÁTICO */}
                        <button 
                          onClick={() => { procesarYEnviarAcceso(miembro); }} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-2 border border-emerald-600"
                        >
                          <span>💬</span> ENVIAR ACCESO
                        </button>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setMiembroARenovar(miembro)} className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors border border-red-500/20">💳 Renovar</button>
                        <button onClick={() => abrirModalEditar(miembro)} className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition-colors border border-stone-700">Editar</button>
                        <button onClick={() => handleEliminar(miembro.id, miembro.nombre)} className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors border border-stone-700">Borrar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <ModalMiembro isOpen={isModalRegistroOpen} onClose={() => setIsModalRegistroOpen(false)} onSave={handleGuardarFormulario} miembroAEditar={miembroAEditar} />

        {/* Modal de Renovación */}
        {miembroARenovar && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111111] border border-stone-800 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)] w-full max-w-sm overflow-hidden">
              <div className="bg-[#1a1a1a] px-6 py-4 border-b border-stone-800 flex justify-between items-center">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Renovar Membresía</h3>
                <button onClick={() => setMiembroARenovar(null)} className="text-stone-500 hover:text-white">✕</button>
              </div>
              <form onSubmit={procesarRenovacion} className="p-6">
                <p className="text-stone-400 text-sm mb-4">Cliente: <span className="font-bold text-white">{miembroARenovar.nombre}</span></p>
                <select required className="w-full px-4 py-3 bg-[#1a1a1a] border border-stone-800 rounded-lg text-white mb-6 font-medium focus:border-red-500" value={planSeleccionado} onChange={(e) => setPlanSeleccionado(e.target.value)}>
                  <option value="" disabled>Elige un paquete...</option>
                  {planes.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.nombre} - ${plan.precio} MXN</option>
                  ))}
                </select>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setMiembroARenovar(null)} className="px-4 py-2 text-sm font-bold text-stone-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all">Cobrar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}