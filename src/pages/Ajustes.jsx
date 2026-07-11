import { useState } from 'react';
import { useGymStore } from '../store/useGymStore';

const PERMISOS_DISPONIBLES = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'kiosco', label: '📷 Kiosco Acceso' },
  { id: 'miembros', label: '👥 Miembros' },
  { id: 'pos', label: '🛒 Punto de Venta' },
  { id: 'suscripciones', label: '💳 Suscripciones' },
  { id: 'inventario', label: '📦 Inventario' },
  { id: 'caja', label: '💵 Corte de Caja' },
  { id: 'ajustes', label: '⚙️ Ajustes' }
];

export default function Ajustes() {
  const { configuracion, actualizarConfiguracion, usuarios, agregarUsuario, editarUsuario, eliminarUsuario } = useGymStore();

  const estadoInicialForm = { nombre: '', rol: 'recepcionista', pin: '', permisos: ['pos', 'miembros'] };
  
  const [formData, setFormData] = useState(estadoInicialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarPin, setMostrarPin] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    u.rol.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('La imagen es demasiado grande. Máximo 2MB.');
      const reader = new FileReader();
      reader.onloadend = () => actualizarConfiguracion({ logo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarConfigTexto = (e) => {
    actualizarConfiguracion({ [e.target.name]: e.target.value });
  };

  const handleRolChange = (e) => {
    const nuevoRol = e.target.value;
    let permisosPredefinidos = [];
    
    if (nuevoRol === 'admin' || nuevoRol === 'gerente') permisosPredefinidos = PERMISOS_DISPONIBLES.map(p => p.id);
    else if (nuevoRol === 'subgerente') permisosPredefinidos = ['dashboard', 'miembros', 'pos', 'suscripciones', 'inventario', 'caja'];
    else permisosPredefinidos = ['pos', 'miembros'];

    setFormData({ ...formData, rol: nuevoRol, permisos: permisosPredefinidos });
  };

  const togglePermiso = (idPermiso) => {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(idPermiso)
        ? prev.permisos.filter(p => p !== idPermiso)
        : [...prev.permisos, idPermiso]
    }));
  };

  const generarPinAuto = () => {
    const nuevoPinGenerado = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, pin: nuevoPinGenerado });
  };

  const guardarUsuario = (e) => {
    e.preventDefault();
    if (formData.pin.length !== 4) return alert('El PIN debe ser exactamente de 4 dígitos.');
    
    if (usuarios.some(u => u.pin === formData.pin && u.id !== editandoId)) {
      return alert('Ese PIN ya está en uso. Genera otro para mantener la seguridad.');
    }

    if (editandoId) {
      editarUsuario(editandoId, formData);
      setEditandoId(null);
    } else {
      agregarUsuario(formData);
    }
    setFormData(estadoInicialForm);
    setMostrarPin(false);
  };

  const cargarParaEditar = (usuario) => {
    setEditandoId(usuario.id);
    setFormData({ nombre: usuario.nombre, rol: usuario.rol, pin: usuario.pin, permisos: usuario.permisos || [] });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData(estadoInicialForm);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Ajustes Generales</h2>
        <p className="text-slate-400 text-sm mt-1">Configuración gráfica y Centro de Control de Permisos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: IDENTIDAD Y TICKETS */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Identidad de Marca</h3>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden relative group">
                {configuracion?.logo ? (
                  <>
                    <img src={configuracion.logo} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                      <span className="text-xs text-white font-bold cursor-pointer">Cambiar</span>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-500 text-3xl">📷</span>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nombre del Negocio</label>
                <input type="text" name="nombreGym" value={configuracion.nombreGym || ''} onChange={handleGuardarConfigTexto} className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Diseño de Tickets</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Mensaje Cabecera</label>
                <textarea name="ticketCabecera" value={configuracion.ticketCabecera || ''} onChange={handleGuardarConfigTexto} rows="2" className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm resize-none focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Mensaje Pie de Ticket</label>
                <textarea name="ticketPie" value={configuracion.ticketPie || ''} onChange={handleGuardarConfigTexto} rows="2" className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm resize-none focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>


        {/* COLUMNA 2: GESTIÓN DE PERSONAL */}
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
            <span>Gestión de Personal</span>
            {editandoId && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">Modo Edición</span>}
          </h3>

          <form onSubmit={guardarUsuario} className="flex flex-col h-full">
            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Ej. Ana Pérez" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Rol Operativo</label>
                  <select value={formData.rol} onChange={handleRolChange} disabled={editandoId === 1} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-medium focus:outline-none focus:border-blue-500 disabled:opacity-50">
                    <option value="recepcionista">Recepcionista</option>
                    <option value="subgerente">Subgerente</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador Total</option>
                  </select>
                </div>

                {/* === AQUÍ ESTÁ LA CORRECCIÓN DEL PIN === */}
                <div className="w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">PIN (4 Dígitos)</label>
                  <div className="flex gap-2 w-full">
                    <input 
                      type={mostrarPin ? "text" : "password"} 
                      required maxLength="4" pattern="\d{4}" 
                      value={formData.pin} 
                      onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                      autoComplete="new-password" /* Bloquea el autocompletado del navegador */
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-black tracking-[0.3em] text-blue-400 focus:outline-none focus:border-blue-500" 
                      placeholder="0000" 
                    />
                    <button type="button" onClick={() => setMostrarPin(!mostrarPin)} className="flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors" title="Ver/Ocultar PIN">
                      {mostrarPin ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <button type="button" onClick={generarPinAuto} className="flex-none px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg transition-colors font-bold" title="Generar PIN Aleatorio">
                      🎲
                    </button>
                  </div>
                </div>
                {/* ===================================== */}

              </div>

              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 mt-4">
                <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Módulos Permitidos para este Usuario</label>
                <div className="grid grid-cols-2 gap-3">
                  {PERMISOS_DISPONIBLES.map(permiso => (
                    <label key={permiso.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={formData.permisos.includes(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                        disabled={formData.rol === 'admin'}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50" 
                      />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{permiso.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
              {editandoId && (
                <button type="button" onClick={cancelarEdicion} className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-slate-700">
                  Cancelar
                </button>
              )}
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">
                {editandoId ? '💾 Guardar Cambios' : '+ Agregar Nuevo Usuario'}
              </button>
            </div>
          </form>
        </div>


        {/* COLUMNA 3: DIRECTORIO DE PERSONAL */}
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Directorio de Personal</h3>
          
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 mb-4 flex items-center">
            <span className="pl-3 text-slate-500">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o rol..." 
              className="w-full px-3 py-2 bg-transparent focus:outline-none text-slate-100 text-sm" 
              value={busquedaUsuario} 
              onChange={(e) => setBusquedaUsuario(e.target.value)} 
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">No se encontraron usuarios.</div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div key={usuario.id} className={`flex items-center justify-between p-3.5 bg-slate-950 border rounded-2xl transition-all ${editandoId === usuario.id ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner ${usuario.rol === 'admin' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : usuario.rol.includes('gerente') ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'}`}>
                      {usuario.rol.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        {usuario.nombre} 
                        {usuario.id === 1 && <span title="Super Administrador" className="text-amber-400 text-xs drop-shadow-md">⭐</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{usuario.rol}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => cargarParaEditar(usuario)} className="text-slate-300 hover:text-white text-xs font-bold px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
                      Editar
                    </button>
                    {usuario.id !== 1 && (
                      <button onClick={() => { if(window.confirm(`¿Expulsar a ${usuario.nombre} del sistema?`)) eliminarUsuario(usuario.id) }} className="text-rose-400 hover:text-white text-xs font-bold px-3 py-2 bg-rose-500/10 hover:bg-rose-600 rounded-lg transition-colors border border-rose-500/20">
                        Borrar
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}