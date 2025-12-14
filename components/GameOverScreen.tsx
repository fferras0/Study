
import React from 'react';
import { GameStatus, SimulationState } from '../types';

interface GameOverScreenProps {
  status: GameStatus;
  gameState: SimulationState | null;
  onRestart: () => void;
  onHome: () => void;
  onReview: () => void;
  t: any; // Translation object
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ status, gameState, onRestart, onHome, onReview, t }) => {
  const isVictory = status === GameStatus.VICTORY;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 p-4 animate-fade-in">
        {/* Background Ambient Effect */}
        <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isVictory ? 'from-green-900 via-black to-black' : 'from-red-900 via-black to-black'}`}></div>

        <div className="relative z-10 max-w-3xl w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center overflow-hidden">
            {/* Decorative Glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r ${isVictory ? 'from-transparent via-green-500 to-transparent' : 'from-transparent via-red-500 to-transparent'}`}></div>

            <div className="mb-6">
                <div className={`text-8xl mb-4 inline-block transform transition-transform hover:scale-110 ${isVictory ? 'animate-bounce' : 'animate-pulse'}`}>
                    {isVictory ? '🏆' : '💀'}
                </div>
                <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 ${isVictory ? 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-700' : 'text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-700'}`}>
                    {isVictory ? t.missionSuccess : t.missionFail}
                </h1>
                <div className="h-1 w-24 mx-auto bg-gray-800 rounded-full my-4"></div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-3">
                    {t.prevResult}
                </h3>
                <p className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed">
                    {gameState?.gameOverReason || "Simulation Ended."}
                </p>
            </div>

            {/* Stats Summary */}
            <div className="flex justify-center gap-6 mb-10">
                <div className="p-4 bg-gray-800 rounded-lg w-32">
                    <div className="text-2xl mb-1">❤️</div>
                    <div className="text-sm text-gray-400 font-bold">Health</div>
                    <div className={`text-lg font-mono ${isVictory ? 'text-green-400' : 'text-red-400'}`}>{gameState?.health}%</div>
                </div>
                 <div className="p-4 bg-gray-800 rounded-lg w-32">
                     <div className="text-2xl mb-1">⏱️</div>
                    <div className="text-sm text-gray-400 font-bold">Time Left</div>
                    <div className="text-lg font-mono text-blue-400">{gameState?.timeRemaining}m</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={onHome}
                    className="px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition-all border border-gray-700 hover:border-gray-500 flex items-center justify-center gap-2"
                >
                    <span>🏠</span> {t.newScenario}
                </button>
                <button 
                    onClick={onRestart}
                    className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${isVictory ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'}`}
                >
                    <span>🔄</span> {t.tryAgain}
                </button>
            </div>
            
            <button 
                onClick={onReview}
                className="mt-6 text-sm text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-600 hover:decoration-white transition-all"
            >
                {t.reviewBtn}
            </button>
        </div>
    </div>
  );
};

export default GameOverScreen;
