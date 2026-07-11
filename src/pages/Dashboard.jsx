import { useGymStore } from '../store/useGymStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function Dashboard() {
  // Extraemos las métricas reales de tu Zustand
  const { ingresosHoy, asistenciasHoy, ventasRealizadas, miembros } = useGymStore();

  // Calculamos cuántos miembros están activos actualmente
  const miembrosActivos = miembros.filter(m => m.estado === 'Activo').length;
  const porcentajeActivos = miembros.length > 0 ? Math.round((miembrosActivos / miembros.length) * 100) : 0;

  // Generamos datos para la gráfica. 
  // Combinamos días anteriores (simulados) con el día de "Hoy" (conectado a tus datos reales)
  const datosSemana = [
    { dia: 'Lun', ingresos: 1250, asistencias: 45 },
    { dia: 'Mar', ingresos: 850, asistencias: 52 },
    { dia: 'Mié', ingresos: 2100, asistencias: 38 },
    { dia: 'Jue', ingresos: 450, asistencias: 65 },
    { dia: 'Vie', ingresos: 3200, asistencias: 48 },
    { dia: 'Sáb', ingresos: 1500, asistencias: 25 },
    { dia: 'Hoy', ingresos: ingresosHoy, asistencias: asistenciasHoy }, // ¡Tus datos en vivo!
  ];

  // Componente personalizado para el Tooltip (el cuadrito que sale al pasar el mouse)
  const CustomTooltip = ({ active, payload, label, tipo }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-slate-300 font-bold mb-1">{label}</p>
          <p className={`font-black ${tipo === 'ingresos' ? 'text-emerald-400' : 'text-blue-400'}`}>
            {tipo === 'ingresos' ? '$' : ''}{payload[0].value} {tipo === 'ingresos' ? 'MXN' : 'personas'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Dashboard General</h2>
        <p className="text-slate-400 text-sm mt-1">Resumen operativo y financiero de tu sucursal.</p>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Ingresos Hoy</p>
          <h3 className="text-4xl font-black text-white mb-1">${ingresosHoy.toFixed(2)}</h3>
          <p className="text-emerald-400 text-sm font-semibold flex items-center gap-1"><span>📈</span> + En vivo</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Asistencias Hoy</p>
          <h3 className="text-4xl font-black text-white mb-1">{asistenciasHoy}</h3>
          <p className="text-blue-400 text-sm font-semibold flex items-center gap-1"><span>📱</span> Accesos por QR</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Ventas del Día</p>
          <h3 className="text-4xl font-black text-white mb-1">{ventasRealizadas}</h3>
          <p className="text-purple-400 text-sm font-semibold flex items-center gap-1"><span>🛒</span> Artículos y Meses</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Miembros Activos</p>
          <h3 className="text-4xl font-black text-white mb-1">{miembrosActivos}</h3>
          <p className="text-amber-400 text-sm font-semibold flex items-center gap-1"><span>👥</span> {porcentajeActivos}% del total</p>
        </div>

      </div>

      {/* Sección de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica de Ingresos */}
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Ingresos de la Semana</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip tipo="ingresos" />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                <Bar dataKey="ingresos" fill="#34d399" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Asistencias */}
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Flujo de Asistencias</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAsistencias" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip tipo="asistencias" />} />
                <Area type="monotone" dataKey="asistencias" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAsistencias)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}