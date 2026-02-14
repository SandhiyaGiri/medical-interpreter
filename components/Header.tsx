
import React from 'react';
import { SessionStatus } from '../types';

interface HeaderProps {
  status: SessionStatus;
  onToggleSession: () => void;
  onGoHome?: () => void;
  onShowHistory?: () => void;
}

const Header: React.FC<HeaderProps> = ({ status, onToggleSession, onGoHome, onShowHistory }) => {
  const isInactive = status === SessionStatus.IDLE || status === SessionStatus.ERROR;
  const isConnecting = status === SessionStatus.CONNECTING;

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onGoHome}>
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MedInterpret</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Clinical Bridge</p>
          </div>
        </div>

        {isInactive && (
          <nav className="hidden lg:flex items-center gap-8">
            <button onClick={onGoHome} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Home</button>
            <button onClick={onShowHistory} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Archives</button>
            <a href="#" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">HIPAA Compliance</a>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-6">
        {!isInactive && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Bridge Active</span>
          </div>
        )}

        <button
          onClick={onToggleSession}
          disabled={isConnecting}
          className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black transition-all shadow-xl hover:scale-105 active:scale-95 uppercase tracking-widest text-[11px] disabled:opacity-50 disabled:scale-100 ${
            isInactive
              ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-50'
              : 'bg-rose-500 text-white shadow-rose-500/30 ring-4 ring-rose-50'
          }`}
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : isInactive ? (
            'Launch Consultation'
          ) : (
            'End Session'
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
