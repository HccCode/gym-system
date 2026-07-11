import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGymStore = create(
  persist(
    (set) => ({
      // ==========================================
      // 1. CONFIGURACIÓN Y USUARIOS (AJUSTES)
      // ==========================================
      configuracion: {
        logo: null,
        nombreGym: 'GYM',
        ticketCabecera: '¡Bienvenido a tu entrenamiento!',
        ticketPie: 'Gracias por tu preferencia. ¡Vuelve pronto!'
      },
      usuarios: [
        { id: 1, rol: 'admin', pin: '1234', nombre: 'Administrador Principal' },
        { id: 2, rol: 'recepcionista', pin: '0000', nombre: 'Recepción' }
      ],

      actualizarConfiguracion: (nuevaConfig) => set((state) => ({ 
        configuracion: { ...state.configuracion, ...nuevaConfig } 
      })),
      
      agregarUsuario: (usuario) => set((state) => ({ 
        usuarios: [...state.usuarios, { ...usuario, id: Date.now() }] 
      })),
      
      eliminarUsuario: (id) => set((state) => ({ 
        usuarios: state.usuarios.filter(u => u.id !== id) 
      })),

      // ==========================================
      // 2. INVENTARIO Y CATÁLOGO
      // ==========================================
      productos: [
        { id: 1, nombre: 'Agua 1L', categoria: 'Bebida', precio: 20, stock: 15 },
        { id: 2, nombre: 'Proteína Scoop', categoria: 'Suplemento', precio: 35, stock: 0 },
      ],
      planes: [
        { id: 1, nombre: 'Mensualidad Básica', precio: 400, duracionDias: 30 },
        { id: 2, nombre: 'Anualidad VIP', precio: 3500, duracionDias: 365 },
        { id: 3, nombre: 'Visita 1 Día', precio: 60, duracionDias: 1 },
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
      // 3. DIRECTORIO DE MIEMBROS
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

      // ==========================================
      // 4. FLUJO DE VENTAS Y CAJA (FINANZAS)
      // ==========================================
      ingresosHoy: 0,
      asistenciasHoy: 0,
      ventasRealizadas: 0,
      movimientosCaja: [],
      historialCortes: [],

      registrarAsistencia: () => set((state) => ({
        asistenciasHoy: state.asistenciasHoy + 1
      })),

      // Función maestra que cobra la membresía y actualiza el dinero en caja
      renovarMembresia: (idMiembro, plan, folio) => set((state) => {
        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Calcular nueva fecha de vencimiento
        const miembrosActualizados = state.miembros.map(m => {
          if (m.id === idMiembro) {
            const hoy = new Date();
            hoy.setDate(hoy.getDate() + plan.duracionDias);
            return { ...m, estado: 'Activo', fechaVencimiento: hoy.toISOString().split('T')[0] };
          }
          return m;
        });

        // Registrar el movimiento de dinero
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

      // Función para el POS (Punto de Venta)
      registrarVentaPos: (carrito, total, folio) => set((state) => {
        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Reducir stock de los productos vendidos
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
          movimientosCaja: [] // Se limpia la caja para el siguiente turno
        };
      })
    }),
    {
      name: 'gymsystem-storage', // Nombre del almacenamiento en el navegador
    }
  )
);