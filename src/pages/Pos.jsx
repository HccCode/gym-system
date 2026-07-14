import { useState } from 'react';
import { useGymStore } from '../store/useGymStore';
import TicketPos from '../components/TicketPos';
import TicketMembresia from '../components/TicketMembresia';
import ModalMiembro from '../components/ModalMiembro';

export default function Pos() {
  const { productos, planes, miembros, registrarVentaPos, registrarMiembroConSuscripcion } = useGymStore();
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [carrito, setCarrito] = useState([]);
  
  const [modalAviso, setModalAviso] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [ticketMembresia, setTicketMembresia] = useState(null);

  // Extraemos las categorías únicas y definimos la primera como activa por defecto
  const categorias = [...new Set(productos.map(p => p.categoria))];
  const currentCategory = categorias.includes(categoriaActiva) ? categoriaActiva : (categorias[0] || '');

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = p.categoria === currentCategory;
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

  const solicitarConfirmacionCarrito = () => {
    if (carrito.length === 0) return;
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    setModalConfirmacion({
      titulo: 'Confirmar Venta',
      mensaje: `¿Estás seguro de cobrar un total de $${total.toFixed(2)} por los artículos del carrito?`,
      onConfirm: () => procesarCobroCarrito(total)
    });
  };

  const procesarCobroCarrito = (total) => {
    setModalConfirmacion(null);
    const folioStr = `POS-${Math.floor(10000 + Math.random() * 90000)}`;
    
    registrarVentaPos(carrito, total, folioStr);
    
    setTicketMembresia(null);
    setTicketVenta({ carrito, total, folio: folioStr });
    
    setModalAviso({
      tipo: 'exito',
      titulo: 'Venta Exitosa',
      mensaje: `Cobro por $${total.toFixed(2)} registrado exitosamente.`,
      onClose: () => setTimeout(() => window.print(), 100)
    });

    setCarrito([]);
  };

  const handleGuardarMiembro = (datosMiembro) => {
    const planIdSeleccionado = datosMiembro.planId ? planes.find(p => p.id === parseInt(datosMiembro.planId)) : null;

    if (!planIdSeleccionado) {
      return setModalAviso({ tipo: 'error', titulo: 'Plan Requerido', mensaje: 'Debes seleccionar un plan para inscribir al cliente.' });
    }

    const telefonoNuevo = datosMiembro.telefono ? datosMiembro.telefono.replace(/\D/g, '') : '';
    const nombreNuevo = datosMiembro.nombre ? datosMiembro.nombre.trim().toLowerCase() : '';

    const miembroExistente = miembros.find(m => {
      const nombreMatch = m.nombre.trim().toLowerCase() === nombreNuevo;
      const telefonoExistente = m.telefono ? m.telefono.replace(/\D/g, '') : '';
      const telefonoMatch = telefonoNuevo && telefonoExistente === telefonoNuevo;
      return nombreMatch || telefonoMatch;
    });

    if (miembroExistente) {
      return setModalAviso({
        tipo: 'error',
        titulo: 'Miembro Ya Existente',
        mensaje: `El cliente "${miembroExistente.nombre}" ya está registrado en el sistema central.`
      });
    }

    setModalConfirmacion({
      titulo: 'Confirmar Inscripción',
      mensaje: `¿Cobrar $${planIdSeleccionado.precio.toFixed(2)} por la inscripción de ${datosMiembro.nombre}?`,
      onConfirm: () => procesarInscripcionMiembro(datosMiembro, planIdSeleccionado)
    });
  };

  const procesarInscripcionMiembro = (datosMiembro, planIdSeleccionado) => {
    setModalConfirmacion(null);
    const folioStr = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
    
    registrarMiembroConSuscripcion(datosMiembro, planIdSeleccionado, folioStr);

    const hoy = new Date();
    hoy.setDate(hoy.getDate() + planIdSeleccionado.duracionDias);

    setTicketVenta(null);
    setTicketMembresia({
      miembro: { ...datosMiembro, matricula: 'GENERANDO...' },
      plan: planIdSeleccionado,
      total: planIdSeleccionado.precio,
      folio: folioStr,
      nuevaFecha: hoy.toISOString().split('T')[0]
    });

    setModalAviso({
      tipo: 'exito',
      titulo: 'Inscripción Exitosa',
      mensaje: `El cliente ${datosMiembro.nombre} ha sido inscrito y se registró el cobro.`,
      onClose: () => setTimeout(() => window.print(), 100)
    });
    
    setIsModalRegistroOpen(false);
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
      {ticketVenta && <TicketPos {...ticketVenta} />}
      {ticketMembresia && <TicketMembresia {...ticketMembresia} />}

      <ModalMiembro isOpen={isModalRegistroOpen} onClose={() => setIsModalRegistroOpen(false)} onSave={handleGuardarMiembro} miembroAEditar={null} />

      <div className="flex h-full gap-6 print:hidden">
        
        {/* IZQUIERDA: CATÁLOGO */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="space-y-4 mb-6 shrink-0">
            <div className="bg-[#111111] p-2 rounded-xl border border-stone-800/60 shadow-lg">
              <input 
                type="text" 
                placeholder="🔍 Buscar bebidas o suplementos..." 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-stone-800/60 rounded-lg focus:outline-none focus:border-red-500 text-stone-200 transition-colors" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {categorias.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    currentCategory === cat 
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' 
                      : 'bg-[#111111] text-stone-400 border border-stone-800/60 hover:bg-[#1a1a1a] hover:text-white'
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
                  className={`group flex flex-col bg-[#111111] border rounded-xl p-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    producto.stock > 0 
                      ? 'border-stone-800/60 hover:border-red-500' 
                      : 'border-stone-900 opacity-50 grayscale'
                  }`}
                >
                  <div className="w-full h-24 sm:h-28 bg-[#1a1a1a] rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-stone-800/60 relative">
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        {obtenerIconoFallback(producto.categoria)}
                      </span>
                    )}
                    {producto.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest">Agotado</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest truncate">{producto.categoria}</p>
                      <h4 className="text-sm font-bold text-stone-200 leading-tight mt-0.5 line-clamp-2">{producto.nombre}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="text-base font-black text-white">${producto.precio.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${producto.stock > 0 ? 'bg-[#1a1a1a] text-stone-400 border border-stone-800' : 'bg-red-900/20 text-red-500 border border-red-900/30'}`}>
                        {producto.stock} ud.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {productosFiltrados.length === 0 && (
                <div className="col-span-full py-12 text-center text-stone-500 font-bold uppercase tracking-widest">
                  No se encontraron productos en esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DERECHA: INSCRIPCIÓN Y CARRITO */}
        <div className="w-80 xl:w-96 flex flex-col gap-4 shrink-0">
          <div className="bg-[#111111] border border-stone-800/60 rounded-xl p-4 shadow-lg">
            <button 
              onClick={() => setIsModalRegistroOpen(true)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black tracking-wide transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2"
            >
              <span className="text-xl">📝</span> INSCRIBIR MIEMBRO
            </button>
          </div>

          <div className="flex-1 bg-[#111111] border border-stone-800/60 rounded-xl flex flex-col overflow-hidden shadow-lg">
            <div className="bg-[#1a1a1a] px-6 py-4 border-b border-stone-800/60">
              <h3 className="text-md font-bold text-stone-200 flex items-center gap-2">
                <span className="text-red-500">🛒</span> Ticket Actual
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-3">
                  <span className="text-6xl opacity-50">🛍️</span>
                  <p className="text-sm font-bold uppercase tracking-wider">El carrito está vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="bg-[#1a1a1a] border border-stone-800/60 rounded-lg p-3 flex justify-between items-center group">
                    <div className="flex-1 pr-3">
                      <h5 className="text-sm font-bold text-stone-200 leading-tight">{item.nombre}</h5>
                      <div className="text-xs text-stone-500 mt-1 font-medium">
                        {item.cantidad} x ${item.precio.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white">${(item.cantidad * item.precio).toFixed(2)}</span>
                      <button 
                        onClick={() => quitarDelCarrito(item.id)}
                        className="w-7 h-7 rounded-md bg-stone-800 text-stone-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors border border-stone-700 hover:border-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#1a1a1a] p-6 border-t border-stone-800/60">
              <div className="flex justify-between items-end mb-4">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">Total a Pagar</span>
                <span className="text-3xl font-black text-white">${totalCarrito.toFixed(2)}</span>
              </div>
              <button 
                onClick={solicitarConfirmacionCarrito}
                disabled={carrito.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 disabled:text-stone-600 text-white rounded-lg font-black text-lg transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)] disabled:shadow-none"
              >
                Cobrar Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-stone-800/60 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-sm p-8 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{modalConfirmacion.titulo}</h3>
            <p className="text-stone-400 mb-8 font-medium text-lg">{modalConfirmacion.mensaje}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfirmacion(null)}
                className="w-full py-3.5 rounded-lg font-bold text-stone-300 bg-[#1a1a1a] hover:bg-stone-800 transition-all border border-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacion.onConfirm}
                className="w-full py-3.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all"
              >
                Sí, Cobrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AVISO CON CIERRE FLEXIBLE */}
      {modalAviso && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111111] border border-stone-800/60 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-md p-8 text-center animate-scaleIn">
            <div className="text-6xl mb-4">{modalAviso.tipo === 'error' ? '⚠️' : '✅'}</div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{modalAviso.titulo}</h3>
            <p className="text-stone-400 mb-6 text-sm leading-relaxed">{modalAviso.mensaje}</p>
            
            {modalAviso.tipo === 'error' ? (
              <button
                onClick={() => {
                  const closeAction = modalAviso.onClose;
                  setModalAviso(null);
                  if (closeAction) closeAction();
                }}
                className="w-full py-3.5 rounded-lg font-bold text-white transition-all shadow-lg text-sm tracking-wide bg-stone-800 hover:bg-stone-700 border border-stone-700"
              >
                ENTENDIDO / CERRAR
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const closeAction = modalAviso.onClose;
                    setModalAviso(null);
                    if (closeAction) closeAction();
                  }}
                  className="w-full py-3.5 rounded-lg font-bold text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] text-sm tracking-wide bg-red-600 hover:bg-red-500"
                >
                  IMPRIMIR COMPROBANTE
                </button>
                <button
                  onClick={() => {
                    setModalAviso(null);
                    setTicketVenta(null);
                    setTicketMembresia(null);
                  }}
                  className="w-full py-3.5 rounded-lg font-bold text-stone-400 transition-all text-sm tracking-wide bg-[#1a1a1a] hover:bg-stone-800 border border-stone-800"
                >
                  CERRAR SIN IMPRIMIR
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}