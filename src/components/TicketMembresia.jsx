import { useGymStore } from '../store/useGymStore';

export default function TicketMembresia({ miembro, plan, total, folio, nuevaFecha }) {
  const { configuracion } = useGymStore();

  if (!miembro || !plan) return null;

  const fechaPago = new Date().toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="hidden print:block w-[80mm] text-black bg-white p-2 font-mono text-[12px] leading-tight mx-auto">
      
      <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
        <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
          {configuracion?.nombreGym || 'GYMSYSTEM'}
        </h1>
        <p className="font-bold">{configuracion?.ticketCabecera || 'Sucursal Mexicali'}</p>
        <p>Folio: {folio}</p>
        <p>{fechaPago}</p>
      </div>

      <div className="mb-4">
        <p className="font-bold uppercase text-[10px]">Cliente:</p>
        <p className="uppercase font-bold text-sm">{miembro.nombre}</p>
        <p>Matrícula: {miembro.matricula}</p>
      </div>

      <table className="w-full mb-4 text-left">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="pb-1">CONCEPTO</th>
            <th className="pb-1 text-right">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 pr-2 uppercase">{plan.nombre}</td>
            <td className="py-2 text-right align-top">${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-4 text-center p-2 border-2 border-black">
        <p className="font-bold uppercase text-[10px]">Válido hasta:</p>
        <p className="text-lg font-black">{nuevaFecha}</p>
      </div>

      <div className="text-right border-t border-black border-dashed pt-2 mb-6">
        <p className="text-xl font-black uppercase">Total: ${total.toFixed(2)}</p>
      </div>

      <div className="text-center mb-4">
        <p className="font-bold">¡GRACIAS POR TU PAGO!</p>
        <p className="text-[10px] mt-1">{configuracion?.ticketPie || 'Este ticket no es un comprobante fiscal.'}</p>
        <p className="text-[10px] mt-4">- - - - - - - - - - - - - - -</p>
      </div>
    </div>
  );
}