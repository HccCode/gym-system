import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  // Ahora guardamos TODO el objeto del usuario
  const [usuarioActual, setUsuarioActual] = useState(null);

  if (!usuarioActual) {
    return <Login onLoginExitoso={(user) => setUsuarioActual(user)} />;
  }

  // Verifica si el usuario tiene un permiso específico en su arreglo
  const tienePermiso = (permisoRequerido) => {
    return usuarioActual.permisos?.includes(permisoRequerido);
  };

  // Roles gerenciales aterrizan en Dashboard, los demás en POS
  const esGerencial = ['admin', 'gerente', 'subgerente'].includes(usuarioActual.rol);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout usuarioActual={usuarioActual} onLogout={() => setUsuarioActual(null)} />}>
          
          {/* PANTALLA PRINCIPAL DINÁMICA */}
          <Route index element={esGerencial ? <Dashboard /> : <Navigate to="/pos" replace />} />

          {/* RUTAS PROTEGIDAS POR CASILLAS DE PERMISOS */}
          <Route path="miembros" element={tienePermiso('miembros') ? <Miembros /> : <Navigate to="/" replace />} />
          <Route path="pos" element={tienePermiso('pos') ? <Pos /> : <Navigate to="/" replace />} />
          <Route path="suscripciones" element={tienePermiso('suscripciones') ? <Suscripciones /> : <Navigate to="/" replace />} />
          <Route path="inventario" element={tienePermiso('inventario') ? <Inventario /> : <Navigate to="/" replace />} />
          <Route path="caja" element={tienePermiso('caja') ? <Caja /> : <Navigate to="/" replace />} />
          <Route path="ajustes" element={tienePermiso('ajustes') ? <Ajustes /> : <Navigate to="/" replace />} />
        </Route>

        {/* Kiosco (solo si tiene permiso) */}
        <Route path="/checkin" element={tienePermiso('kiosco') ? <Checkin /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}