import { useState, useEffect } from 'react';

export default function ModalPlan({ isOpen, onClose, onSave, planAEditar }) {
  const [formData, setFormData] = useState({ nombre: '', precio: '', duracionDias: '', descripcion: '' });

  useEffect(() => {
    if (planAEditar) {
      setFormData({
        nombre: planAEditar.nombre,
        precio: planAEditar.precio,
        duracionDias: planAEditar.duracionDias,
        descripcion: planAEditar.descripcion
      });
    } else {
      setFormData({ nombre: '', precio: '', duracionDias: '', descripcion: '' });
    }
  }, [planAEditar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      precio: parseFloat(formData.precio),
      duracionDias: parseInt(formData.duracionDias, 10),
      id: planAEditar ? planAEditar.id : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">{planAEditar ? '✏️ Editar Plan' : '💳 Crear Plan'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Nombre del Plan</label>
            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Precio ($)</label>
              <input type="number" step="0.50" min="0" name="precio" required value={formData.precio} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Duración (Días)</label>
              <input type="number" min="1" name="duracionDias" required value={formData.duracionDias} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Descripción</label>
            <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium resize-none"></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20">{planAEditar ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}