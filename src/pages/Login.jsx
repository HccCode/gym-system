import { useState, useEffect } from 'react';
import { useGymStore } from '../store/useGymStore';

export default function Login({ onLoginExitoso }) {
  // Extraemos la lista dinámica de usuarios configurada en Ajustes
  const { usuarios, configuracion } = useGymStore();

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleNumeroClick = (num) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      
      // AUTO-ENTER: Validación dinámica al 4to dígito
      if (nuevoPin.length === 4) {
        
        const usuarioEncontrado = usuarios.find(u => u.pin === nuevoPin);
        
        if (usuarioEncontrado) {
          // ACTUALIZADO: Pasamos el objeto COMPLETO para leer sus permisos en App.jsx
          onLoginExitoso(usuarioEncontrado);
        } else {
          // Si no existe, lanza error visual y sonoro
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

  // Escuchador global para teclado físico de computadora
  useEffect(() => {
    const handleTecladoFisico = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumeroClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBorrar();
      }
    };

    window.addEventListener('keydown', handleTecladoFisico);
    
    return () => {
      window.removeEventListener('keydown', handleTecladoFisico);
    };
  }, [pin, pinError, usuarios]); // Se refresca si cambia el estado

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-10 text-center z-10 flex flex-col items-center">
        {configuracion?.logo && (
          <img src={configuracion.logo} alt="Logo" className="w-16 h-16 rounded-2xl mb-4 object-cover shadow-lg shadow-blue-900/20 border border-slate-800" />
        )}
        <h1 className="text-4xl font-black text-white tracking-tight">
          {configuracion?.nombreGym || 'GYM'}<span className="text-blue-500">SYSTEM</span>
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Ingresa tu código de acceso</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl z-10 relative">
        
        {/* Visualizador de Burbujas del PIN */}
        <div className="flex justify-center gap-5 mb-10">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pinError 
                  ? 'bg-rose-500 border-rose-500 animate-ping' 
                  : pin.length > index 
                    ? 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_15px_#3b82f6]' 
                    : 'border-slate-700 bg-slate-950'
              }`}
            />
          ))}
        </div>

        {/* Teclado Táctil en Pantalla */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumeroClick(num.toString())}
              className="h-16 rounded-2xl bg-slate-950 text-white font-black text-2xl border border-slate-800/80 hover:bg-slate-800 active:bg-blue-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          <div className="col-start-2">
            <button
              type="button"
              onClick={() => handleNumeroClick('0')}
              className="h-16 w-full rounded-2xl bg-slate-950 text-white font-black text-2xl border border-slate-800/80 hover:bg-slate-800 active:bg-blue-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            >
              0
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleBorrar}
            className="h-16 rounded-2xl bg-slate-950 text-slate-400 font-bold text-xl border border-slate-800/80 hover:bg-slate-800 flex items-center justify-center active:bg-rose-950 transition-colors cursor-pointer"
          >
            ⌫
          </button>
        </div>
      </div>
      
    </div>
  );
}