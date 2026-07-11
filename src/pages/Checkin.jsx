import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useGymStore } from '../store/useGymStore';
import { useNavigate } from 'react-router-dom';

export default function Checkin() {
  const { miembros, registrarAsistencia } = useGymStore();
  const navigate = useNavigate();
  
  const [estadoLectura, setEstadoLectura] = useState('esperando');
  const [miembroActual, setMiembroActual] = useState(null);
  const [pausa, setPausa] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const PIN_CORRECTO = '1234'; 

  const handleScan = (detectedCodes) => {
    if (pausa || !detectedCodes || detectedCodes.length === 0 || isPinModalOpen) return;
    
    const codigoEscaneado = detectedCodes[0].rawValue;
    setPausa(true); 
    
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
    }

    setTimeout(() => {
      setEstadoLectura('esperando');
      setMiembroActual(null);
      setPausa(false);
    }, 3000);
  };

  const handleNumeroClick = (num) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      
      if (nuevoPin.length === 4) {
        if (nuevoPin === PIN_CORRECTO) {
          setIsPinModalOpen(false);
          setPin('');
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

  // Escuchador para teclado físico exclusivo para cuando el modal está abierto
  useEffect(() => {
    if (!isPinModalOpen) return;

    const handleTecladoModal = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumeroClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBorrar();
      } else if (e.key === 'Escape') {
        setIsPinModalOpen(false);
        setPin('');
      }
    };

    window.addEventListener('keydown', handleTecladoModal);
    return () => {
      window.removeEventListener('keydown', handleTecladoModal);
    };
  }, [isPinModalOpen, pin, pinError]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const colorFondo = {
    'esperando': 'bg-slate-950 border-slate-800',
    'permitido': 'bg-emerald-950 border-emerald-500 shadow-emerald-500/50',
    'denegado': 'bg-rose-950 border-rose-500 shadow-rose-500/50',
    'no_encontrado': 'bg-amber-950 border-amber-500 shadow-amber-500/50',
  }[estadoLectura];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500 bg-slate-950 relative overflow-hidden">
      
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <button 
          onClick={() => setIsPinModalOpen(true)} 
          className="bg-slate-800/80 backdrop-blur text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-bold border border-slate-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <span>🔒</span> Panel Admin
        </button>
        <button onClick={toggleFullscreen} className="bg-slate-800/80 backdrop-blur text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-bold border border-slate-700 transition-colors shadow-lg">
          {isFullscreen ? '🗗 Salir Kiosco' : '🖵 Iniciar Kiosco'}
        </button>
      </div>

      <div className="text-center mb-8 mt-12 z-10">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Kiosco de <span className="text-blue-500">Acceso</span></h1>
        <p className="text-slate-400 text-lg md:text-xl mt-3 font-medium">Muestra tu código QR a la cámara</p>
      </div>

      {/* AQUÍ ESTÁ LA CORRECCIÓN DE LA SINTAXIS */}
      <div className={`w-full max-w-lg md:max-w-2xl rounded-[2.5rem] overflow-hidden border-4 shadow-2xl transition-all duration-300 relative z-10 flex flex-col ${colorFondo} ${estadoLectura !== 'esperando' ? 'scale-105' : 'scale-100'}`}>
        <div className="aspect-square md:aspect-video relative bg-black w-full">
          {!isPinModalOpen && (
            <Scanner 
              onScan={handleScan}
              components={{ audio: false, finder: false }} 
              styles={{ container: { width: '100%', height: '100%' } }}
              constraints={{ facingMode: "user" }}
            />
          )}
          
          {estadoLectura === 'esperando' && (
            <div className="absolute inset-0 m-auto w-[60%] h-[60%] md:h-[80%] border-2 border-blue-500/50 rounded-3xl flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-blue-500/50 animate-pulse shadow-[0_0_15px_#3b82f6]"></div>
            </div>
          )}
        </div>

        <div className="h-48 md:h-56 p-6 flex flex-col items-center justify-center text-center">
          {estadoLectura === 'esperando' && (
            <>
              <div className="text-5xl animate-bounce mb-3">📱</div>
              <h3 className="text-slate-300 font-bold text-xl md:text-2xl">Esperando lectura...</h3>
            </>
          )}

          {estadoLectura === 'permitido' && (
            <>
              <div className="text-emerald-400 text-6xl md:text-7xl mb-3 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">✅</div>
              <h3 className="text-white font-black text-2xl md:text-4xl">{miembroActual?.nombre}</h3>
              <p className="text-emerald-400 font-black tracking-widest mt-2 md:text-xl">ACCESO PERMITIDO</p>
            </>
          )}

          {estadoLectura === 'denegado' && (
            <>
              <div className="text-rose-400 text-6xl md:text-7xl mb-3 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]">❌</div>
              <h3 className="text-white font-black text-2xl md:text-4xl">{miembroActual?.nombre}</h3>
              <p className="text-rose-400 font-black tracking-widest mt-2 md:text-xl uppercase">Suscripción {miembroActual?.estado}</p>
            </>
          )}

          {estadoLectura === 'no_encontrado' && (
            <>
              <div className="text-amber-400 text-6xl md:text-7xl mb-3">❓</div>
              <h3 className="text-amber-400 font-black text-2xl md:text-3xl">Código Inválido</h3>
              <p className="text-amber-500/80 text-lg mt-2 font-medium">Este código no pertenece al sistema.</p>
            </>
          )}
        </div>
      </div>

      {/* MODAL TECLADO PIN DE SEGURIDAD */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 w-full max-w-sm text-center shadow-2xl relative">
            
            <button 
              onClick={() => { setIsPinModalOpen(false); setPin(''); }} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-slate-950"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-2">Código de Seguridad</h3>
            <p className="text-slate-400 text-xs mb-6">Ingresa el PIN de administrador para salir</p>

            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pinError 
                      ? 'bg-rose-500 border-rose-500 animate-ping' 
                      : pin.length > index 
                        ? 'bg-blue-500 border-blue-500 scale-110 shadow-[0_0_10px_#3b82f6]' 
                        : 'border-slate-700 bg-slate-950'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} type="button" onClick={() => handleNumeroClick(num)} className="h-16 rounded-2xl bg-slate-950 text-white font-black text-2xl border border-slate-800/80 hover:bg-slate-800 active:bg-blue-600 transition-colors shadow-md flex items-center justify-center">
                  {num}
                </button>
              ))}
              
              <button type="button" onClick={handleBorrar} className="h-16 rounded-2xl bg-slate-950 text-slate-400 font-bold text-lg border border-slate-800/80 hover:bg-slate-800 flex items-center justify-center active:bg-rose-950">
                ⌫
              </button>

              <button type="button" onClick={() => handleNumeroClick(0)} className="h-16 rounded-2xl bg-slate-950 text-white font-black text-2xl border border-slate-800/80 hover:bg-slate-800 active:bg-blue-600 transition-colors shadow-md flex items-center justify-center">
                0
              </button>

              <button type="button" onClick={() => { setIsPinModalOpen(false); setPin(''); }} className="h-16 rounded-2xl bg-slate-950 text-slate-500 text-xs font-bold border border-slate-800/80 hover:bg-slate-800 flex items-center justify-center uppercase tracking-wider">
                Salir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}