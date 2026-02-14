
import React, { useState } from 'react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMeetingMode: boolean;
  onToggleMeetingMode: () => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ isOpen, onClose, isMeetingMode, onToggleMeetingMode }) => {
  const [copied, setCopied] = useState(false);
  const meetingId = React.useMemo(() => Math.random().toString(36).substring(2, 11), []);
  const meetingUrl = `https://med-interpret.app/join/${meetingId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">GMeet Integration Guide</h2>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed font-medium">
            To "add" the agent to your meeting, you must bridge the audio using the browser's built-in sharing features.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Step by Step Guide */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">1</div>
              <p className="text-sm text-slate-600 leading-tight pt-1">
                Toggle <strong>Meeting Link Mode</strong> below.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">2</div>
              <p className="text-sm text-slate-600 leading-tight pt-1">
                Click <strong>"Launch Agent"</strong> on the main dashboard.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">3</div>
              <p className="text-sm text-slate-600 leading-tight pt-1">
                In the browser pop-up, select <strong>"This Tab"</strong> or your <strong>Google Meet Tab</strong> and check <strong>"Also share tab audio"</strong>.
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border-2 transition-all ${isMeetingMode ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold ${isMeetingMode ? 'text-emerald-700' : 'text-slate-700'}`}>Meeting Link Mode</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Enabled Multichannel Capture</p>
              </div>
              <button 
                onClick={onToggleMeetingMode}
                className={`w-12 h-6 rounded-full transition-all relative ${isMeetingMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMeetingMode ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-4">
            <button 
              onClick={() => window.open('https://meet.google.com/new', '_blank')}
              className="flex-1 flex items-center justify-center p-4 rounded-xl bg-slate-900 text-white font-bold gap-3 hover:bg-slate-800 transition-all text-xs"
            >
              Open Google Meet
            </button>
            <button 
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center p-4 rounded-xl font-bold gap-3 transition-all text-xs border-2 ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-200 text-slate-700'}`}
            >
              {copied ? 'Link Copied' : 'Copy App Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
