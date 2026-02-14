
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Header from './components/Header';
import InterpreterDashboard from './components/InterpreterDashboard';
import MeetingModal from './components/MeetingModal';
import PatientOnboardingModal from './components/PatientOnboardingModal';
import AudioVisualizer from './components/AudioVisualizer';
import { SessionStatus, TranscriptionEntry, SavedSession } from './types';
import { createBlob, decode, decodeAudioData } from './utils/audio-helpers';
import { saveSession, getAllSessions } from './utils/db';

const SYSTEM_INSTRUCTION = `You are an elite, real-time medical interpreter.
Objective: Interpret between a Doctor (English) and a Patient (speaking Tamil, Telugu, or Hindi).

BEHAVIOR:
1. PASSIVE START: Do not speak first. Wait for the patient or doctor to begin speaking.
2. LANGUAGE DETECTION: Automatically identify if the patient is speaking Tamil, Telugu, or Hindi.
3. BI-DIRECTIONAL TRANSLATION:
   - Patient speaks (Indian Language) -> Translate immediately to Clinical English for the Doctor.
   - Doctor speaks (English) -> Translate immediately to the Patient's detected Indian language.
4. ACCURACY: Translate exactly what is said. Do not summarize or add pleasantries like "The doctor says...".
5. CLINICAL FOCUS: Use precise medical terminology in both languages.

Response modality is AUDIO. Your transcription must match your spoken output exactly.`;

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

