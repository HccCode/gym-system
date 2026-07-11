import { useGymStore } from '../store/useGymStore';

export default function Caja() {
  const { ingresosHoy, ventasRealizadas, movimientosCaja, cerrarCaja, historialCortes } = useGymStore();

  const handleCorteCaja = () => {
    if (movimientosCaja.length === 0 && ingresosHoy === 0) {
      alert("No hay movimientos registrados para hacer corte.");
      return;
    }
    
    if (window.confirm(`⚠️ ESTÁS A PUNTO DE CERRAR EL TURNO\n\nTotal a entregar: $${ingresosHoy.toFixed(2)}\nMovimientos: ${movimientosCaja.length}\n\n¿El dinero en físico coincide con el sistema?`)) {
      cerrarCaja();
      alert("✅ Corte de caja realizado con éxito. El sistema está en cero para el nuevo turno.");
    }
  };

  // NUEVA FUNCIÓN: Generar y descargar archivo Excel (CSV)
  const exportarAExcel = () => {
    if (historialCortes.length === 0) {
      alert("No hay cortes registrados para exportar.");
      return;
    }

    // 1. Agregamos el BOM (\uFEFF) para que Excel reconozca los acentos (UTF-8)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    // 2. Títulos de las columnas
    csvContent += "Folio,Fecha,Hora,Operaciones,Articulos_Meses,Monto_Entregado\n";

    // 3. Recorremos el historial y armamos las filas
    historialCortes.forEach(corte => {
      // Usamos comillas por si algún dato llevara comas en el futuro
      const row = `"${corte.id}","${corte.fecha}","${corte.hora}","${corte.totalMovimientos}","${corte.totalVentas}","${corte.totalIngresos.toFixed(2)}"`;
      csvContent += row + "\n";
    });

    // 4. Forzamos la descarga del archivo en el navegador
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Le ponemos la fecha de hoy al nombre del archivo
    const fechaArchivo = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Cortes_De_Caja_${fechaArchivo}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Control de Caja</h2>
          <p className="text-slate-400 text-sm mt-1">Supervisa los ingresos del turno actual y el historial.</p>
        </div>
        <button 
          onClick={handleCorteCaja}
          disabled={movimientosCaja.length === 0 && ingresosHoy === 0}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-wide"
        >
          <span>🔒</span> Cerrar Turno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-xl">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">Total en Caja (Efectivo)</p>
          <div className="text-7xl font-black text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            ${ingresosHoy.toFixed(2)}
          </div>
          <div className="flex gap-6">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 font-bold uppercase">Operaciones</p>
              <p className="text-xl font-black text-white">{movimientosCaja.length}</p>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 font-bold uppercase">Artículos / Meses</p>
              <p className="text-xl font-black text-white">{ventasRealizadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Tickets del Turno Actual</h3>
            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{movimientosCaja.length} transacciones</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {movimientosCaja.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-500">
                <span className="text-4xl mb-2 opacity-50">🧾</span>
                <p className="text-sm font-medium">Aún no hay ventas en este turno.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movimientosCaja.map((mov, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${mov.tipo === 'Venta' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {mov.tipo}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{mov.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{mov.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-400">+${mov.total.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{mov.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL HISTORIAL ACTUALIZADA CON BOTÓN EXCEL */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-800 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">Historial de Cortes</h3>
            <p className="text-xs text-slate-400 mt-1">Bitácora de cierres de caja anteriores</p>
          </div>
          {/* BOTÓN DE EXCEL */}
          <button 
            onClick={exportarAExcel}
            className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-500/30"
          >
            <span>📗</span> Exportar a Excel
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {historialCortes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              No hay cortes de caja registrados en el historial.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                  <th className="p-5 font-bold">Folio</th>
                  <th className="p-5 font-bold">Fecha y Hora</th>
                  <th className="p-5 font-bold">Movimientos</th>
                  <th className="p-5 font-bold">Artículos/Meses</th>
                  <th className="p-5 font-bold text-right">Monto Entregado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {historialCortes.map((corte, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <span className="font-mono text-sm font-bold text-slate-300">{corte.id}</span>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-semibold text-slate-200">{corte.fecha}</div>
                      <div className="text-xs text-slate-500">{corte.hora}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-bold text-slate-300">{corte.totalMovimientos}</span>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-bold text-slate-300">{corte.totalVentas}</span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="text-lg font-black text-emerald-400">${corte.totalIngresos.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}