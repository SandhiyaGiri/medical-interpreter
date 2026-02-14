
import React, { useState } from 'react';

interface PatientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const PatientOnboardingModal: React.FC<PatientOnboardingModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">New Consultation</h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">Please enter the patient's legal name to begin the recorded session.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Full Name</label>
              <input 
                autoFocus
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-lg shadow-inner"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!name.trim()}
                className="flex-[2] py-4 px-6 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Launch Session
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientOnboardingModal;