const App: React.FC = () => {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMeetingMode, setIsMeetingMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState('');

  const statusRef = useRef<SessionStatus>(SessionStatus.IDLE);
  const transcriptionsRef = useRef<TranscriptionEntry[]>([]);
  const patientNameRef = useRef<string>('');
  
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { transcriptionsRef.current = transcriptions; }, [transcriptions]);
  useEffect(() => { patientNameRef.current = currentPatientName; }, [currentPatientName]);

  const masterAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingMixerRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentInputText = useRef('');
  const currentOutputText = useRef('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const sessions = await getAllSessions();
    setSavedSessions(sessions.sort((a, b) => b.timestamp - a.timestamp));
  };

  const cleanup = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    
    setStatus(SessionStatus.IDLE);
    setAnalyserNode(null);
    setIsThinking(false);
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (masterAudioContextRef.current) {
      await masterAudioContextRef.current.close().catch(() => {});
      masterAudioContextRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (statusRef.current === SessionStatus.PAUSED) return;

    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && masterAudioContextRef.current) {
      setIsThinking(false);
      const ctx = masterAudioContextRef.current;
      
      if (ctx.state === 'suspended') await ctx.resume();
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      
      try {
        const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        source.connect(ctx.destination);
        if (recordingMixerRef.current) {
          source.connect(recordingMixerRef.current);
        }

        source.onended = () => sourcesRef.current.delete(source);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        sourcesRef.current.add(source);
      } catch (e) {
        console.error("Audio playback error", e);
      }
    }

    if (message.serverContent?.inputTranscription) {
      currentInputText.current += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
      currentOutputText.current += message.serverContent.outputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const source = currentInputText.current.trim();
      const target = currentOutputText.current.trim();
      if (source || target) {
        const isEnglish = /[a-zA-Z]{3,}/.test(source);
        const newEntry: TranscriptionEntry = {
          id: crypto.randomUUID(),
          sourceText: source || "...",
          translatedText: target || "...",
          role: isEnglish ? 'doctor' : 'patient',
          timestamp: Date.now()
        };
        setTranscriptions(prev => [...prev, newEntry]);
      }
      currentInputText.current = '';
      currentOutputText.current = '';
    }

    if (message.serverContent?.interrupted) {
      sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
      sourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      setIsThinking(false);
    }
  }, []);

  const startSession = async (patientName: string) => {
    await cleanup();
    setCurrentPatientName(patientName);
    try {
      setStatus(SessionStatus.CONNECTING);
      setTranscriptions([]);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      masterAudioContextRef.current = ctx;

      const mixer = ctx.createMediaStreamDestination();
      recordingMixerRef.current = mixer;

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let finalInputSourceStream: MediaStream;

      if (isMeetingMode) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          const micSourceNode = ctx.createMediaStreamSource(micStream);
          const tabSourceNode = ctx.createMediaStreamSource(displayStream);
          const internalBus = ctx.createMediaStreamDestination();
          micSourceNode.connect(internalBus);
          tabSourceNode.connect(internalBus);
          micSourceNode.connect(mixer);
          tabSourceNode.connect(mixer);
          finalInputSourceStream = internalBus.stream;
        } catch (e) {
          setIsMeetingMode(false);
          const micSourceNode = ctx.createMediaStreamSource(micStream);
          micSourceNode.connect(mixer);
          finalInputSourceStream = micStream;
        }
      } else {
        const micSourceNode = ctx.createMediaStreamSource(micStream);
        micSourceNode.connect(mixer);
        finalInputSourceStream = micStream;
      }
      activeStreamRef.current = finalInputSourceStream;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(finalInputSourceStream).connect(analyser);
      setAnalyserNode(analyser);

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus(SessionStatus.ACTIVE);
            startTimeRef.current = Date.now();
            
            const sourceNode = ctx.createMediaStreamSource(finalInputSourceStream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (statusRef.current === SessionStatus.ACTIVE) {
                const inputData = e.inputBuffer.getChannelData(0);
                sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
              }
            };
            
            sourceNode.connect(processor);
            const silentGain = ctx.createGain();
            silentGain.gain.value = 0;
            processor.connect(silentGain);
            silentGain.connect(ctx.destination);
            
            scriptProcessorRef.current = processor;
            startRecording(mixer.stream);
          },
          onmessage: handleMessage,
          onerror: (e) => { console.error(e); cleanup(); setStatus(SessionStatus.ERROR); },
          onclose: () => cleanup()
        }
      });
    } catch (err) {
      console.error(err);
      cleanup();
      setStatus(SessionStatus.ERROR);
    }
  };

  const startRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && statusRef.current === SessionStatus.ACTIVE) {
        chunksRef.current.push(e.data);
      }
    };
    recorder.onstop = async () => {
      if (chunksRef.current.length === 0) return;
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const duration = Date.now() - startTimeRef.current;
      
      const newSession: SavedSession = {
        id: crypto.randomUUID(),
        patientName: patientNameRef.current || 'Anonymous Patient',
        timestamp: Date.now(),
        transcriptions: [...transcriptionsRef.current],
        audioBlob: blob,
        audioUrl: URL.createObjectURL(blob),
        duration
      };

      await saveSession(newSession);
      loadSessions();
    };
    recorder.start(100);
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const togglePause = () => {
    if (status === SessionStatus.ACTIVE) {
      setStatus(SessionStatus.PAUSED);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.pause();
      }
    } else if (status === SessionStatus.PAUSED) {
      setStatus(SessionStatus.ACTIVE);
      if (recorderRef.current && recorderRef.current.state === 'paused') {
        recorderRef.current.resume();
      }
      masterAudioContextRef.current?.resume();
    }
  };

  const handleToggleSession = () => {
    if (status === SessionStatus.IDLE || status === SessionStatus.ERROR) {
      setIsPatientModalOpen(true);
    } else {
      cleanup();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased">
      <Header status={status} onToggleSession={handleToggleSession} />
      <main className="flex-1 overflow-y-auto pb-48">
        <InterpreterDashboard 
          status={status}
          transcriptions={transcriptions}
          onToggleSession={handleToggleSession}
          onTogglePause={togglePause}
          onOpenInvite={() => setIsInviteOpen(true)}
          isModelThinking={isThinking}
          isRecording={isRecording}
          onDownloadTranscript={() => {}} 
          savedSessions={savedSessions}
          analyser={analyserNode}
          currentPatientName={currentPatientName}
        />
      </main>
      
      <MeetingModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        isMeetingMode={isMeetingMode} 
        onToggleMeetingMode={() => setIsMeetingMode(!isMeetingMode)} 
      />

      <PatientOnboardingModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onConfirm={(name) => {
          setIsPatientModalOpen(false);
          startSession(name);
        }}
      />

      <AudioVisualizer analyser={analyserNode} isActive={status === SessionStatus.ACTIVE} />

      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] sticky bottom-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status === SessionStatus.ACTIVE ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : status === SessionStatus.PAUSED ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
            <span>{status} {isMeetingMode && '• GMeet Sync'}</span>
          </div>
          {isRecording && <div className="text-rose-500 font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div> Recording Managed</div>}
        </div>
        <div className="flex gap-6 items-center">
          <span>{savedSessions.length} Archives</span>
          <span className="text-slate-300">|</span>
          <span>HIPAA COMPLIANT STORAGE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
