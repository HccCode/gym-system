import QRCode from 'react-qr-code';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

export default function ModalCredencial({ isOpen, onClose, miembro }) {
  const credencialRef = useRef(null);
  const [generando, setGenerando] = useState(false);

  if (!isOpen || !miembro) return null;

  const compartirPorWhatsApp = async () => {
    if (!credencialRef.current) return;
    setGenerando(true);
    
    try {
      // 1. Usamos html-to-image (soporta colores modernos de Tailwind)
      const dataUrl = await toPng(credencialRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Alta resolución
        backgroundColor: '#0f172a' // Fondo oscuro de la app
      });
      
      // 2. Convertimos el resultado a un archivo de imagen
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${miembro.matricula}-Pase.png`, { type: 'image/png' });

      const textoMensaje = `Hola ${miembro.nombre}, aquí tienes tu pase de acceso rápido con código QR. Tu número de suscriptor es: ${miembro.matricula}`;

      // 3. Compartir nativo (Celulares, Mac, Windows 11)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Pase de Acceso Gym',
          text: textoMensaje
        });
      } else {
        // 4. Modo Escritorio (Descarga + WhatsApp Web)
        const link = document.createElement('a');
        link.download = `${miembro.matricula}-Pase.png`;
        link.href = dataUrl;
        link.click();
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textoMensaje + ' (Por favor, adjunta la imagen que se acaba de descargar para enviarla).')}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert("Hubo un error al generar la imagen del QR.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4">
      <div className="relative w-full max-w-sm">
        
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors z-10 shadow-lg"
        >
          ✕
        </button>

        {/* ZONA DE CAPTURA */}
        <div 
          ref={credencialRef}
          className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col"
        >
          <div className="bg-gradient-to-b from-blue-700 to-slate-900 p-8 pb-4 flex flex-col items-center text-center">
            <h2 className="text-white font-black tracking-widest uppercase text-xs mb-6 opacity-80">
              Gym<span className="text-blue-300">System</span> Pass
            </h2>

            <div className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-xl overflow-hidden mb-4 bg-slate-800">
              {miembro.foto ? (
                <img src={miembro.foto} alt={miembro.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white leading-tight mb-2">{miembro.nombre}</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${miembro.estado === 'Activo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              Estado: {miembro.estado}
            </span>
          </div>

          <div className="p-8 pt-4 flex flex-col items-center bg-slate-900">
            <div className="bg-white p-5 rounded-3xl shadow-lg border-4 border-slate-800 flex flex-col items-center w-full max-w-[240px]">
              <QRCode 
                value={miembro.matricula} 
                size={160}
                level="H" 
              />
              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 w-full text-center">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Suscriptor No.</p>
                <p className="text-slate-900 font-mono font-black text-xl tracking-widest">
                  {miembro.matricula}
                </p>
              </div>
            </div>
            
            <p className="text-slate-500 text-[11px] mt-6 font-medium text-center max-w-[200px]">
              Presenta este código en la recepción para registrar tu asistencia.
            </p>
          </div>
        </div>

        {/* BOTÓN DE WHATSAPP */}
        <button 
          onClick={compartirPorWhatsApp}
          disabled={generando}
          className="w-full mt-4 py-4 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generando ? 'Generando Pase...' : (
            <>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Enviar Pase por WhatsApp
            </>
          )}
        </button>
      </div>
    </div>
  );
}