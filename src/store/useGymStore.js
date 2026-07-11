import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGymStore = create(
  persist(
    (set) => ({
      // ==========================================
      // 1. CONFIGURACIÓN, USUARIOS Y SESIÓN
      // ==========================================
      configuracion: {
        logo: null,
        nombreGym: 'GYM',
        ticketCabecera: '¡Bienvenido a tu entrenamiento!',
        ticketPie: 'Gracias por tu preferencia. ¡Vuelve pronto!'
      },
      usuarios: [
        { 
          id: 1, 
          rol: 'admin', 
          pin: '1234', 
          nombre: 'Administrador Principal', 
          permisos: ['dashboard', 'kiosco', 'miembros', 'pos', 'suscripciones', 'inventario', 'caja', 'ajustes'] 
        },
        { 
          id: 2, 
          rol: 'recepcionista', 
          pin: '0000', 
          nombre: 'Recepción', 
          permisos: ['pos', 'miembros'] 
        }
      ],

      // === 🔥 AQUÍ ESTÁ LO QUE BORRÉ POR ERROR 🔥 ===
      usuarioActual: null,

      iniciarSesion: (pin) => {
        let exito = false;
        set((state) => {
          const usuarioEncontrado = state.usuarios.find(u => u.pin === pin);
          if (usuarioEncontrado) {
            exito = true;
            return { usuarioActual: usuarioEncontrado };
          }
          return state; // Si el PIN es incorrecto, no hacemos nada
        });
        return exito;
      },

      cerrarSesion: () => set({ usuarioActual: null }),
      // =================================================

      actualizarConfiguracion: (nuevaConfig) => set((state) => ({ 
        configuracion: { ...state.configuracion, ...nuevaConfig } 
      })),
      
      agregarUsuario: (usuario) => set((state) => ({ 
        usuarios: [...state.usuarios, { ...usuario, id: Date.now() }] 
      })),

      editarUsuario: (id, datosActualizados) => set((state) => ({
        usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...datosActualizados } : u)
      })),
      
      eliminarUsuario: (id) => set((state) => ({ 
        usuarios: state.usuarios.filter(u => u.id !== id) 
      })),

      // ==========================================
      // 2. INVENTARIO Y PRODUCTOS
      // ==========================================
      productos: [
        { id: 1, nombre: 'Agua 1L', categoria: 'Bebida', precio: 20, stock: 15 },
        { id: 2, nombre: 'Proteína Scoop', categoria: 'Suplemento', precio: 35, stock: 0 },
      ],

      agregarProducto: (producto) => set((state) => ({ 
        productos: [...state.productos, { ...producto, id: Date.now() }] 
      })),
      
      editarProducto: (id, datosActualizados) => set((state) => ({
        productos: state.productos.map(p => p.id === id ? { ...p, ...datosActualizados } : p)
      })),
      
      eliminarProducto: (id) => set((state) => ({
        productos: state.productos.filter(p => p.id !== id)
      })),
      
      surtirProducto: (id, cantidad) => set((state) => ({
        productos: state.productos.map(p => p.id === id ? { ...p, stock: p.stock + cantidad } : p)
      })),

      // ==========================================
      // 3. SUSCRIPCIONES (CATÁLOGO DE PLANES)
      // ==========================================
      planes: [
        { id: 1, nombre: 'Mensualidad Básica', precio: 400, duracionDias: 30 },
        { id: 2, nombre: 'Anualidad VIP', precio: 3500, duracionDias: 365 },
        { id: 3, nombre: 'Visita 1 Día', precio: 60, duracionDias: 1 },
      ],

      agregarPlan: (plan) => set((state) => ({ 
        planes: [...state.planes, { ...plan, id: Date.now() }] 
      })),
      
      editarPlan: (id, datosActualizados) => set((state) => ({
        planes: state.planes.map(p => p.id === id ? { ...p, ...datosActualizados } : p)
      })),
      
      eliminarPlan: (id) => set((state) => ({
        planes: state.planes.filter(p => p.id !== id)
      })),

      // ==========================================
      // 4. DIRECTORIO DE MIEMBROS
      // ==========================================
      miembros: [],

      agregarMiembro: (miembro) => set((state) => ({ 
        miembros: [...state.miembros, { ...miembro, id: Date.now() }] 
      })),
      
      editarMiembro: (id, datosActualizados) => set((state) => ({
        miembros: state.miembros.map(m => m.id === id ? { ...m, ...datosActualizados } : m)
      })),
      
      eliminarMiembro: (id) => set((state) => ({
        miembros: state.miembros.filter(m => m.id !== id)
      })),

      registrarMiembroConSuscripcion: (miembro, plan, folio) => set((state) => {
        const idNuevo = Date.now();
        const hoy = new Date();
        const fechaRegistro = hoy.toISOString().split('T')[0];
        
        hoy.setDate(hoy.getDate() + plan.duracionDias);
        const fechaVencimiento = hoy.toISOString().split('T')[0];
        
        const matricula = `MAT-${Math.floor(1000 + Math.random() * 9000)}`;

        const nuevoMiembro = {
          ...miembro,
          id: idNuevo,
          matricula,
          fechaRegistro,
          fechaVencimiento,
          estado: 'Activo'
        };

        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const nuevoMovimiento = {
          id: folio,
          tipo: 'Inscripción',
          descripcion: `Nuevo Ingreso: ${plan.nombre}`,
          total: plan.precio,
          hora: horaActual
        };

        return {
          miembros: [nuevoMiembro, ...state.miembros],
          movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja],
          ingresosHoy: state.ingresosHoy + plan.precio,
          ventasRealizadas: state.ventasRealizadas + 1
        };
      }),

      // ==========================================
      // 5. FLUJO DE VENTAS Y CAJA (FINANZAS)
      // ==========================================
      ingresosHoy: 0,
      asistenciasHoy: 0,
      ventasRealizadas: 0,
      movimientosCaja: [],
      historialCortes: [],

      registrarAsistencia: () => set((state) => ({
        asistenciasHoy: state.asistenciasHoy + 1
      })),

      renovarMembresia: (idMiembro, plan, folio) => set((state) => {
        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const miembrosActualizados = state.miembros.map(m => {
          if (m.id === idMiembro) {
            const hoy = new Date();
            hoy.setDate(hoy.getDate() + plan.duracionDias);
            return { ...m, estado: 'Activo', fechaVencimiento: hoy.toISOString().split('T')[0] };
          }
          return m;
        });

        const nuevoMovimiento = {
          id: folio,
          tipo: 'Suscripción',
          descripcion: `Renovación: ${plan.nombre}`,
          total: plan.precio,
          hora: horaActual
        };

        return {
          miembros: miembrosActualizados,
          movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja],
          ingresosHoy: state.ingresosHoy + plan.precio,
          ventasRealizadas: state.ventasRealizadas + 1
        };
      }),

      registrarVentaPos: (carrito, total, folio) => set((state) => {
        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const productosActualizados = [...state.productos];
        carrito.forEach(item => {
          const prodIndex = productosActualizados.findIndex(p => p.id === item.id);
          if (prodIndex !== -1) {
            productosActualizados[prodIndex].stock -= item.cantidad;
          }
        });

        const nuevoMovimiento = {
          id: folio,
          tipo: 'Venta',
          descripcion: `${carrito.length} artículos (POS)`,
          total: total,
          hora: horaActual
        };

        return {
          productos: productosActualizados,
          movimientosCaja: [nuevoMovimiento, ...state.movimientosCaja],
          ingresosHoy: state.ingresosHoy + total,
          ventasRealizadas: state.ventasRealizadas + carrito.length
        };
      }),

      cerrarCaja: () => set((state) => {
        const fechaActual = new Date().toLocaleDateString();
        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const nuevoCorte = {
          id: `COR-${Math.floor(1000 + Math.random() * 9000)}`,
          fecha: fechaActual,
          hora: horaActual,
          totalMovimientos: state.movimientosCaja.length,
          totalVentas: state.ventasRealizadas,
          totalIngresos: state.ingresosHoy
        };

        return {
          historialCortes: [nuevoCorte, ...state.historialCortes],
          ingresosHoy: 0,
          asistenciasHoy: 0,
          ventasRealizadas: 0,
          movimientosCaja: []
        };
      })
    }),
    {
      name: 'gymsystem-storage', 
    }
  )
);