
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser?.frequencyBinCount || 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw wave background
      ctx.fillStyle = 'rgba(248, 250, 252, 0.5)';
      ctx.fillRect(0, 0, width, height);

      if (analyser && isActive) {
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6'); 
        
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e2e8f0'; 
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  if (!isActive && !analyser) return null;

  return (
    <div className="fixed bottom-[58px] left-0 right-0 z-40 px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-[3rem] p-6 pb-2 h-24 flex flex-col items-center justify-center animate-in slide-in-from-bottom-full duration-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-300'}`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Patient Data Stream</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width={1200} 
            height={48} 
            className="w-full h-12 opacity-95 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
