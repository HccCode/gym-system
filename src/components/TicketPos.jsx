export default function TicketPos({ carrito, total, folio }) {
  if (!carrito || carrito.length === 0) return null;

  const fecha = new Date().toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    // hidden en pantalla, pero visible al imprimir. Ancho estricto de 80mm.
    <div className="hidden print:block w-[80mm] text-black bg-white p-2 font-mono text-[12px] leading-tight mx-auto">
      
      {/* Encabezado del Gym */}
      <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
        <h1 className="text-2xl font-black uppercase tracking-widest mb-1">GYMSYSTEM</h1>
        <p className="font-bold">Sucursal Mexicali</p>
        <p>Ticket: {folio}</p>
        <p>{fecha}</p>
      </div>

      {/* Tabla de Artículos */}
      <table className="w-full mb-4 text-left">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="pb-1 w-8">CANT</th>
            <th className="pb-1">DESCRIPCIÓN</th>
            <th className="pb-1 text-right">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {carrito.map((item, i) => (
            <tr key={i}>
              <td className="py-1 align-top">{item.cantidad}</td>
              <td className="py-1 pr-2 uppercase">{item.nombre}</td>
              <td className="py-1 text-right align-top">${(item.precio * item.cantidad).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="text-right border-t border-black border-dashed pt-2 mb-6">
        <p className="text-xl font-black uppercase">Total: ${total.toFixed(2)}</p>
      </div>

      {/* Despedida */}
      <div className="text-center mb-4">
        <p className="font-bold">¡GRACIAS POR TU COMPRA!</p>
        <p className="text-[10px] mt-1">Este ticket no es un comprobante fiscal.</p>
        <p className="text-[10px] mt-4">- - - - - - - - - - - - - - -</p>
      </div>
    </div>
  );
}