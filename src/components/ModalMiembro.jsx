import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useGymStore } from '../store/useGymStore'; // <-- Importamos tu store

export default function ModalMiembro({ isOpen, onClose, onSave, miembroAEditar }) {
  // Extraemos los planes en vivo de la base de datos
  const { planes } = useGymStore();

  // 1. TODOS LOS HOOKS VAN PRIMERO (Añadimos planId al estado)
  const [formData, setFormData] = useState({ 
    nombre: '', 
    telefono: '', 
    email: '', 
    estado: 'Activo', 
    foto: null, 
    planId: '' 
  });
  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  // Efecto para cargar los datos si estamos editando
  useEffect(() => {
    if (miembroAEditar) {
      setFormData({
        nombre: miembroAEditar.nombre,
        telefono: miembroAEditar.telefono,
        email: miembroAEditar.email,
        estado: miembroAEditar.estado,
        foto: miembroAEditar.foto,
        planId: '' // Limpiamos el plan en modo edición
      });
      setFotoPreview(miembroAEditar.foto);
    } else {
      setFormData({ nombre: '', telefono: '', email: '', estado: 'Activo', foto: null, planId: '' });
      setFotoPreview(null);
    }
  }, [miembroAEditar, isOpen]);

  // Función para capturar foto
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFotoPreview(imageSrc);
      setFormData(prev => ({ ...prev, foto: imageSrc }));
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  // 2. RETORNO TEMPRANO
  if (!isOpen) return null;

  // 3. FUNCIONES DE MANEJO DE EVENTOS
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, foto: imageUrl }));
      setFotoPreview(imageUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      foto: fotoPreview,
      id: miembroAEditar ? miembroAEditar.id : undefined 
    });
    
    // Limpiamos los estados al guardar
    setFormData({ nombre: '', telefono: '', email: '', estado: 'Activo', foto: null, planId: '' });
    setFotoPreview(null);
    setIsCameraOpen(false);
    onClose();
  };

  const cerrarModal = () => {
    setIsCameraOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-bold text-white">
            {miembroAEditar ? '✏️ Editar Miembro' : '👥 Registrar Nuevo Miembro'}
          </h3>
          <button onClick={cerrarModal} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* SECCIÓN DE LA FOTO / CÁMARA */}
          <div className="flex flex-col items-center">
            {isCameraOpen ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full h-48 bg-black rounded-2xl overflow-hidden relative border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 mb-3">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }} 
                  />
                  {/* Guía visual para centrar el rostro */}
                  <div className="absolute inset-0 border-[3px] border-white/20 rounded-full w-32 h-32 m-auto pointer-events-none"></div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCameraOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={capture} className="px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2">
                    <span>📸</span> Capturar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-full border-2 border-slate-600 bg-slate-950 flex items-center justify-center overflow-hidden mb-3 shadow-xl">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 text-4xl">👤</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5">
                    <span>📷</span> Cámara
                  </button>
                  <label className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                    <span>📁</span> Subir
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* CAMPOS DEL FORMULARIO */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white font-medium" placeholder="Ej. Juan Pérez" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono</label>
              <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="555-0123" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Correo</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium" placeholder="@correo.com" />
            </div>
          </div>
          
          {miembroAEditar && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Estado de Membresía</label>
              <select name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white font-medium">
                <option value="Activo">Activo</option>
                <option value="Vencido">Vencido</option>
              </select>
            </div>
          )}

          {/* === AQUI INTEGRAMOS EL SELECTOR DINÁMICO DE PLANES === */}
          {!miembroAEditar && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider">Primera Suscripción (Opcional)</label>
              <select 
                name="planId"
                value={formData.planId} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-950 border border-blue-900/50 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.1)]"
              >
                <option value="">Registrar sin plan (Prueba / Invitado)</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} - ${plan.precio} MXN ({plan.duracionDias} días)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6 sticky bottom-0 bg-slate-900">
            <button type="button" onClick={cerrarModal} className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
              {miembroAEditar ? 'Guardar Cambios' : 'Guardar Miembro'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}