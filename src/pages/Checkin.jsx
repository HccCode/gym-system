import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useGymStore } from '../store/useGymStore';
import { useNavigate } from 'react-router-dom';

export default function Checkin() {
  const { miembros, registrarAsistencia, iniciarSesion } = useGymStore();
  const navigate = useNavigate();
  
  const [estadoLectura, setEstadoLectura] = useState('esperando'); // esperando, permitido, denegado, no_encontrado
  const [miembroActual, setMiembroActual] = useState(null);
  const [pausa, setPausa] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleScan = (detectedCodes) => {
    if (pausa || !detectedCodes || detectedCodes.length === 0 || isPinModalOpen) return;
    
    const codigoEscaneado = detectedCodes[0].rawValue;
    setPausa(true); // Pausa el escáner inmediatamente para evitar lecturas dobles
    
    // Buscamos al miembro por su matrícula en el estado fresco sincronizado de la BD
    const miembro = miembros.find(m => m.matricula === codigoEscaneado);
    
    if (miembro) {
      setMiembroActual(miembro);
      if (miembro.estado === 'Activo') {
        setEstadoLectura('permitido');
        registrarAsistencia();
        new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3').play().catch(()=>{});
      } else {
        setEstadoLectura('denegado');
        new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(()=>{});
      }
    } else {
      setMiembroActual(null);
      setEstadoLectura('no_encontrado');
      new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(()=>{});
    }

    // 🔥 TEMPORIZADOR MAESTRO: Tras 4 segundos, limpia la pantalla y vuelve a activar la cámara
    setTimeout(() => {
      setEstadoLectura('esperando');
      setMiembroActual(null);
      setPausa(false);
    }, 4000);
  };

  const handleCameraError = (error) => {
    console.error("Error de cámara:", error);
    setCameraError(error.message || 'La cámara no está disponible o requiere HTTPS.');
  };

  const handleNumeroClick = (num) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      
      if (nuevoPin.length === 4) {
        const loginExitoso = iniciarSesion(nuevoPin);
        if (loginExitoso) {
          setIsPinModalOpen(false);
          setPin('');
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          navigate('/'); 
        } else {
          setPinError(true);
          new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(()=>{});
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 1000);
        }
      }
    }
  };

  const handleBorrar = () => {
    if (pin.length > 0 && !pinError) {
      setPin(pin.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!isPinModalOpen) return;
    const handleTecladoModal = (e) => {
      if (e.key >= '0' && e.key <= '9') handleNumeroClick(e.key);
      else if (e.key === 'Backspace') handleBorrar();
      else if (e.key === 'Escape') { setIsPinModalOpen(false); setPin(''); }
    };
    window.addEventListener('keydown', handleTecladoModal);
    return () => window.removeEventListener('keydown', handleTecladoModal);
  }, [isPinModalOpen, pin, pinError]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Colores dinámicos Forja adaptados al estado de acceso
  const estiloContenedor = {
    'esperando': 'bg-[#111111] border-stone-800/60',
    'permitido': 'bg-[#0f2419] border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.3)]',
    'denegado': 'bg-[#2a1215] border-red-600 shadow-[0_0_35px_rgba(220,38,38,0.3)]',
    'no_encontrado': 'bg-[#271c10] border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.3)]',
  }[estadoLectura];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0c0c0c] font-sans text-stone-200 relative overflow-hidden select-none">
      
      {/* BOTONES DE CONTROL SUPERIORES */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30 print:hidden">
        <button 
          onClick={() => setIsPinModalOpen(true)} 
          className="bg-[#111111]/90 backdrop-blur text-stone-300 hover:text-white px-5 py-3 rounded-lg font-bold border border-stone-800 hover:border-red-500/50 transition-colors flex items-center gap-2 shadow-xl text-sm"
        >
          <span>🔒</span> Panel Admin
        </button>
        <button 
          onClick={toggleFullscreen} 
          className="bg-[#111111]/90 backdrop-blur text-stone-300 hover:text-white px-5 py-3 rounded-lg font-bold border border-stone-800 hover:border-stone-600 transition-colors shadow-xl text-sm hidden md:block"
        >
          {isFullscreen ? '🗗 Salir Pantalla Completa' : '🖵 Pantalla Completa'}
        </button>
      </div>

      {/* TITULO PRINCIPAL DE PANTALLA */}
      <div className="text-center mb-8 mt-12 z-10">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight uppercase">
          Kiosco <span className="text-red-600">Acceso</span>
        </h1>
        <p className="text-stone-400 text-md md:text-lg mt-2 font-medium">Coloque el código QR frente a la cámara</p>
      </div>

      {/* MÓDULO CENTRAL INTERACTIVO */}
      <div className={`w-full max-w-xl rounded-3xl overflow-hidden border-4 transition-all duration-300 relative z-10 flex flex-col ${estiloContenedor} ${estadoLectura !== 'esperando' ? 'scale-102' : 'scale-100'}`}>
        
        {/* PANEL SUPERIOR: CÁMARA O VISTA DE FOTO */}
        <div className="aspect-square md:aspect-video relative bg-black w-full flex items-center justify-center overflow-hidden">
          
          {cameraError ? (
            <div className="text-center p-6 flex flex-col items-center">
              <span className="text-5xl mb-3">📷🚫</span>
              <p className="text-red-500 font-bold text-lg mb-1">Cámara No Detectada</p>
              <p className="text-stone-500 text-xs max-w-xs">{cameraError}</p>
            </div>
          ) : estadoLectura === 'esperando' && !isPinModalOpen ? (
            // Modo Lectura Activo: Muestra la cámara en vivo
            <>
              <Scanner 
                onScan={handleScan}
                onError={handleCameraError} 
                components={{ audio: false, finder: false }} 
                styles={{ container: { width: '100%', height: '100%' } }}
                constraints={{ facingMode: "user" }}
              />
              <div className="absolute inset-0 m-auto w-[65%] h-[65%] md:h-[80%] border-2 border-red-500/30 rounded-2xl flex items-center justify-center pointer-events-none">
                <div className="w-full h-[2px] bg-red-600/60 animate-pulse shadow-[0_0_15px_#dc2626]"></div>
              </div>
            </>
          ) : (
            // Modo Resultado: Oculta la cámara y despliega la FOTO del Miembro
            <div className="w-full h-full flex items-center justify-center bg-[#16161a] p-4 relative animate-fadeIn">
              {miembroActual?.foto ? (
                <img 
                  src={miembroActual.foto} 
                  alt={miembroActual.nombre} 
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-stone-800 shadow-2xl"
                />
              ) : (
                // Si el miembro no tiene foto cargada en la BD, muestra un avatar elegante
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-stone-900 border-4 border-stone-800 shadow-2xl flex items-center justify-center text-7xl select-none">
                  👤
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL INFERIOR: TEXTO E INFORMACIÓN DEL MIEMBRO */}
        <div className="h-52 p-6 flex flex-col items-center justify-center text-center">
          {estadoLectura === 'esperando' && (
            <>
              <div className="text-4xl animate-bounce mb-2">📱</div>
              <h3 className="text-stone-400 font-bold text-lg uppercase tracking-widest">Listo para Escanear</h3>
            </>
          )}

          {estadoLectura === 'permitido' && (
            <div className="animate-scaleIn">
              <h3 className="text-white font-black text-3xl md:text-4xl uppercase tracking-tight truncate max-w-md">{miembroActual?.nombre}</h3>
              <p className="text-stone-400 font-mono font-bold text-sm mt-1">Matrícula: {miembroActual?.matricula}</p>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-emerald-400 font-black tracking-widest text-lg uppercase shadow-emerald-500/20">🟢 ACCESO AUTORIZADO</span>
                <p className="text-stone-300 text-xs font-semibold">Vence el: {miembroActual?.fechaVencimiento}</p>
              </div>
            </div>
          )}

          {estadoLectura === 'denegado' && (
            <div className="animate-scaleIn">
              <h3 className="text-white font-black text-3xl md:text-4xl uppercase tracking-tight truncate max-w-md">{miembroActual?.nombre}</h3>
              <p className="text-stone-400 font-mono font-bold text-sm mt-1">Matrícula: {miembroActual?.matricula}</p>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-red-500 font-black tracking-widest text-lg uppercase">❌ ACCESO RECHAZADO</span>
                <p className="text-red-400 text-xs font-bold uppercase">Membresía Vencida ({miembroActual?.fechaVencimiento})</p>
              </div>
            </div>
          )}

          {estadoLectura === 'no_encontrado' && (
            <div className="animate-scaleIn">
              <div className="text-amber-500 text-5xl mb-2 font-black">❓</div>
              <h3 className="text-amber-500 font-black text-2xl uppercase tracking-wide">Código Desconocido</h3>
              <p className="text-stone-400 text-sm mt-1 max-w-xs">La matrícula escaneada no coincide con ningún registro de la base de datos.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TECLADO PIN DE SEGURIDAD (DISEÑO FORJA CORREGIDO) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-stone-800/60 rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
            <button onClick={() => { setIsPinModalOpen(false); setPin(''); }} className="absolute top-5 right-5 text-stone-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Seguridad</h3>
            <p className="text-stone-400 text-xs mb-8 uppercase tracking-widest">Ingresa PIN de Administrador</p>

            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pinError 
                      ? 'bg-red-500 border-red-500 animate-ping' 
                      : pin.length > index 
                        ? 'bg-red-600 border-red-600 scale-110 shadow-[0_0_10px_#dc2626]' 
                        : 'border-stone-700 bg-[#1a1a1a]'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} type="button" onClick={() => handleNumeroClick(num)} className="h-16 rounded-xl bg-[#1a1a1a] text-white font-black text-2xl border border-stone-800 hover:bg-stone-800 hover:border-red-500/50 active:bg-red-600 transition-colors shadow-md flex items-center justify-center">
                  {num}
                </button>
              ))}
              <button type="button" onClick={handleBorrar} className="h-16 rounded-xl bg-[#1a1a1a] text-stone-500 font-bold text-lg border border-stone-800 hover:bg-stone-800 flex items-center justify-center active:bg-red-900/50 transition-colors">⌫</button>
              <button type="button" onClick={() => handleNumeroClick(0)} className="h-16 rounded-xl bg-[#1a1a1a] text-white font-black text-2xl border border-stone-800 hover:bg-stone-800 hover:border-red-500/50 active:bg-red-600 transition-colors shadow-md flex items-center justify-center">0</button>
              <button type="button" onClick={() => { setIsPinModalOpen(false); setPin(''); }} className="h-16 rounded-xl bg-[#1a1a1a] text-stone-500 text-xs font-bold border border-stone-800 hover:bg-stone-800 flex items-center justify-center uppercase tracking-wider transition-colors">Salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}