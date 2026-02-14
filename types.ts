
export interface Message {
  id: string;
  role: 'doctor' | 'patient' | 'system';
  text: string;
  timestamp: Date;
  language?: string;
}

export enum SessionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

export interface TranscriptionEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  role: 'doctor' | 'patient';
  timestamp: number;
}

export interface SavedSession {
  id: string;
  timestamp: number;
  transcriptions: TranscriptionEntry[];
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number;
}
