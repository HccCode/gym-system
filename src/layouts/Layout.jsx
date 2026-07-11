import { Outlet, Link, useLocation } from 'react-router-dom';
import { useGymStore } from '../store/useGymStore';

export default function Layout({ usuarioActual, onLogout }) {
  const location = useLocation();
  const { configuracion } = useGymStore();

  // Estilo "Forja": Fondo rojo sangre con un resplandor agresivo
  const isActive = (path) => location.pathname === path 
    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] font-bold" 
    : "text-stone-400 hover:bg-stone-900 hover:text-stone-200 transition-colors";

const puedeVer = (permiso) => {
    // Si es admin, o si es un usuario con caché viejo sin permisos definidos, le damos acceso
    if (usuarioActual?.rol === 'admin' || !usuarioActual?.permisos) return true;
    
    // De lo contrario, revisamos si tiene el permiso específico
    return usuarioActual.permisos.includes(permiso);
  };

  return (
    <div className="flex h-screen bg-[#0c0c0c] font-sans text-stone-200 print:bg-white">
      
      {/* Sidebar Carbón */}
      <aside className="w-64 bg-[#111111] flex flex-col border-r border-stone-800/60 relative z-20 print:hidden">
        
        <div className="p-6 border-b border-stone-800/60 flex flex-col items-center justify-center gap-3 min-h-[6rem]">
          {configuracion?.logo && (
            <img 
              src={configuracion.logo} 
              alt="Logo Gym" 
              className="max-h-14 max-w-[12rem] object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.2)]" 
            />
          )}
          <h1 className="text-xl font-black text-white tracking-tighter text-center uppercase">
            {configuracion?.nombreGym || 'GYM'}
          </h1>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {usuarioActual.rol === 'recepcionista' && puedeVer('pos') && (
            <Link to="/pos" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/pos')}`}>🛒 Punto de Venta</Link>
          )}

          {puedeVer('dashboard') && <Link to="/" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/')}`}>📊 Dashboard</Link>}
          {puedeVer('kiosco') && <Link to="/checkin" className={`hidden md:block xl:hidden px-4 py-3 rounded-lg text-sm ${isActive('/checkin')}`}>📷 Kiosco Acceso</Link>}
          {puedeVer('miembros') && <Link to="/miembros" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/miembros')}`}>👥 Miembros</Link>}
          
          {usuarioActual.rol !== 'recepcionista' && puedeVer('pos') && (
            <Link to="/pos" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/pos')}`}>🛒 Punto de Venta</Link>
          )}

          {puedeVer('suscripciones') && <Link to="/suscripciones" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/suscripciones')}`}>💳 Suscripciones</Link>}
          {puedeVer('inventario') && <Link to="/inventario" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/inventario')}`}>📦 Inventario</Link>}
          {puedeVer('caja') && <Link to="/caja" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/caja')}`}>💵 Corte de Caja</Link>}
          
          {puedeVer('ajustes') && (
            <div className="pt-4 mt-4 border-t border-stone-800/60">
              <Link to="/ajustes" className={`block px-4 py-3 rounded-lg text-sm ${isActive('/ajustes')}`}>⚙️ Ajustes</Link>
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-stone-800/60 text-xs font-black tracking-widest text-center text-stone-600 uppercase">
          GYM<span className="text-red-600">SYSTEM</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10 print:overflow-visible">
        
        <header className="bg-[#111111]/90 backdrop-blur-md border-b border-stone-800/60 h-16 flex items-center justify-between px-8 sticky top-0 z-30 print:hidden">
          <h2 className="text-md font-bold text-stone-300 capitalize">
            Panel de {usuarioActual.rol}
          </h2>
          
          <div className="flex items-center gap-4 bg-[#1a1a1a] border border-stone-800 pl-2 pr-4 py-1.5 rounded-md">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white font-black text-xs bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]">
              {usuarioActual.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-stone-300">
              {usuarioActual.nombre}
            </span>
            <div className="w-px h-4 bg-stone-700"></div>
            <button onClick={onLogout} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1">
              BLOQUEAR
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#0c0c0c] print:p-0">
          <Outlet context={{ rol: usuarioActual.rol }} /> 
        </div>
      </main>
    </div>
  );
}