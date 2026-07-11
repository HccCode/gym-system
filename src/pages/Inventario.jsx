import { useState } from 'react';
import { useGymStore } from '../store/useGymStore';

export default function Inventario() {
  const { productos, agregarProducto, editarProducto, eliminarProducto, surtirProducto } = useGymStore();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  
  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemABorrar, setItemABorrar] = useState(null);
  const [itemASurtir, setItemASurtir] = useState(null);
  
  const [editandoId, setEditandoId] = useState(null);
  const [cantidadSurtirForm, setCantidadSurtirForm] = useState('');

  const estadoInicial = { nombre: '', categoria: 'Bebida', precio: '', stock: '', imagen: null };
  const [formData, setFormData] = useState(estadoInicial);

  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.categoria))];

  const productosFiltrados = productos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    return coincideNombre && coincideCat;
  });

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData(estadoInicial);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setEditandoId(producto.id);
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen || null
    });
    setIsModalOpen(true);
  };

  const handleSubirImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('La imagen es demasiado grande. Máximo 2MB.');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarProducto = (e) => {
    e.preventDefault();
    const productoProcesado = {
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock)
    };

    if (editandoId) {
      editarProducto(editandoId, productoProcesado);
    } else {
      agregarProducto(productoProcesado);
    }
    setIsModalOpen(false);
  };

  // Funciones de confirmación con modales
  const confirmarBorrado = () => {
    eliminarProducto(itemABorrar.id);
    setItemABorrar(null);
  };

  const confirmarSurtido = (e) => {
    e.preventDefault();
    const cantidad = parseInt(cantidadSurtirForm);
    if (!isNaN(cantidad) && cantidad > 0) {
      surtirProducto(itemASurtir.id, cantidad);
      setItemASurtir(null);
      setCantidadSurtirForm('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Control de Inventario</h2>
          <p className="text-slate-400 text-sm mt-1">Supervisa tus existencias para el Punto de Venta.</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30">
          + Nuevo Producto
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl shadow-lg border border-slate-800 flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-3 text-slate-500">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar producto..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-100" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>
        <select 
          className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-100 font-medium cursor-pointer"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas las categorías' : cat}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                <th className="p-5 font-bold">Producto</th>
                <th className="p-5 font-bold">Categoría</th>
                <th className="p-5 font-bold">Precio</th>
                <th className="p-5 font-bold">Stock</th>
                <th className="p-5 font-bold">Estado</th>
                <th className="p-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {productosFiltrados.map((producto) => (
                <tr key={producto.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div className="font-bold text-white text-sm">{producto.nombre}</div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-medium text-slate-300">{producto.categoria}</span>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-black text-white">${producto.precio.toFixed(2)}</span>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-bold text-white">{producto.stock} <span className="text-slate-500 text-xs font-normal">unids.</span></span>
                  </td>
                  <td className="p-5">
                    {producto.stock > 10 ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">Suficiente</span>
                    ) : producto.stock > 0 ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">Poco Stock</span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold">Agotado</span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirModalEditar(producto)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors border border-slate-700">
                        Editar
                      </button>
                      <button onClick={() => setItemABorrar(producto)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg text-xs font-bold transition-colors border border-rose-500/20">
                        Borrar
                      </button>
                      <button onClick={() => { setItemASurtir(producto); setCantidadSurtirForm(''); }} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-colors border border-blue-500/30">
                        + Stock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: AÑADIR/EDITAR PRODUCTO */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-lg font-bold text-white">
                {editandoId ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={guardarProducto} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center mb-2">
                <div className="w-32 h-32 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative group mb-3">
                  {formData.imagen ? (
                    <img src={formData.imagen} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl block mb-1">📸</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Subir Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleSubirImagen} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {formData.imagen && (
                  <button type="button" onClick={() => setFormData({...formData, imagen: null})} className="text-xs text-rose-500 hover:text-rose-400 font-bold">
                    Quitar imagen
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre del Producto</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="Ej. Agua Mineral 1L" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Categoría</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium cursor-pointer">
                  <option value="Bebida">Bebida</option>
                  <option value="Suplemento">Suplemento</option>
                  <option value="Snack">Snack</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Precio ($)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Stock Inicial</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="0" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6 sticky bottom-0 bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                  {editandoId ? 'Guardar Cambios' : 'Añadir Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {/* ========================================== */}
      {itemABorrar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-black text-white mb-2">¿Eliminar Producto?</h3>
            <p className="text-slate-400 mb-6 text-sm">Estás a punto de borrar <span className="font-bold text-white">{itemABorrar.nombre}</span> del inventario. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setItemABorrar(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Cancelar</button>
              <button onClick={confirmarBorrado} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: AÑADIR STOCK */}
      {/* ========================================== */}
      {itemASurtir && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-black text-white mb-2">Ingresar Inventario</h3>
            <p className="text-slate-400 mb-6 text-sm">¿Cuántas unidades nuevas ingresan de <span className="font-bold text-white">{itemASurtir.nombre}</span>?</p>
            <form onSubmit={confirmarSurtido}>
              <input 
                type="number" 
                autoFocus 
                required 
                min="1" 
                value={cantidadSurtirForm} 
                onChange={(e) => setCantidadSurtirForm(e.target.value)} 
                className="w-full text-center text-2xl font-black px-4 py-4 mb-6 bg-slate-950 border border-blue-500/50 rounded-xl focus:outline-none focus:border-blue-500 text-white shadow-inner" 
                placeholder="0" 
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setItemASurtir(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20">Añadir Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}