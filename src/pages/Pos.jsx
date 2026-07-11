import { useState } from 'react';
import { useGymStore } from '../store/useGymStore'; 
import TicketPos from '../components/TicketPos';

export default function Pos() {
  const { productos, procesarVenta } = useGymStore(); 
  
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [ticketImpresion, setTicketImpresion] = useState(null);

  const productosFiltrados = productos.filter(prod => {
    const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todos' || prod.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  const agregarAlCarrito = (producto) => {
    const itemEnCarrito = carrito.find(item => item.id === producto.id);
    const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    if (cantidadActual >= producto.stock) {
      alert(`No hay suficiente stock de ${producto.nombre}. Disponible: ${producto.stock}`);
      return;
    }
    if (itemEnCarrito) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const actualizarCantidad = (id, cambio) => {
    setCarrito(
      carrito.map(item => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + cambio;
          const productoOriginal = productos.find(p => p.id === id);
          if (nuevaCantidad > productoOriginal.stock) {
            alert(`Límite alcanzado. Disponible: ${productoOriginal.stock}`);
            return item;
          }
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPagar = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const handleCobrar = () => {
    if (carrito.length === 0) return;
    
    const folioStr = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    
    setTicketImpresion({
      carrito: [...carrito],
      total: totalPagar,
      folio: folioStr
    });

    // Guardamos en Zustand con el folio
    procesarVenta(carrito, totalPagar, folioStr);
    setCarrito([]);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      {ticketImpresion && (
        <TicketPos carrito={ticketImpresion.carrito} total={ticketImpresion.total} folio={ticketImpresion.folio} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-7rem)] overflow-hidden print:hidden">
        
        <div className="lg:col-span-2 flex flex-col h-full space-y-4 overflow-hidden">
          <div className="bg-slate-900 p-3 rounded-xl shadow-lg border border-slate-800 flex gap-2">
            <input type="text" placeholder="Buscar bebidas o suplementos..." className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Todos', 'Bebida', 'Suplemento', 'Snack'].map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${categoriaActiva === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'}`}>
                {cat === 'Todos' ? 'Todos' : cat + 's'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-1">
            {productosFiltrados.map(prod => (
              <button key={prod.id} disabled={prod.stock === 0} onClick={() => agregarAlCarrito(prod)} className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition-all relative overflow-hidden group ${prod.stock === 0 ? 'opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800' : 'bg-slate-900 border-slate-700 hover:border-blue-500 hover:shadow-lg active:scale-[0.98]'}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{prod.categoria}</span>
                  <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 line-clamp-2">{prod.nombre}</h4>
                </div>
                <div className="mt-6 flex justify-between items-end w-full">
                  <span className="text-2xl font-black text-white">${prod.precio.toFixed(2)}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${prod.stock === 0 ? 'bg-red-500/10 text-red-400' : prod.stock <= 5 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>
                    {prod.stock === 0 ? 'Agotado' : `${prod.stock} disp.`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-100">🛒 Venta Actual</h3>
            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">{totalItems} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/50">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <span className="text-5xl opacity-50">🧾</span>
                <p className="text-sm font-medium">Ticket vacío.<br />Selecciona productos.</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.id} className="py-4 flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-slate-200 line-clamp-2">{item.nombre}</h5>
                    <span className="text-xs text-slate-500">${item.precio.toFixed(2)} c/u</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-black text-white">${(item.precio * item.cantidad).toFixed(2)}</span>
                    <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950 overflow-hidden">
                      <button onClick={() => actualizarCantidad(item.id, -1)} className="px-2.5 py-1 hover:bg-slate-800 text-slate-400 font-bold">-</button>
                      <span className="px-2 text-xs font-bold text-slate-200 min-w-[1.5rem] text-center">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, 1)} className="px-2.5 py-1 hover:bg-slate-800 text-slate-400 font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-5">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 font-medium">Total:</span>
              <span className="text-4xl font-black text-white leading-none">${totalPagar.toFixed(2)} <span className="text-sm text-slate-500 font-bold">MXN</span></span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCarrito([])} disabled={carrito.length === 0} className="py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 disabled:opacity-50">Cancelar</button>
              <button onClick={handleCobrar} disabled={carrito.length === 0} className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50">Cobrar e Imprimir</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}