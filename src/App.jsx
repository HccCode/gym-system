import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGymStore } from './store/useGymStore';
import Layout from './layouts/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Miembros from './pages/Miembros';
import Inventario from './pages/Inventario';
import Pos from './pages/Pos';
import Suscripciones from './pages/Suscripciones';
import Checkin from './pages/Checkin';
import Caja from './pages/Caja';
import Ajustes from './pages/Ajustes';

const AccesoDenegado = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[50vh]">
    <span className="text-6xl mb-4">🚫</span>
    <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
    <p className="text-slate-400 text-center max-w-sm">
      Tu cuenta actual no tiene permisos asignados o están cargando. Pide a tu administrador que revise tus accesos.
    </p>
  </div>
);

export default function App() {
  const { usuarioActual, usuarios, cerrarSesion, sincronizarBD } = useGymStore();

  useEffect(() => {
    sincronizarBD();
  }, [sincronizarBD]);

  const tienePermiso = (permisoRequerido) => {
    if (usuarioActual?.rol === 'admin') return true; 
    const usuarioFresco = usuarios?.find(u => u.pin === usuarioActual?.pin) || usuarioActual;
    return usuarioFresco?.permisos?.includes(permisoRequerido);
  };

  // Redirección inteligente corregida para incluir el Kiosco de acceso
  const obtenerRutaInicial = () => {
    if (tienePermiso('pos')) return "/pos";
    if (tienePermiso('miembros')) return "/miembros";
    if (tienePermiso('kiosco')) return "/checkin"; // <-- CORRECCIÓN: Envía directo al panel de escaneo si solo tiene este permiso
    if (tienePermiso('inventario')) return "/inventario";
    if (tienePermiso('suscripciones')) return "/suscripciones";
    if (tienePermiso('caja')) return "/caja";
    if (tienePermiso('ajustes')) return "/ajustes";
    return "/login"; 
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            usuarioActual 
              ? <Navigate to="/" replace /> 
              : <Login onLoginExitoso={(user) => useGymStore.setState({ usuarioActual: user })} />
          } 
        />

        <Route 
          path="/" 
          element={
            usuarioActual 
              ? <Layout usuarioActual={usuarioActual} onLogout={cerrarSesion} /> 
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={
            tienePermiso('dashboard') ? <Dashboard /> : <Navigate to={obtenerRutaInicial()} replace />
          } />

          <Route path="miembros" element={tienePermiso('miembros') ? <Miembros /> : <AccesoDenegado />} />
          <Route path="pos" element={tienePermiso('pos') ? <Pos /> : <AccesoDenegado />} />
          <Route path="suscripciones" element={tienePermiso('suscripciones') ? <Suscripciones /> : <AccesoDenegado />} />
          <Route path="inventario" element={tienePermiso('inventario') ? <Inventario /> : <AccesoDenegado />} />
          <Route path="caja" element={tienePermiso('caja') ? <Caja /> : <AccesoDenegado />} />
          <Route path="ajustes" element={tienePermiso('ajustes') ? <Ajustes /> : <AccesoDenegado />} />
        </Route>

        <Route path="/checkin" element={
          tienePermiso('kiosco') ? <Checkin /> : <Navigate to="/" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}