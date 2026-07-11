import { useState, useEffect } from 'react';

export default function ModalProducto({ isOpen, onClose, onSave, productoAEditar }) {
  const [formData, setFormData] = useState({ nombre: '', categoria: 'Bebida', precio: '', stock: '' });

  // Si nos pasan un producto, llenamos el formulario; si no, lo limpiamos.
  useEffect(() => {
    if (productoAEditar) {
      setFormData({
        nombre: productoAEditar.nombre,
        categoria: productoAEditar.categoria,
        precio: productoAEditar.precio,
        stock: productoAEditar.stock
      });
    } else {
      setFormData({ nombre: '', categoria: 'Bebida', precio: '', stock: '' });
    }
  }, [productoAEditar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10),
      id: productoAEditar ? productoAEditar.id : undefined // Si estamos editando, pasamos su ID
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            {productoAEditar ? '✏️ Editar Producto' : '📦 Registrar Producto'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre del Producto</label>
            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="Ej. Agua 1L" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Categoría</label>
            <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium">
              <option value="Bebida">Bebida</option>
              <option value="Suplemento">Suplemento</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Precio ($)</label>
              <input type="number" step="0.50" min="0" name="precio" required value={formData.precio} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Stock Inicial</label>
              <input type="number" min="0" name="stock" required value={formData.stock} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" disabled={!!productoAEditar} />
              {productoAEditar && <p className="text-[10px] text-slate-500 mt-1">Usa "+ Stock" en la tabla para modificar</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20">
              {productoAEditar ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}