import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGymStore } from './store/useGymStore'; // ¡IMPORTANTE! Conectamos la memoria global
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

// Creamos una pantalla de seguridad simple para evitar los bucles de redirección
const AccesoDenegado = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full">
    <span className="text-6xl mb-4">🚫</span>
    <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
    <p className="text-slate-400">Tu rol actual no tiene permisos para ver este módulo.</p>
  </div>
);

export default function App() {
  // 1. Ahora leemos al usuario directamente de la base de datos persistente (Zustand)
  // Esto evita que se cierre tu sesión al presionar F5 o al entrar por una IP
  const { usuarioActual, cerrarSesion } = useGymStore();

  // 2. Regla de oro: Si es admin ve todo, si no, revisamos sus casillas
  const tienePermiso = (permisoRequerido) => {
    if (usuarioActual?.rol === 'admin') return true; 
    return usuarioActual?.permisos?.includes(permisoRequerido);
  };

  // 3. Roles gerenciales
  const esGerencial = ['admin', 'gerente', 'subgerente'].includes(usuarioActual?.rol);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* ========================================== */}
        {/* ZONA PÚBLICA (LOGIN) */}
        {/* ========================================== */}
        <Route 
          path="/login" 
          element={
            usuarioActual 
              ? <Navigate to="/" replace /> 
              : <Login onLoginExitoso={(user) => useGymStore.setState({ usuarioActual: user })} />
          } 
        />

        {/* ========================================== */}
        {/* ZONA PRIVADA (SISTEMA) */}
        {/* ========================================== */}
        <Route 
          path="/" 
          element={
            usuarioActual 
              ? <Layout usuarioActual={usuarioActual} onLogout={cerrarSesion} /> 
              : <Navigate to="/login" replace />
          }
        >
          {/* RUTA RAÍZ DINÁMICA */}
          <Route index element={
            esGerencial ? <Dashboard /> : 
            tienePermiso('pos') ? <Navigate to="/pos" replace /> : 
            <Navigate to="/miembros" replace />
          } />

          {/* RUTAS PROTEGIDAS: En lugar de un <Navigate> que causa bucles, mostramos <AccesoDenegado /> */}
          <Route path="miembros" element={tienePermiso('miembros') ? <Miembros /> : <AccesoDenegado />} />
          <Route path="pos" element={tienePermiso('pos') ? <Pos /> : <AccesoDenegado />} />
          <Route path="suscripciones" element={tienePermiso('suscripciones') ? <Suscripciones /> : <AccesoDenegado />} />
          <Route path="inventario" element={tienePermiso('inventario') ? <Inventario /> : <AccesoDenegado />} />
          <Route path="caja" element={tienePermiso('caja') ? <Caja /> : <AccesoDenegado />} />
          <Route path="ajustes" element={tienePermiso('ajustes') ? <Ajustes /> : <AccesoDenegado />} />
        </Route>

        {/* ========================================== */}
        {/* ZONA AISLADA (KIOSCO) */}
        {/* ========================================== */}
        <Route path="/checkin" element={
          tienePermiso('kiosco') ? <Checkin /> : <Navigate to="/" replace />
        } />

        {/* CUALQUIER OTRA URL INVENTADA VA A LA RAÍZ */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}