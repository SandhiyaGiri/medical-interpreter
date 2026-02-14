
import React, { useState, useEffect, useRef } from 'react';
import { SessionStatus, TranscriptionEntry, SavedSession } from '../types';

interface InterpreterDashboardProps {
  status: SessionStatus;
  transcriptions: TranscriptionEntry[];
  liveSubtitle?: string;
  onToggleSession: () => void;
  onTogglePause: () => void;
  onOpenInvite: () => void;
  isModelThinking: boolean;
  isRecording: boolean;
  onDownloadTranscript: () => void;
  savedSessions: SavedSession[];
  analyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  currentPatientName?: string;
  personaImageUrl: string;
  onPersonaUpdate: (url: string) => void;
}

const InterpreterDashboard: React.FC<InterpreterDashboardProps> = ({
  status,
  transcriptions,
  liveSubtitle,
  onToggleSession,
  onTogglePause,
  onOpenInvite,
  isModelThinking,
  isRecording,
  onDownloadTranscript,
  savedSessions,
  analyser,
  outputAnalyser,
  currentPatientName,
  personaImageUrl,
  onPersonaUpdate
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);
  const [selectedSessionAudioUrl, setSelectedSessionAudioUrl] = useState<string | null>(null);
  const personaContainerRef = useRef<HTMLDivElement>(null);
  const personaVideoRef = useRef<HTMLVideoElement>(null);
  const personaImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smoothing for lip-sync to ensure "fluid" movement rather than jittery frames
  const smoothedIntensity = useRef(0);
  
  // Flag to check if we should use video or uploaded image
  const isUsingCustomImage = personaImageUrl !== "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000";

  const isActive = status === SessionStatus.ACTIVE;
  const isAgentSpeaking = !!liveSubtitle && liveSubtitle.length > 0;

  // Handle Audio URL for Selected History Session (Playback Fix)
  useEffect(() => {
    if (selectedSession?.audioBlob) {
      const url = URL.createObjectURL(selectedSession.audioBlob);
      setSelectedSessionAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (selectedSession?.audioUrl) {
      setSelectedSessionAudioUrl(selectedSession.audioUrl);
    } else {
      setSelectedSessionAudioUrl(null);
    }
  }, [selectedSession]);

  // Real-time Video/Image Lip-Sync & Expression Simulation
  useEffect(() => {
    if (!outputAnalyser) return;
    
    let animationId: number;
    const dataArray = new Uint8Array(outputAnalyser.frequencyBinCount);

    const updateVisuals = () => {
      outputAnalyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const targetIntensity = average / 140.0; 
      
      // Smoothing function (Linear Interpolation) to make it look like "organic" speech
      smoothedIntensity.current += (targetIntensity - smoothedIntensity.current) * 0.25;
      const intensity = smoothedIntensity.current;

      const targetEl = isUsingCustomImage ? personaImgRef.current : personaVideoRef.current;

      if (targetEl && personaContainerRef.current) {
        // High-fidelity Lip-sync simulation
        // 1. Jaw Movement: Vertical stretch tied to speech intensity
        const jawStretch = 1 + intensity * 0.15;
        // 2. Head Bob: Subtle scaling for perspective shift
        const subtleScale = 1 + intensity * 0.06;
        // 3. Expressive Tilt: Mimic human conversational movement
        const tilt = intensity * 5; 
        // 4. Dynamic Lighting: Pulse brightness based on speech volume
        const brightness = 1 + intensity * 0.35;
        
        targetEl.style.transform = `scale(${subtleScale}) scaleY(${jawStretch}) rotate(${tilt}deg)`;
        targetEl.style.filter = `brightness(${brightness}) contrast(${1 + intensity * 0.15})`;
        
        // Digital Link Aura Intensity
        if (intensity > 0.01) {
            personaContainerRef.current.style.boxShadow = `inset 0 0 ${80 + intensity * 150}px rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
        } else {
            personaContainerRef.current.style.boxShadow = 'inset 0 0 60px rgba(0,0,0,0.4)';
        }
      }
      
      animationId = requestAnimationFrame(updateVisuals);
    };

    updateVisuals();
    return () => cancelAnimationFrame(animationId);
  }, [outputAnalyser, isUsingCustomImage]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions, activeTab, selectedSession]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPersonaUpdate(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
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
          <p className="font-black text-xs uppercase tracking-widest text-slate-400">Waiting for clinical voice input...</p>
        </div>
      ) : (
        list.map((entry) => (
          <div key={entry.id} className={`flex w-full ${entry.role === 'doctor' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="max-w-[80%]">
              <div className={`flex items-center gap-2 mb-2 px-3 ${entry.role === 'doctor' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${entry.role === 'doctor' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${entry.role === 'doctor' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {entry.role === 'doctor' ? 'Clinical Professional' : 'Patient (Interpreted)'}
                </span>
              </div>
              <div className={`px-8 py-6 rounded-[2.5rem] bg-white border-2 shadow-sm ${entry.role === 'doctor' ? 'border-blue-100 rounded-tr-none' : 'border-emerald-100 rounded-tl-none'}`}>
                {entry.role === 'patient' && <p className="text-slate-400 italic text-[11px] mb-4 font-medium leading-tight tracking-tight">Original Source: "{entry.sourceText}"</p>}
                <div className={`pt-2 ${entry.role === 'patient' ? 'border-t-2 border-emerald-50' : ''}`}>
                  <p className="text-slate-900 font-bold text-lg leading-relaxed">
                    {entry.role === 'doctor' ? entry.sourceText : entry.translatedText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.95; }
          50% { transform: translateY(-6px) scale(1.02); opacity: 1; }
        }
        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.2; }
        }
        .persona-breathing {
          animation: breathe 5s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .persona-blinking {
          animation: blink 6s infinite;
        }
        audio {
          height: 40px;
          border-radius: 9999px;
          width: 100%;
        }
        audio::-webkit-media-controls-panel {
          background-color: #eff6ff;
        }
        .scanline {
          width: 100%;
          height: 3px;
          background: rgba(59, 130, 246, 0.15);
          position: absolute;
          z-index: 10;
          top: 0;
          left: 0;
          animation: scan 3.5s linear infinite;
          pointer-events: none;
        }
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => { setActiveTab('live'); setSelectedSession(null); }}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white text-slate-400 hover:text-slate-600'}`}
        >
          Live Interpretation
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
                {currentPatientName ? `Consultation: ${currentPatientName}` : 'Session Active'}
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Real-time bi-directional translation via Neural Audio.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Translation Column */}
            <div className="lg:col-span-7 bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[750px] relative">
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
                        <><div className="w-3 h-3 bg-white rounded-full animate-pulse"></div> Resume Live Sync</>
                    ) : (
                        <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Hold Interpretation</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Virtual Persona (Video/AI) Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-950 rounded-[3rem] shadow-2xl border border-slate-800 h-[600px] relative overflow-hidden flex flex-col items-center justify-end group">
                <div className="scanline"></div>
                
                {/* Cinema Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900/40 z-10"></div>
                
                {/* Persona Visualization Area */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="persona-breathing w-full h-full relative">
                      <div className="persona-blinking w-full h-full">
                          {isUsingCustomImage ? (
                            <img 
                              ref={personaImgRef}
                              src={personaImageUrl} 
                              className={`w-full h-full object-cover transition-all duration-75 ${isAgentSpeaking ? 'grayscale-0' : 'grayscale-[0.3]'}`}
                              alt="Digital Interpreter"
                            />
                          ) : (
                            <video 
                              ref={personaVideoRef}
                              // High quality professional medical stock video for "Live Persona" feel
                              src="https://player.vimeo.com/external/494252666.sd.mp4?s=7216773227447250646c21a4f36c57d8122d645e&profile_id=165&oauth2_token_id=57447761" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline
                              className={`w-full h-full object-cover transition-all duration-100 ${isAgentSpeaking ? 'grayscale-0' : 'grayscale-[0.4] opacity-80'}`}
                            />
                          )}
                      </div>
                  </div>
                  
                  {/* Digital HUD Overlays */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] z-[5]"></div>
                  {isAgentSpeaking && (
                    <div className="absolute inset-0 bg-blue-500/15 animate-pulse mix-blend-screen z-[6]"></div>
                  )}
                  
                  {/* Digital HUD Elements */}
                  <div className="absolute top-10 left-10 z-20 flex flex-col gap-2 pointer-events-none opacity-60">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Signal Locked</span>
                     </div>
                  </div>
                </div>

                <div ref={personaContainerRef} className="absolute inset-0 pointer-events-none transition-all duration-300 z-[7]"></div>

                {/* Subtitles Overlay */}
                <div className="relative z-20 w-full p-10 text-center bg-gradient-to-t from-slate-950 to-transparent">
                  <div className={`min-h-[160px] flex items-center justify-center transition-all duration-500 ${isAgentSpeaking ? 'opacity-100 translate-y-0 scale-100' : 'opacity-20 translate-y-4 scale-95'}`}>
                    <p className="text-3xl font-black text-white leading-tight italic drop-shadow-[0_4px_30px_rgba(0,0,0,1)] px-4">
                      {isAgentSpeaking ? `"${liveSubtitle}"` : "Initializing Video Feed..."}
                    </p>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Digital Link: {isActive ? 'CONNECTED' : 'STANDBY'}</span>
                    </div>
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">V-INTERPRET LIVE V7</span>
                  </div>
                </div>
              </div>

              {/* Persona Controls */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Avatar Configuration</h4>
                        <p className="text-sm font-bold text-slate-900 mt-1">Real-time Spectral Jaw-Sync</p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-lg active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Replace Interpreter Feed
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                 </div>
                 
                 <p className="text-[10px] text-slate-400 mt-5 italic leading-relaxed text-center font-bold tracking-tight">The interpreter's jaw movement and facial brightness are procedurally synchronized with the AI audio stream for a life-like translation experience.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500">
           {selectedSession ? (
            <div className="space-y-6">
              <button onClick={() => setSelectedSession(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Return to Consultation Archives
              </button>
              
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-slate-100 pb-10">
                    <div className="space-y-1">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{selectedSession.patientName}</h3>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{new Date(selectedSession.timestamp).toLocaleString()} • Total Duration: {formatDuration(selectedSession.duration)}</p>
                    </div>
                    {selectedSessionAudioUrl && (
                        <div className="bg-blue-50/70 p-6 rounded-[2.5rem] border-2 border-blue-100 min-w-[360px] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-200">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                </div>
                                <p className="text-[11px] font-black uppercase text-blue-700 tracking-[0.15em]">Clinical Voice Recording</p>
                            </div>
                            <audio controls src={selectedSessionAudioUrl} />
                        </div>
                    )}
                </div>
                
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8 px-2">Detailed Interpretation Log</h4>
                {renderTranscriptionList(selectedSession.transcriptions)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedSessions.length === 0 ? (
                <div className="col-span-full py-48 text-center bg-white/50 rounded-[4rem] border-4 border-dashed border-slate-200">
                    <div className="bg-slate-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-14 h-14 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em]">Archives Currently Empty</p>
                    <p className="text-slate-300 text-sm mt-2">New sessions will automatically appear here upon completion.</p>
                </div>
              ) : (
                savedSessions.map(session => (
                  <div key={session.id} onClick={() => setSelectedSession(session)} className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-2xl transition-all group active:scale-[0.98] flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-wider">{new Date(session.timestamp).toLocaleDateString()}</div>
                        <span className="text-slate-400 text-[11px] font-black tracking-widest">{formatDuration(session.duration)}</span>
                    </div>
                    <h4 className="font-black text-2xl text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">{session.patientName}</h4>
                    <p className="text-sm text-slate-500 mb-10 flex-grow font-medium">{session.transcriptions.length} Interpretation cycles recorded in clinical session.</p>
                    
                    <div className="flex items-center justify-between border-t border-slate-50 pt-8 mt-auto">
                         <div className="flex items-center gap-2 text-blue-600 font-black text-[11px] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                          Full Review
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                        {session.audioBlob && (
                          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2h-1.1c-.24 0-.47-.09-.64-.26L13 5.4l-1.26 1.34c-.17.17-.4.26-.64.26H9a2 2 0 01-2-2V4z" /></svg>
                          </div>
                        )}
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
