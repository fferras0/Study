import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon: React.ReactNode;
  isCurrency?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue, color, icon, isCurrency }) => {
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));

  return (
    <div className="flex flex-col w-full mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-md">
      <div className="flex justify-between items-center mb-2 text-gray-300">
        <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-semibold text-sm sm:text-base">{label}</span>
        </div>
        <span className={`font-mono font-bold ${percentage < 20 ? 'text-red-400' : 'text-white'}`}>
          {isCurrency ? '$' : ''}{value} {isCurrency ? '' : (label === 'الوقت' ? 'د' : '%')}
        </span>
      </div>
      <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;