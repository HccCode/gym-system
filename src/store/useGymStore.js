import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 🌐 IP Dinámica: Detecta automáticamente si estás en la PC (localhost) o en la Tablet (IP)
const API_URL = `http://${window.location.hostname}:3000/api`;

export const useGymStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 1. ESTADOS LOCALES (Configuración y Sesión)
      // ==========================================
      usuarioActual: null,
      configuracion: { nombreGym: 'GYMSYSTEM', ticketCabecera: '¡Bienvenido a tu entrenamiento!', ticketPie: 'Gracias por tu preferencia.' },
      usuarios: [
        { id: 1, rol: 'admin', pin: '1234', nombre: 'Administrador Principal', permisos: ['dashboard', 'kiosco', 'miembros', 'pos', 'suscripciones', 'inventario', 'caja', 'ajustes'] },
        { id: 2, rol: 'recepcionista', pin: '0000', nombre: 'Recepción', permisos: ['pos', 'miembros'] }
      ],

      // ==========================================
      // 2. ESTADOS DINÁMICOS (Vienen de PostgreSQL)
      // ==========================================
      productos: [],
      planes: [],
      miembros: [],
      movimientosCaja: [],
      historialCortes: [],
      ingresosHoy: 0,
      ventasRealizadas: 0,
      asistenciasHoy: 0,

      // ==========================================
      // 3. LA CONEXIÓN: SINCRONIZACIÓN MAESTRA
      // ==========================================
      sincronizarBD: async () => {
        try {
          // Solicitamos todo al servidor Node.js al mismo tiempo
          const [resMiembros, resProductos, resPlanes] = await Promise.all([
            fetch(`${API_URL}/miembros`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/productos`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/planes`).then(r => r.json()).catch(() => [])
          ]);
          
          set({ 
            miembros: Array.isArray(resMiembros) ? resMiembros : [],
            productos: Array.isArray(resProductos) ? resProductos : [],
            planes: Array.isArray(resPlanes) ? resPlanes : []
          });
          console.log("🟢 Conectado a PostgreSQL - Datos sincronizados.");
        } catch (error) {
          console.warn("🔴 No se pudo conectar a la base de datos.");
        }
      },

      iniciarSesion: (pin) => {
        let exito = false;
        set((state) => {
          const usuario = state.usuarios.find(u => u.pin === String(pin));
          if (usuario) { exito = true; return { usuarioActual: usuario }; }
          return state;
        });
        return exito;
      },
      cerrarSesion: () => set({ usuarioActual: null }),

      // ==========================================
      // 4. MÉTODOS OPTIMISTAS (Guardan en pantalla y envían a BD)
      // ==========================================
      agregarMiembro: async (miembro) => {
        // Optimistic UI: Actualizamos pantalla de inmediato
        const idTemp = Date.now();
        set((state) => ({ miembros: [{ ...miembro, id: idTemp }, ...state.miembros] }));
        
        // Enviamos a Postgres
        try {
          await fetch(`${API_URL}/miembros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(miembro)
          });
          get().sincronizarBD(); // Refrescamos para obtener el ID real
        } catch (error) { console.error("Error al guardar miembro en BD"); }
      },

      eliminarMiembro: async (id) => {
        set((state) => ({ miembros: state.miembros.filter(m => m.id !== id) }));
        try { await fetch(`${API_URL}/miembros/${id}`, { method: 'DELETE' }); } catch (e) {}
      },

      agregarProducto: async (producto) => {
        set((state) => ({ productos: [...state.productos, { ...producto, id: Date.now() }] }));
        try {
          await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
          });
          get().sincronizarBD();
        } catch (error) {}
      },

      eliminarProducto: async (id) => {
        set((state) => ({ productos: state.productos.filter(p => p.id !== id) }));
        try { await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' }); } catch (e) {}
      },

      registrarMiembroConSuscripcion: (miembro, plan, folio) => set((state) => {
        const idNuevo = Date.now();
        const hoy = new Date();
        const fechaRegistro = hoy.toISOString().split('T')[0];
        hoy.setDate(hoy.getDate() + plan.duracionDias);
        const fechaVencimiento = hoy.toISOString().split('T')[0];
        const matricula = `MAT-${Math.floor(1000 + Math.random() * 9000)}`;

        const nuevoMiembro = { ...miembro, id: idNuevo, matricula, fechaRegistro, fechaVencimiento, estado: 'Activo' };
        const nuevoMovimiento = { id: folio, tipo: 'Inscripción', descripcion: `Ingreso: ${plan.nombre}`, total: plan.precio, hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };

        // (Pendiente enviar fetch de ventas a DB)
        return {
          miembros: [nuevoMiembro, ...state.miembros],
          movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja],
          ingresosHoy: state.ingresosHoy + plan.precio,
          ventasRealizadas: state.ventasRealizadas + 1
        };
      }),

      // (Las funciones de edición se quedan iguales por el momento para no saturar el código de red)
      editarMiembro: (id, datos) => set((state) => ({ miembros: state.miembros.map(m => m.id === id ? { ...m, ...datos } : m) })),
      editarProducto: (id, datos) => set((state) => ({ productos: state.productos.map(p => p.id === id ? { ...p, ...datos } : p) })),
      surtirProducto: (id, cantidad) => set((state) => ({ productos: state.productos.map(p => p.id === id ? { ...p, stock: p.stock + cantidad } : p) })),
      agregarPlan: (plan) => set((state) => ({ planes: [...state.planes, { ...plan, id: Date.now() }] })),
      editarPlan: (id, datos) => set((state) => ({ planes: state.planes.map(p => p.id === id ? { ...p, ...datos } : p) })),
      eliminarPlan: (id) => set((state) => ({ planes: state.planes.filter(p => p.id !== id) })),

      renovarMembresia: (idMiembro, plan, folio) => set((state) => {
        const miembrosActualizados = state.miembros.map(m => {
          if (m.id === idMiembro) {
            const hoy = new Date();
            hoy.setDate(hoy.getDate() + plan.duracionDias);
            return { ...m, estado: 'Activo', fechaVencimiento: hoy.toISOString().split('T')[0] };
          }
          return m;
        });
        const nuevoMovimiento = { id: folio, tipo: 'Suscripción', descripcion: `Renovación: ${plan.nombre}`, total: plan.precio, hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        return { miembros: miembrosActualizados, movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja], ingresosHoy: state.ingresosHoy + plan.precio, ventasRealizadas: state.ventasRealizadas + 1 };
      }),

      registrarVentaPos: (carrito, total, folio) => set((state) => {
        const productosActualizados = [...state.productos];
        carrito.forEach(item => {
          const prodIndex = productosActualizados.findIndex(p => p.id === item.id);
          if (prodIndex !== -1) productosActualizados[prodIndex].stock -= item.cantidad;
        });
        const nuevoMovimiento = { id: folio, tipo: 'Venta', descripcion: `${carrito.length} artículos (POS)`, total: total, hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        return { productos: productosActualizados, movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja], ingresosHoy: state.ingresosHoy + total, ventasRealizadas: state.ventasRealizadas + carrito.length };
      }),

      cerrarCaja: () => set((state) => {
        const nuevoCorte = { id: `COR-${Math.floor(1000 + Math.random() * 9000)}`, fecha: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), totalMovimientos: state.movimientosCaja.length, totalVentas: state.ventasRealizadas, totalIngresos: state.ingresosHoy };
        return { historialCortes: [nuevoCorte, ...state.historialCortes], ingresosHoy: 0, asistenciasHoy: 0, ventasRealizadas: 0, movimientosCaja: [] };
      })
    }),
    {
      name: 'gymsystem-storage', 
      // LA REGLA DE ORO: Solo conservamos en local la sesión, la configuración y los usuarios. 
      // El resto (miembros, productos, etc) se limpia al recargar y se descarga fresco de PostgreSQL.
      partialize: (state) => ({ 
        usuarioActual: state.usuarioActual,
        configuracion: state.configuracion,
        usuarios: state.usuarios 
      }),
    }
  )
);