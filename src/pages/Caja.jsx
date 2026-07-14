import { useState } from 'react';
import { useGymStore } from '../store/useGymStore';
import ReporteCorte from '../components/ReporteCorte'; 

export default function Caja() {
  const { 
    ingresosHoy, 
    ventasRealizadas, 
    asistenciasHoy, 
    movimientosCaja, 
    historialCortes, 
    cerrarCaja,
    configuracion,
    usuarioActual
  } = useGymStore();

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [modalExito, setModalExito] = useState(null); 
  const [corteAImprimir, setCorteAImprimir] = useState(null); 

  // 🔥 NUEVOS ESTADOS PARA EL BUSCADOR DE FECHAS
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const handleCerrarTurno = async () => {
    const resumenCorte = {
      ingresos: ingresosHoy,
      ventas: ventasRealizadas,
      fecha: new Date().toLocaleDateString(),
      hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    await cerrarCaja();
    setModalConfirmacion(false);
    setModalExito(resumenCorte);
  };

  const imprimirCorte = () => {
    window.print();
    setModalExito(null);
  };

  const handleDescargarCorte = (corte) => {
    setCorteAImprimir(corte);
    setTimeout(() => {
      window.print();
      setCorteAImprimir(null);
    }, 150);
  };

  // 🔥 LÓGICA DEL BUSCADOR: Filtramos el historial antes de renderizarlo
  const cortesFiltrados = historialCortes.filter(corte => {
    if (!fechaInicio && !fechaFin) return true; // Si no hay filtro, mostramos todos
    
    // Convertimos la fecha del corte ("DD/MM/YYYY") a un formato comparable ("YYYY-MM-DD")
    const partesFecha = corte.fecha.split('/');
    if (partesFecha.length !== 3) return true; // Por si algún corte viejo tiene mal formato
    
    // Ojo: asumiendo formato DD/MM/YYYY, si tu PC usa MM/DD/YYYY, habría que invertir el 0 y el 1
    const fechaCorteFmt = new Date(partesFecha[2], partesFecha[1] - 1, partesFecha[0]).getTime();
    
    const fInicio = fechaInicio ? new Date(fechaInicio + 'T00:00:00').getTime() : 0; // Si está vacío, toma desde el inicio de los tiempos
    const fFin = fechaFin ? new Date(fechaFin + 'T23:59:59').getTime() : Infinity; // Si está vacío, toma hasta el final de los tiempos

    return fechaCorteFmt >= fInicio && fechaCorteFmt <= fFin;
  });

  return (
    <>
      <div className="space-y-6 relative print:hidden">
        
        {/* ENCABEZADO Y BOTÓN DE CIERRE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Corte de Caja</h2>
            <p className="text-stone-400 text-sm mt-1">Supervisa las finanzas y cierra el turno actual.</p>
          </div>
          <button 
            onClick={() => setModalConfirmacion(true)}
            disabled={movimientosCaja.length === 0}
            className="px-6 py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-stone-800 disabled:text-stone-500 disabled:shadow-none text-white rounded-lg font-black tracking-wide transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] flex items-center gap-2"
          >
            <span className="text-xl">🔒</span> CERRAR TURNO
          </button>
        </div>

        {/* MÉTRICAS (KPIs) DEL TURNO ACTUAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111111] p-6 rounded-xl border border-stone-800/60 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:scale-110 transition-transform duration-500">💵</div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Ingresos del Turno</p>
            <h3 className="text-4xl font-black text-emerald-400">${ingresosHoy.toFixed(2)}</h3>
          </div>
          
          <div className="bg-[#111111] p-6 rounded-xl border border-stone-800/60 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:scale-110 transition-transform duration-500">🛒</div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Artículos Vendidos</p>
            <h3 className="text-4xl font-black text-white">{ventasRealizadas} <span className="text-lg text-stone-500 font-medium">unidades</span></h3>
          </div>
          
          <div className="bg-[#111111] p-6 rounded-xl border border-stone-800/60 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:scale-110 transition-transform duration-500">👥</div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Asistencias Kiosco</p>
            <h3 className="text-4xl font-black text-white">{asistenciasHoy} <span className="text-lg text-stone-500 font-medium">visitas</span></h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TABLA DE MOVIMIENTOS EN VIVO */}
          <div className="lg:col-span-2 bg-[#111111] rounded-xl border border-stone-800/60 shadow-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-[#1a1a1a] px-6 py-4 border-b border-stone-800/60 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest flex items-center gap-2">
                <span className="text-emerald-500">📊</span> Movimientos Activos
              </h3>
              <span className="text-xs font-bold bg-stone-800 text-stone-400 px-2 py-1 rounded">
                {movimientosCaja.length} registros
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {movimientosCaja.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-3">
                  <span className="text-6xl opacity-50">📭</span>
                  <p className="text-sm font-bold uppercase tracking-wider">Caja vacía. No hay ventas aún.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movimientosCaja.map((mov, index) => (
                    <div key={index} className="bg-[#1a1a1a] border border-stone-800/40 rounded-lg p-4 flex justify-between items-center hover:border-stone-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                          mov.tipo === 'Venta' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          mov.tipo === 'Inscripción' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {mov.tipo === 'Venta' ? '🛒' : mov.tipo === 'Inscripción' ? '📝' : '💳'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-200 line-clamp-2">{mov.descripcion}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{mov.tipo}</span>
                            <span className="text-[10px] text-stone-600">•</span>
                            <span className="text-xs font-mono text-stone-500">{mov.hora}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-black text-emerald-400 shrink-0 pl-2">
                        +${mov.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HISTORIAL DE CORTES (TURNOS PASADOS) CON BUSCADOR */}
          <div className="bg-[#111111] rounded-xl border border-stone-800/60 shadow-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-[#1a1a1a] px-6 py-4 border-b border-stone-800/60 shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-stone-400">🕒</span> Historial de Cortes
                </h3>
                {cortesFiltrados.length !== historialCortes.length && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Filtrado</span>
                )}
              </div>
              
              {/* 🔥 BUSCADOR DE FECHAS ESTILIZADO */}
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">Desde</label>
                  <input 
                    type="date" 
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-stone-600 text-stone-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark] transition-all cursor-pointer hover:bg-stone-800"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">Hasta</label>
                  <input 
                    type="date" 
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-stone-600 text-stone-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark] transition-all cursor-pointer hover:bg-stone-800"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {cortesFiltrados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-3">
                  <span className="text-5xl opacity-50">📁</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-center px-4">
                    {historialCortes.length === 0 ? "No hay cortes registrados en el sistema." : "No se encontraron cortes en ese rango de fechas."}
                  </p>
                  {(fechaInicio || fechaFin) && (
                    <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="text-emerald-500 hover:text-emerald-400 text-xs font-bold underline mt-2">
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {cortesFiltrados.map((corte, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border border-stone-800/60 shadow-md group">
                      <div className="border-l-2 border-stone-700 pl-4 relative">
                        <div className="absolute w-2 h-2 bg-stone-700 rounded-full -left-[5px] top-3"></div>
                        <p className="text-xs font-bold text-stone-500 mb-1">{corte.fecha} - {corte.hora}</p>
                        <h4 className="text-lg font-black text-white">${Number(corte.totalIngresos).toFixed(2)}</h4>
                        <p className="text-xs text-stone-400 mt-1">{corte.totalMovimientos} operaciones</p>
                      </div>
                      
                      <button 
                        onClick={() => handleDescargarCorte(corte)}
                        className="px-3 py-2 bg-stone-800 hover:bg-emerald-600 text-stone-300 hover:text-white rounded-lg text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 border border-stone-700 hover:border-emerald-500"
                      >
                        <span>📄</span> PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          MODALES DE INTERACCIÓN
          ========================================== */}
      
      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-[#111111] border border-stone-800/60 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-sm p-8 text-center animate-scaleIn">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">¿Cerrar Turno?</h3>
            <p className="text-stone-400 mb-6 text-sm">Estás a punto de hacer el corte de caja con un total de <span className="text-emerald-400 font-bold">${ingresosHoy.toFixed(2)}</span>. Esto reiniciará los contadores a cero.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setModalConfirmacion(false)} className="w-full py-3.5 rounded-lg font-bold text-stone-300 bg-[#1a1a1a] hover:bg-stone-800 transition-all border border-stone-700">Cancelar</button>
              <button onClick={handleCerrarTurno} className="w-full py-3.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all">Sí, Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 print:hidden">
          <div className="bg-[#111111] border border-stone-800/60 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-sm p-8 text-center animate-scaleIn">
            <div className="text-6xl mb-4 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">✅</div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Corte Realizado</h3>
            <p className="text-stone-400 mb-6 text-sm">El turno ha sido cerrado y guardado en la base de datos correctamente.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={imprimirCorte} className="w-full py-3.5 rounded-lg font-bold text-white transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] text-sm tracking-wide bg-emerald-600 hover:bg-emerald-500">🖨️ IMPRIMIR TICKET DE CORTE</button>
              <button onClick={() => setModalExito(null)} className="w-full py-3.5 rounded-lg font-bold text-stone-400 transition-all text-sm tracking-wide bg-[#1a1a1a] hover:bg-stone-800 border border-stone-800">CERRAR SIN IMPRIMIR</button>
            </div>
          </div>
        </div>
      )}

      {modalExito && !corteAImprimir && (
        <div className="hidden print:block w-[80mm] bg-white text-black font-mono text-sm mx-auto">
          <div className="text-center mb-4 border-b-2 border-black border-dashed pb-4">
            <h2 className="text-xl font-black uppercase mb-1">{configuracion?.nombreGym || 'GYMSYSTEM'}</h2>
            <p className="text-xs font-bold uppercase">CORTE DE CAJA (TURNO)</p>
          </div>
          
          <div className="space-y-1 mb-4 text-xs">
            <p><span className="font-bold">FECHA:</span> {modalExito.fecha}</p>
            <p><span className="font-bold">HORA:</span> {modalExito.hora}</p>
            <p><span className="font-bold">CAJERO:</span> {usuarioActual?.nombre || 'Administrador'}</p>
          </div>

          <div className="border-t border-b border-black py-2 mb-4">
            <div className="flex justify-between font-bold">
              <span>DESCRIPCIÓN</span>
              <span>CANT</span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Artículos Vendidos</span>
              <span className="font-bold">{modalExito.ventas}</span>
            </div>
            <div className="flex justify-between">
              <span>Asistencias Kiosco</span>
              <span className="font-bold">{asistenciasHoy}</span>
            </div>
          </div>

          <div className="border-t-2 border-black border-dashed pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase">TOTAL INGRESOS</span>
              <span className="text-lg font-black">${modalExito.ingresos.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs space-y-1">
            <p className="font-bold border-t border-black pt-4 w-3/4 mx-auto mt-12">Firma del Cajero</p>
            <p className="mt-4">--- FIN DEL REPORTE ---</p>
          </div>
        </div>
      )}

      {corteAImprimir && <ReporteCorte corte={corteAImprimir} configuracion={configuracion} />}
    </>
  );
}