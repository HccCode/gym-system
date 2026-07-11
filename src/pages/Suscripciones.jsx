import { useState } from 'react';
import ModalPlan from '../components/ModalPlan';
import { useGymStore } from '../store/useGymStore'; 

export default function Suscripciones() {
  const { planes, agregarPlan, editarPlan, eliminarPlan } = useGymStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planAEditar, setPlanAEditar] = useState(null);

  const handleGuardarFormulario = (datosPlan) => {
    if (datosPlan.id) {
      editarPlan(datosPlan.id, datosPlan);
    } else {
      agregarPlan(datosPlan);
    }
  };

  const handleEliminar = (id, nombre) => {
    if (window.confirm(`⚠️ ¿Deseas eliminar el plan "${nombre}"?\nLos miembros actuales no perderán sus días, pero ya no podrás vender este plan.`)) {
      eliminarPlan(id);
    }
  };

  const abrirModalCrear = () => {
    setPlanAEditar(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (plan) => {
    setPlanAEditar(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Planes de Membresía</h2>
          <p className="text-slate-400 text-sm mt-1">Configura los paquetes que ofreces a tus clientes.</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30">
          + Crear Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {planes.map((plan) => (
          <div key={plan.id} className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-8 pb-6 border-b border-slate-800/50 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold text-slate-200 mb-4">{plan.nombre}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white tracking-tighter">${plan.precio.toFixed(0)}</span>
                <span className="text-slate-500 font-bold">MXN</span>
              </div>
            </div>
            
            <div className="p-8 pt-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6 bg-slate-950/50 px-4 py-3 rounded-xl border border-slate-800/50">
                <span className="text-sm text-slate-400 font-semibold">Vigencia:</span>
                <span className="text-sm text-blue-400 font-black tracking-wide">{plan.duracionDias} {plan.duracionDias === 1 ? 'DÍA' : 'DÍAS'}</span>
              </div>
              <p className="text-slate-400 text-sm flex-1 mb-8 leading-relaxed">{plan.descripcion}</p>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => abrirModalEditar(plan)} className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-sm font-bold transition-colors">
                  Editar
                </button>
                <button onClick={() => handleEliminar(plan.id, plan.nombre)} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 py-3 rounded-xl text-sm font-bold transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ModalPlan isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleGuardarFormulario} planAEditar={planAEditar} />
    </div>
  );
}