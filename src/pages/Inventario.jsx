import { useState } from 'react';
import ModalProducto from '../components/ModalProducto';
import { useGymStore } from '../store/useGymStore'; 

export default function Inventario() {
  const { productos, agregarProducto, surtirProducto, editarProducto, eliminarProducto } = useGymStore(); 
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);

  const handleGuardarFormulario = (datosProducto) => {
    if (datosProducto.id) {
      editarProducto(datosProducto.id, datosProducto);
    } else {
      agregarProducto(datosProducto);
    }
  };

  const handleAbrirParaEditar = (producto) => {
    setProductoAEditar(producto);
    setIsModalOpen(true);
  };

  const handleAbrirParaCrear = () => {
    setProductoAEditar(null);
    setIsModalOpen(true);
  };

  const handleEliminar = (id, nombre) => {
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar "${nombre}" del catálogo?\nEsta acción no se puede deshacer.`)) {
      eliminarProducto(id);
    }
  };

  const handleSurtir = (id, nombreActual) => {
    const cantidadStr = window.prompt(`¿Cuántas unidades de "${nombreActual}" ingresaron al almacén?`);
    if (cantidadStr) {
      const cantidad = parseInt(cantidadStr, 10);
      if (!isNaN(cantidad) && cantidad > 0) {
        surtirProducto(id, cantidad);
      }
    }
  };

  const productosFiltrados = productos.filter(p => 
    (p.nombre.toLowerCase().includes(busqueda.toLowerCase())) && 
    (filtroCategoria === 'Todos' || p.categoria === filtroCategoria)
  );

  const estadoStock = (stock) => {
    if (stock === 0) return { texto: 'Agotado', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    if (stock <= 5) return { texto: 'Stock Bajo', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { texto: 'Suficiente', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Control de Inventario</h2>
          <p className="text-slate-400 text-sm mt-1">Supervisa tus existencias para el Punto de Venta.</p>
        </div>
        <button onClick={handleAbrirParaCrear} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30">
          + Nuevo Producto
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="🔍 Buscar producto..." className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-100" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 font-medium" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="Todos">Todas las categorías</option>
          <option value="Bebida">Bebidas</option>
          <option value="Suplemento">Suplementos</option>
          <option value="Snack">Snacks</option>
        </select>
      </div>

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
                <th className="p-5 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {productosFiltrados.map((producto) => {
                const estado = estadoStock(producto.stock);
                return (
                  <tr key={producto.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 font-bold text-white group-hover:text-blue-400 transition-colors">{producto.nombre}</td>
                    <td className="p-5 text-sm font-medium text-slate-400">{producto.categoria}</td>
                    <td className="p-5 text-sm font-black text-slate-200">${producto.precio.toFixed(2)}</td>
                    <td className="p-5 font-bold text-white">{producto.stock} <span className="text-slate-500 text-xs font-normal">unids.</span></td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${estado.color}`}>{estado.texto}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {/* Botón Editar rediseñado */}
                        <button onClick={() => handleAbrirParaEditar(producto)} className="px-3 py-1 bg-slate-600/20 text-slate-300 hover:bg-slate-600 hover:text-white rounded-lg font-bold transition-colors">
                          Editar
                        </button>
                        {/* Botón Borrar rediseñado */}
                        <button onClick={() => handleEliminar(producto.id, producto.nombre)} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg font-bold transition-colors">
                          Borrar
                        </button>
                        {/* Botón + Stock original */}
                        <button onClick={() => handleSurtir(producto.id, producto.nombre)} className="px-3 py-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg font-bold transition-colors">
                          + Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <ModalProducto 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleGuardarFormulario} 
        productoAEditar={productoAEditar}
      />
    </div>
  );
}