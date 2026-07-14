import React from 'react';

export default function ReporteCorte({ corte, configuracion }) {
  if (!corte) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] text-black p-10 font-sans print:w-[210mm] print:min-h-[297mm]">
      
      {/* ENCABEZADO DEL REPORTE */}
      <div className="text-center border-b-4 border-stone-800 pb-6 mb-8">
        <h1 className="text-4xl font-black uppercase tracking-widest text-stone-900">
          {configuracion?.nombreGym || 'GYMSYSTEM'}
        </h1>
        <h2 className="text-xl font-bold mt-2 tracking-widest text-stone-500">REPORTE OFICIAL DE CAJA</h2>
      </div>

      {/* DATOS GENERALES DEL CORTE */}
      <div className="flex justify-between items-start mb-8 bg-stone-100 p-6 rounded-xl border border-stone-300">
        <div className="space-y-2">
          <p><span className="font-bold text-stone-500 text-sm tracking-wider uppercase">Folio de Corte:</span> <span className="font-black text-lg ml-2">{corte.id}</span></p>
          <p><span className="font-bold text-stone-500 text-sm tracking-wider uppercase">Fecha de Cierre:</span> <span className="font-bold ml-2">{corte.fecha}</span></p>
          <p><span className="font-bold text-stone-500 text-sm tracking-wider uppercase">Hora de Cierre:</span> <span className="font-bold ml-2">{corte.hora}</span></p>
        </div>
        <div className="text-right space-y-2">
          <p><span className="font-bold text-stone-500 text-sm tracking-wider uppercase">Operaciones Totales:</span> <span className="font-black text-lg ml-2">{corte.totalMovimientos}</span></p>
          <p><span className="font-bold text-stone-500 text-sm tracking-wider uppercase">Artículos Vendidos:</span> <span className="font-bold ml-2">{corte.totalVentas}</span></p>
          <p className="mt-4"><span className="font-bold text-stone-500 text-sm tracking-wider uppercase block">Ingreso Total</span> <span className="font-black text-4xl text-green-700">${Number(corte.totalIngresos).toFixed(2)}</span></p>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS DETALLADOS */}
      <div className="mb-6">
        <h3 className="text-lg font-black uppercase tracking-wider border-b-2 border-stone-300 pb-2 mb-4">Desglose de Operaciones</h3>
        
        {corte.movimientos && corte.movimientos.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-xs uppercase tracking-widest">
                <th className="p-3 font-bold border border-stone-300">Hora</th>
                <th className="p-3 font-bold border border-stone-300">Folio Tkt.</th>
                <th className="p-3 font-bold border border-stone-300">Tipo</th>
                <th className="p-3 font-bold border border-stone-300">Descripción de Venta</th>
                <th className="p-3 font-bold border border-stone-300 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {corte.movimientos.map((mov, i) => (
                <tr key={i} className="text-sm border-b border-stone-200">
                  <td className="p-3 font-medium text-stone-500">{mov.hora}</td>
                  <td className="p-3 font-mono font-bold">{mov.id}</td>
                  <td className="p-3 font-bold text-stone-700">{mov.tipo}</td>
                  <td className="p-3">{mov.descripcion}</td>
                  <td className="p-3 font-black text-right">${Number(mov.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 bg-stone-50 border border-dashed border-stone-300 rounded-xl">
            <p className="font-bold text-stone-400">Resumen procesado correctamente.</p>
            <p className="text-xs text-stone-400 mt-1">(Los cortes antiguos generados antes de esta actualización no contienen el desglose interno).</p>
          </div>
        )}
      </div>

      {/* PIE DE PÁGINA */}
      <div className="mt-16 pt-6 border-t border-stone-300 flex justify-between text-xs font-bold text-stone-400 uppercase tracking-widest">
        <p>Generado por GYMSYSTEM</p>
        <p>Documento de Control Interno</p>
      </div>

    </div>
  );
}