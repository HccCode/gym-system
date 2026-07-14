import { useParams } from 'react-router-dom';
import { useGymStore } from '../store/useGymStore';
import html2canvas from 'html2canvas';

export default function PaseDigital() {
  const { matricula } = useParams();
  const { miembros } = useGymStore();

  const miembro = miembros.find(m => m.matricula === matricula);

  // Función maestra para convertir el diseño en una imagen PNG real
  const descargarComoImagen = () => {
    const tarjeta = document.getElementById('tarjeta-pase-digital');
    if (!tarjeta) return;

    html2canvas(tarjeta, {
      useCORS: true,
      backgroundColor: '#0a2373', // Mantiene el fondo azul en la imagen final
      scale: 2 // Aumenta la resolución para que el QR se escanee perfecto
    }).then((canvas) => {
      const enlace = document.createElement('a');
      enlace.download = `PASE-${miembro?.nombre.replace(/\s+/g, '_')}.png`;
      enlace.href = canvas.toDataURL('image/png');
      enlace.click();
    });
  };

  if (!miembro) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Pase no encontrado</h2>
          <p className="text-stone-400">La matrícula ingresada no existe o fue dada de baja.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans print:hidden relative">
      
      {/* 📸 BOTÓN FLOTANTE PARA GENERAR LA IMAGEN */}
      <button 
        onClick={descargarComoImagen}
        className="fixed top-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all tracking-wider uppercase"
      >
        📥 Descargar Pase como Imagen
      </button>

      {/* 🎯 CONTENEDOR CAPTURABLE (Idéntico a tu diseño) */}
      <div 
        id="tarjeta-pase-digital" 
        className="bg-gradient-to-b from-[#0a2373] to-[#0f172a] p-8 rounded-[2.5rem] flex flex-col items-center w-full max-w-sm shadow-2xl"
      >
        <h1 className="text-white font-black tracking-[0.2em] text-xs mb-8 opacity-70">GYMSYSTEM PASS</h1>
        
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-[#111111] border-4 border-[#1a1a1a] flex items-center justify-center mb-5 overflow-hidden shadow-2xl shrink-0">
          {miembro.foto ? (
            <img src={miembro.foto} alt={miembro.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-purple-500">👤</span>
          )}
        </div>
        
        {/* Datos del Cliente */}
        <h2 className="text-white text-3xl font-bold mb-3 text-center leading-tight px-2">{miembro.nombre}</h2>
        
        <span className="px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-8 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
          ESTADO: {miembro.estado}
        </span>

        {/* Tarjeta Blanca con QR */}
        <div className="bg-white rounded-[2rem] p-8 w-full shadow-2xl relative">
          <div className="flex justify-center mb-6">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${miembro.matricula}`} 
              alt="Código QR" 
              className="w-48 h-48 rounded-lg"
            />
          </div>

          <div className="border-t-2 border-dashed border-stone-200 w-full mb-6"></div>

          <div className="text-center">
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Suscriptor No.</p>
            <p className="text-[#0f172a] text-2xl font-black tracking-widest">{miembro.matricula}</p>
          </div>
        </div>

        <p className="text-stone-400/50 text-[11px] text-center mt-8 max-w-[250px] leading-relaxed">
          Presenta este código en la recepción para registrar tu asistencia.
        </p>
      </div>

    </div>
  );
}