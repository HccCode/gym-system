import { useState } from 'react';
import { useGymStore } from '../store/useGymStore';
import TicketPos from '../components/TicketPos'; // <-- Importamos el ticket

export default function Pos() {
  const { productos, registrarVentaPos } = useGymStore();
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [carrito, setCarrito] = useState([]);
  
  // Estados para Modales y Tickets
  const [modalAviso, setModalAviso] = useState(null);
  const [ticketImpresion, setTicketImpresion] = useState(null);

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))];

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      return setModalAviso({ tipo: 'error', titulo: 'Agotado', mensaje: '¡Producto agotado!' });
    }
    
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          setModalAviso({ tipo: 'error', titulo: 'Stock Insuficiente', mensaje: 'No hay más stock disponible de este producto.' });
          return prev;
        }
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const cobrar = () => {
    if (carrito.length === 0) return;
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const folioStr = `POS-${Math.floor(10000 + Math.random() * 90000)}`;
    
    registrarVentaPos(carrito, total, folioStr);
    
    // Guardamos los datos para que el <TicketPos /> los renderice en segundo plano
    setTicketImpresion({ carrito, total, folio: folioStr });
    
    // Disparamos el Modal de Éxito
    setModalAviso({
      tipo: 'exito',
      titulo: 'Venta Exitosa',
      mensaje: `Cobro por $${total.toFixed(2)} registrado.`,
      onClose: () => {
        // Al cerrar el modal de éxito, imprimimos
        setTimeout(() => window.print(), 100);
      }
    });

    setCarrito([]);
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const obtenerIconoFallback = (categoria) => {
    const cat = categoria.toLowerCase();
    if (cat.includes('bebida') || cat.includes('agua')) return '🥤';
    if (cat.includes('suplemento') || cat.includes('proteina')) return '💊';
    if (cat.includes('snack') || cat.includes('comida')) return '🍫';
    if (cat.includes('ropa') || cat.includes('accesorio')) return '👕';
    return '📦';
  };

  return (
    <>
      {/* Componente invisible en pantalla, visible al imprimir */}
      {ticketImpresion && <TicketPos {...ticketImpresion} />}

      <div className="flex h-full gap-6 print:hidden">
        
        {/* IZQUIERDA: CATÁLOGO */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="space-y-4 mb-6 shrink-0">
            <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
              <input 
                type="text" 
                placeholder="🔍 Buscar bebidas o suplementos..." 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-100 shadow-inner" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {categorias.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    categoriaActiva === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {productosFiltrados.map((producto) => (
                <div 
                  key={producto.id} 
                  onClick={() => agregarAlCarrito(producto)}
                  className={`group flex flex-col bg-slate-900 border rounded-2xl p-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    producto.stock > 0 
                      ? 'border-slate-800 hover:border-blue-500 hover:bg-slate-800/80' 
                      : 'border-rose-900/30 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <div className="w-full h-24 sm:h-28 bg-slate-950 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-800/50 shadow-inner relative">
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        {obtenerIconoFallback(producto.categoria)}
                      </span>
                    )}
                    {producto.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest rotate-[-12deg]">Agotado</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{producto.categoria}</p>
                      <h4 className="text-sm font-bold text-white leading-tight mt-0.5 line-clamp-2">{producto.nombre}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="text-base font-black text-white">${producto.precio.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${producto.stock > 0 ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/10 text-rose-500'}`}>
                        {producto.stock} ud.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {productosFiltrados.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                  No se encontraron productos en esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DERECHA: CARRITO */}
        <div className="w-80 xl:w-96 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl shrink-0">
          <div className="bg-slate-950/80 px-6 py-5 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-500">🛒</span> Ticket Actual
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                <span className="text-6xl">🛍️</span>
                <p className="text-sm font-medium">El carrito está vacío</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center group">
                  <div className="flex-1 pr-3">
                    <h5 className="text-sm font-bold text-white leading-tight">{item.nombre}</h5>
                    <div className="text-xs text-slate-400 mt-1 font-medium">
                      {item.cantidad} x ${item.precio.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white">${(item.cantidad * item.precio).toFixed(2)}</span>
                    <button 
                      onClick={() => quitarDelCarrito(item.id)}
                      className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-950 p-6 border-t border-slate-800">
            <div className="flex justify-between items-end mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total a Pagar</span>
              <span className="text-3xl font-black text-white">${totalCarrito.toFixed(2)}</span>
            </div>
            <button 
              onClick={cobrar}
              disabled={carrito.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(5,150,105,0.2)] disabled:shadow-none"
            >
              Cobrar Ticket
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GLOBAL (Reemplaza los alerts ) */}
      {modalAviso && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="text-6xl mb-4">{modalAviso.tipo === 'error' ? '⚠️' : '✅'}</div>
            <h3 className="text-xl font-black text-white mb-2">{modalAviso.titulo}</h3>
            <p className="text-slate-400 mb-6">{modalAviso.mensaje}</p>
            <button
              onClick={() => {
                const closeAction = modalAviso.onClose;
                setModalAviso(null);
                if (closeAction) closeAction();
              }}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                modalAviso.tipo === 'error' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {modalAviso.tipo === 'error' ? 'Entendido' : 'Imprimir Ticket'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}