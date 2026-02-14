
import React, { useState } from 'react';
import { SessionStatus, TranscriptionEntry, SavedSession } from '../types';

interface InterpreterDashboardProps {
  status: SessionStatus;
  transcriptions: TranscriptionEntry[];
  onToggleSession: () => void;
  onTogglePause: () => void;
  onOpenInvite: () => void;
  isModelThinking: boolean;
  isRecording: boolean;
  onDownloadTranscript: () => void;
  savedSessions: SavedSession[];
  analyser: AnalyserNode | null;
  currentPatientName?: string;
}

const InterpreterDashboard: React.FC<InterpreterDashboardProps> = ({
  status,
  transcriptions,
  onToggleSession,
  onTogglePause,
  onOpenInvite,
  isModelThinking,
  isRecording,
  onDownloadTranscript,
  savedSessions,
  analyser,
  currentPatientName
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions, activeTab, selectedSession]);

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
  };

  const downloadEnglishTranscript = (session: SavedSession) => {
    const text = session.transcriptions.map(t => {
      const timestamp = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const englishContent = t.role === 'doctor' ? t.sourceText : t.translatedText;
      return `[${timestamp}] ${t.role.toUpperCase()}: ${englishContent}`;
    }).join('\n\n');

    const blob = new Blob([`CONSULTATION SUMMARY (ENGLISH)\nPatient: ${session.patientName}\nDate: ${new Date(session.timestamp).toLocaleString()}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-summary-${session.patientName.replace(/\s+/g, '-').toLowerCase()}-${session.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAudio = (session: SavedSession) => {
    if (!session.audioUrl) return;
    const a = document.createElement('a');
    a.href = session.audioUrl;
    a.download = `audio-${session.patientName.replace(/\s+/g, '-').toLowerCase()}-${session.id.substring(0, 8)}.webm`;
    a.click();
  };

  const renderTranscriptionList = (list: TranscriptionEntry[]) => (
    <div className="space-y-8">
      {list.length === 0 ? (
        <div className="h-full py-20 flex flex-col items-center justify-center text-slate-300">
          <div className="bg-slate-100 p-8 rounded-full mb-6">
            <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="font-black text-xs uppercase tracking-widest text-slate-400">Waiting for interaction...</p>
        </div>
      ) : (
        list.map((entry) => (
          <div key={entry.id} className={`flex w-full ${entry.role === 'doctor' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="max-w-[80%]">
              <div className={`flex items-center gap-2 mb-2 px-3 ${entry.role === 'doctor' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${entry.role === 'doctor' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${entry.role === 'doctor' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {entry.role === 'doctor' ? 'Medical Professional' : 'Patient Response'}
                </span>
              </div>
              <div className={`px-8 py-6 rounded-[2.5rem] bg-white border-2 shadow-sm ${entry.role === 'doctor' ? 'border-blue-100 rounded-tr-none' : 'border-emerald-100 rounded-tl-none'}`}>
                {entry.role === 'patient' && <p className="text-slate-400 italic text-sm mb-4 font-medium">"{entry.sourceText}"</p>}
                <div className={`pt-2 ${entry.role === 'patient' ? 'border-t-2 border-emerald-50' : ''}`}>
                  <p className="text-slate-900 font-bold text-lg leading-relaxed">
                    {entry.role === 'doctor' ? entry.sourceText : entry.translatedText}
                  </p>
                  {entry.role === 'doctor' && (
                    <div className="mt-4 pt-4 border-t border-blue-50">
                      <p className="text-blue-500 text-sm font-medium italic">Interpreter: {entry.translatedText}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => { setActiveTab('live'); setSelectedSession(null); }}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white text-slate-400 hover:text-slate-600'}`}
        >
          Interpreter View
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white text-slate-400 hover:text-slate-600'}`}
        >
          Archives ({savedSessions.length})
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {currentPatientName ? `Consultation: ${currentPatientName}` : 'Active Consultation'}
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Real-time medical translation in progress.</p>
            </div>
            <button 
              onClick={onOpenInvite}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              GMeet Sync
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[700px] relative">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
              {renderTranscriptionList(transcriptions)}
            </div>

            {(status === SessionStatus.ACTIVE || status === SessionStatus.PAUSED) && (
              <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-center">
                <button
                  onClick={onTogglePause}
                  className={`flex items-center gap-4 px-12 py-5 rounded-full font-black transition-all shadow-xl hover:scale-105 active:scale-95 uppercase tracking-widest text-sm ${
                    status === SessionStatus.PAUSED ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'
                  }`}
                >
                  {status === SessionStatus.PAUSED ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Resume Interpretation
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Pause Interaction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500">
          {selectedSession ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="flex items-center gap-3 text-slate-500 hover:text-slate-800 font-bold text-sm group"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Archive List
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => downloadAudio(selectedSession)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-full font-bold text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    Audio (.webm)
                  </button>
                  <button 
                    onClick={() => downloadEnglishTranscript(selectedSession)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                  >
                    English Report
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[750px]">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Record: {selectedSession.patientName}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(selectedSession.timestamp).toLocaleString()}</p>
                  </div>
                  {selectedSession.audioUrl && (
                    <audio controls className="h-10 opacity-70">
                      <source src={selectedSession.audioUrl} type="audio/webm" />
                    </audio>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/10">
                  {renderTranscriptionList(selectedSession.transcriptions)}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSessions.length === 0 ? (
                <div className="col-span-full py-32 text-center text-slate-400 font-bold uppercase tracking-[0.2em]">No Archived Sessions Found</div>
              ) : (
                savedSessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => setSelectedSession(session)}
                    className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </div>
                      <span className="text-slate-400 text-xs font-bold">{formatDuration(session.duration)}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{session.patientName}</h4>
                    <p className="text-sm text-slate-500 mb-8">{session.transcriptions.length} Interpretation cycles</p>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                      Inspect Record
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterpreterDashboard;
