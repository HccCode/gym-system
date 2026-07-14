import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = '/api';

export const useGymStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 1. ESTADOS LOCALES Y CONFIGURACIÓN
      // ==========================================
      usuarioActual: null,
      configuracion: { 
        nombreGym: 'GYMSYSTEM', 
        ticketCabecera: '¡Bienvenido a tu entrenamiento!', 
        ticketPie: 'Gracias por tu preferencia.' 
      },
      usuarios: [
        { id: 1, rol: 'admin', pin: '1234', nombre: 'Administrador Principal', permisos: ['dashboard', 'kiosco', 'miembros', 'pos', 'suscripciones', 'inventario', 'caja', 'ajustes'] },
        { id: 2, rol: 'recepcionista', pin: '0000', nombre: 'Recepción', permisos: ['pos', 'miembros'] }
      ],
      
      detallesCortes: {}, 

      // ==========================================
      // 2. ESTADOS DINÁMICOS (Vienen de PostgreSQL)
      // ==========================================
      productos: [],
      planes: [],
      miembros: [],
      movimientosCaja: [],
      historialCortes: [],
      ingresosHoy: 0,
      ventasRealizadas: 0, // 🔥 Ahora representará los Artículos Reales, no solo tickets
      asistenciasHoy: 0,

      // ==========================================
      // 3. LA CONEXIÓN: SINCRONIZACIÓN MAESTRA
      // ==========================================
      sincronizarBD: async () => {
        try {
          const [resMiembros, resProductos, resPlanes, resUsuarios, resMovimientos, resCortes] = await Promise.all([
            fetch(`${API_URL}/miembros`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/productos`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/planes`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/usuarios`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/caja/movimientos`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/caja/cortes`).then(r => r.json()).catch(() => [])
          ]);
          
          const miembrosFormateados = Array.isArray(resMiembros) ? resMiembros.map(m => {
            const fRegistro = m.fecha_registro || m.fechaRegistro;
            const fVencimiento = m.fecha_vencimiento || m.fechaVencimiento;
            return {
              ...m,
              fechaRegistro: fRegistro ? fRegistro.split('T')[0] : '',
              fechaVencimiento: fVencimiento ? fVencimiento.split('T')[0] : 'Sin fecha'
            };
          }) : [];

          const productosFormateados = Array.isArray(resProductos) ? resProductos.map(p => ({
            ...p, precio: parseFloat(p.precio), stock: parseInt(p.stock)
          })) : [];

          const planesFormateados = Array.isArray(resPlanes) ? resPlanes.map(p => ({
            ...p, precio: parseFloat(p.precio), duracionDias: p.duracion_dias ? parseInt(p.duracion_dias) : parseInt(p.duracionDias)
          })) : [];

          const usuariosFormateados = Array.isArray(resUsuarios) ? resUsuarios.map(u => {
            let permisosLimpios = u.permisos || [];
            if (typeof permisosLimpios === 'string') {
              permisosLimpios = permisosLimpios.replace(/[{}"'[\]]/g, '').split(',').map(p => p.trim());
            }
            return { ...u, permisos: Array.isArray(permisosLimpios) ? permisosLimpios : [] };
          }) : [];

          const movimientosFormateados = Array.isArray(resMovimientos) ? resMovimientos.map(m => ({
            ...m, total: parseFloat(m.total)
          })) : [];

          const cortesFormateados = Array.isArray(resCortes) ? resCortes.map(c => ({
            id: c.id,
            fecha: c.fecha,
            hora: c.hora,
            totalMovimientos: parseInt(c.total_movimientos),
            totalVentas: parseInt(c.total_ventas),
            totalIngresos: parseFloat(c.total_ingresos),
            movimientos: get().detallesCortes?.[c.id] || []
          })) : [];

          const ingresosCalculados = movimientosFormateados.reduce((sum, m) => sum + m.total, 0);
          
          // 🔥 LÓGICA INTELIGENTE: Extrae la cantidad exacta de artículos de la descripción para la contabilidad
          let articulosReales = 0;
          movimientosFormateados.forEach(m => {
            if (m.tipo === 'Venta') {
              const matches = m.descripcion.match(/(\d+)x/g);
              if (matches) {
                articulosReales += matches.reduce((sum, match) => sum + parseInt(match.replace('x', '')), 0);
              } else {
                articulosReales += 1;
              }
            } else {
              articulosReales += 1; // Membresías y renovaciones cuentan como 1
            }
          });

          set({ 
            miembros: miembrosFormateados,
            productos: productosFormateados,
            planes: planesFormateados,
            usuarios: usuariosFormateados.length > 0 ? usuariosFormateados : get().usuarios,
            movimientosCaja: movimientosFormateados,
            historialCortes: cortesFormateados,
            ingresosHoy: ingresosCalculados,
            ventasRealizadas: articulosReales // Asignamos el conteo real
          });
        } catch (error) {
          console.warn("🔴 No se pudo conectar a PostgreSQL.");
        }
      },

      // ==========================================
      // 4. FUNCIONES DE SESIÓN Y AJUSTES
      // ==========================================
      iniciarSesion: (pin) => {
        let usuarioEncontrado = null; 
        set((state) => {
          const usuario = state.usuarios.find(u => u.pin === String(pin));
          if (usuario) { usuarioEncontrado = usuario; return { usuarioActual: usuario }; }
          return state;
        });
        return usuarioEncontrado;
      },
      cerrarSesion: () => set({ usuarioActual: null }),
      actualizarConfiguracion: (nuevaConfig) => set((state) => ({ configuracion: { ...state.configuracion, ...nuevaConfig } })),

      // ==========================================
      // 5. MÉTODOS DE USUARIOS
      // ==========================================
      agregarUsuario: async (usuario) => {
        const idTemp = Date.now();
        set((state) => ({ usuarios: [...state.usuarios, { ...usuario, id: idTemp }] }));
        try {
          await fetch(`${API_URL}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(usuario) });
          get().sincronizarBD();
        } catch (error) {}
      },
      editarUsuario: async (id, datos) => {
        set((state) => ({ usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...datos } : u) }));
        try {
          await fetch(`${API_URL}/usuarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
          get().sincronizarBD();
        } catch (error) {}
      },
      eliminarUsuario: async (id) => {
        set((state) => ({ usuarios: state.usuarios.filter(u => u.id !== id) }));
        try { await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' }); } catch (e) {}
      },

      // ==========================================
      // 6. MÉTODOS DE MIEMBROS
      // ==========================================
      agregarMiembro: async (miembro) => {
        const idTemp = Date.now();
        set((state) => ({ miembros: [{ ...miembro, id: idTemp }, ...state.miembros] }));
        try {
          await fetch(`${API_URL}/miembros`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(miembro) });
          get().sincronizarBD();
        } catch (error) {}
      },
      eliminarMiembro: async (id) => {
        set((state) => ({ miembros: state.miembros.filter(m => m.id !== id) }));
        try { await fetch(`${API_URL}/miembros/${id}`, { method: 'DELETE' }); } catch (e) {}
      },
      editarMiembro: async (id, datos) => {
        set((state) => ({ miembros: state.miembros.map(m => m.id === id ? { ...m, ...datos } : m) }));
        try {
          await fetch(`${API_URL}/miembros/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
          get().sincronizarBD();
        } catch (error) {}
      },

      registrarMiembroConSuscripcion: async (miembro, plan, folio) => {
        const hoy = new Date();
        const fechaRegistro = hoy.toISOString().split('T')[0];
        hoy.setDate(hoy.getDate() + plan.duracionDias);
        const fechaVencimiento = hoy.toISOString().split('T')[0];
        const matricula = `MAT-${Math.floor(1000 + Math.random() * 9000)}`;

        const nuevoMiembro = { ...miembro, id: Date.now(), matricula, fechaRegistro, fechaVencimiento, estado: 'Activo' };
        const nuevoMovimiento = { id: folio, tipo: 'Inscripción', descripcion: `Ingreso: ${plan.nombre}`, total: plan.precio, hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };

        set((state) => ({
          miembros: [nuevoMiembro, ...state.miembros],
          movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja],
          ingresosHoy: state.ingresosHoy + plan.precio,
          ventasRealizadas: state.ventasRealizadas + 1
        }));

        try {
          await fetch(`${API_URL}/miembros`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoMiembro) });
          await fetch(`${API_URL}/caja/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoMovimiento) });
          get().sincronizarBD(); 
        } catch (error) {}
      },

      renovarMembresia: async (idMiembro, plan, folio) => {
        let miembroActualizado = null;
        const nuevoMovimiento = { id: folio, tipo: 'Suscripción', descripcion: `Renovación: ${plan.nombre}`, total: plan.precio, hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        
        set((state) => {
          const miembrosActualizados = state.miembros.map(m => {
            if (m.id === idMiembro) {
              const hoy = new Date();
              hoy.setDate(hoy.getDate() + plan.duracionDias);
              miembroActualizado = { ...m, estado: 'Activo', fechaVencimiento: hoy.toISOString().split('T')[0] };
              return miembroActualizado;
            }
            return m;
          });
          
          return { 
            miembros: miembrosActualizados, 
            movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja], 
            ingresosHoy: state.ingresosHoy + plan.precio, 
            ventasRealizadas: state.ventasRealizadas + 1 
          };
        });

        try {
          if (miembroActualizado) {
            await fetch(`${API_URL}/miembros/${idMiembro}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(miembroActualizado) });
          }
          await fetch(`${API_URL}/caja/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoMovimiento) });
          get().sincronizarBD();
        } catch (error) {}
      },

      // ==========================================
      // 7. MÉTODOS DE INVENTARIO Y POS
      // ==========================================
      agregarProducto: async (producto) => {
        const idTemp = Date.now();
        set((state) => ({ productos: [...state.productos, { ...producto, id: idTemp }] }));
        try {
          await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(producto) });
          get().sincronizarBD();
        } catch (error) {}
      },
      eliminarProducto: async (id) => {
        set((state) => ({ productos: state.productos.filter(p => p.id !== id) }));
        try { await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' }); } catch (e) {}
      },
      editarProducto: async (id, datos) => {
        set((state) => ({ productos: state.productos.map(p => p.id === id ? { ...p, ...datos } : p) }));
        try {
          await fetch(`${API_URL}/productos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
          get().sincronizarBD();
        } catch (error) {}
      },
      surtirProducto: async (id, cantidad) => {
        let productoActualizado = null;
        set((state) => ({ productos: state.productos.map(p => {
          if (p.id === id) {
            productoActualizado = { ...p, stock: p.stock + cantidad };
            return productoActualizado;
          }
          return p;
        }) }));
        try {
          if (productoActualizado) {
            await fetch(`${API_URL}/productos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productoActualizado) });
            get().sincronizarBD();
          }
        } catch (error) {}
      },
      
      // 🔥 ACTUALIZADO: Registra la venta con desglose exacto
      registrarVentaPos: async (carrito, total, folio) => {
        // Obtenemos la sumatoria de artículos y sus nombres en formato "2x Agua, 1x Suplemento"
        const cantidadTotalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const desgloseDetallado = carrito.map(item => `${item.cantidad}x ${item.nombre}`).join(', ');

        const nuevoMovimiento = { 
          id: folio, 
          tipo: 'Venta', 
          descripcion: desgloseDetallado, 
          total: total, 
          hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        };

        set((state) => {
          const productosActualizados = [...state.productos];
          carrito.forEach(item => {
            const prodIndex = productosActualizados.findIndex(p => p.id === item.id);
            if (prodIndex !== -1) productosActualizados[prodIndex].stock -= item.cantidad;
          });
          
          return { 
            productos: productosActualizados, 
            movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja], 
            ingresosHoy: state.ingresosHoy + total, 
            ventasRealizadas: state.ventasRealizadas + cantidadTotalArticulos // Sumamos la cantidad real
          };
        });

        try {
          await fetch(`${API_URL}/caja/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoMovimiento) });
          await Promise.all(carrito.map(item => {
            const productoActual = get().productos.find(p => p.id === item.id);
            return fetch(`${API_URL}/productos/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productoActual) });
          }));
          get().sincronizarBD();
        } catch (error) {}
      },

      // ==========================================
      // 8. MÉTODOS DE PLANES
      // ==========================================
      agregarPlan: async (plan) => {
        const idTemp = Date.now();
        set((state) => ({ planes: [...state.planes, { ...plan, id: idTemp }] }));
        try {
          await fetch(`${API_URL}/planes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
          get().sincronizarBD();
        } catch (error) {}
      },
      editarPlan: async (id, datos) => {
        set((state) => ({ planes: state.planes.map(p => p.id === id ? { ...p, ...datos } : p) }));
        try {
          await fetch(`${API_URL}/planes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
          get().sincronizarBD();
        } catch (error) {}
      },
      eliminarPlan: async (id) => {
        set((state) => ({ planes: state.planes.filter(p => p.id !== id) }));
        try { await fetch(`${API_URL}/planes/${id}`, { method: 'DELETE' }); get().sincronizarBD(); } catch (e) {}
      },

      // ==========================================
      // 9. MÉTODOS DE CAJA Y KIOSCO
      // ==========================================
      registrarAsistencia: () => set((state) => ({ asistenciasHoy: state.asistenciasHoy + 1 })),
      
      cerrarCaja: async () => {
        const movimientosActuales = [...get().movimientosCaja]; 
        const idCorte = `COR-${Math.floor(1000 + Math.random() * 9000)}`;

        const nuevoCorte = { 
          id: idCorte, 
          fecha: new Date().toLocaleDateString(), 
          hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          totalMovimientos: movimientosActuales.length, 
          totalVentas: get().ventasRealizadas, 
          totalIngresos: get().ingresosHoy 
        };
        
        set((state) => ({ 
          historialCortes: [{ ...nuevoCorte, movimientos: movimientosActuales }, ...state.historialCortes], 
          ingresosHoy: 0, 
          asistenciasHoy: 0, 
          ventasRealizadas: 0, 
          movimientosCaja: [],
          detallesCortes: { ...(state.detallesCortes || {}), [idCorte]: movimientosActuales }
        }));
        
        try {
          await fetch(`${API_URL}/caja/cortes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoCorte) });
          get().sincronizarBD();
        } catch (error) {}
      }
    }),
    {
      name: 'gymsystem-storage', 
      partialize: (state) => ({ 
        usuarioActual: state.usuarioActual, 
        configuracion: state.configuracion, 
        usuarios: state.usuarios,
        detallesCortes: state.detallesCortes 
      }),
    }
  )
);