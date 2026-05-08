'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCount(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-red-600 text-white p-10">
      <h1 className="text-6xl font-black mb-8 border-4 border-white p-4">
        PÁGINA DE TESTE ATIVA
      </h1>
      
      <div className="bg-white text-red-600 p-8 rounded-full shadow-2xl mb-8">
        <span className="text-8xl font-mono font-bold">
          {count}
        </span>
      </div>

      <p className="text-2xl font-bold uppercase tracking-widest animate-bounce">
        Se está a ver isto em VERMELHO, o estilo está a funcionar!
      </p>

      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-500 p-4 rounded shadow">TESTE AZUL</div>
        <div className="bg-green-500 p-4 rounded shadow">TESTE VERDE</div>
        <div className="bg-yellow-500 p-4 rounded shadow text-black">TESTE AMARELO</div>
      </div>
      
      <p className="mt-10 opacity-50">
        Hora do sistema: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}