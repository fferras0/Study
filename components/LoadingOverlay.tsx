
import React from 'react';

interface LoadingOverlayProps {
  text: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-cyan-400 border-l-cyan-400 rounded-full animate-spin-reverse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🤖</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-xl font-bold text-white tracking-widest uppercase">
            Processing
        </h3>
        <p className="text-blue-300 font-mono text-sm animate-pulse text-center max-w-md px-4">
            {text}
        </p>
      </div>

      <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-progress-indeterminate"></div>
      </div>
      
      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        @keyframes progress-indeterminate {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
            animation: progress-indeterminate 1.5s infinite ease-in-out;
            width: 50%;
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
