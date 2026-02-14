
import React from 'react';

interface LandingPageProps {
  onStartSession: () => void;
  onViewHistory: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartSession, onViewHistory }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-100">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-8 animate-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 font-black text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Professional Medical Suite
              </div>
              <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.95]">
                Bridging the <br />
                <span className="text-blue-600">Language Gap</span> <br />
                in Clinical Care.
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                Real-time, neural-driven medical interpretation between English-speaking clinicians and multilingual patients. Seamless, accurate, and recorded.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={onStartSession}
                  className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all"
                >
                  Start Consultation
                </button>
                <button 
                  onClick={onViewHistory}
                  className="px-10 py-6 bg-white text-slate-900 border-2 border-slate-200 rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  View Archives
                </button>
              </div>
              <div className="flex items-center gap-6 pt-6 opacity-60">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Optimized for:</p>
                 <div className="flex gap-4">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Hindi</span>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Tamil</span>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Telugu</span>
                 </div>
              </div>
            </div>
            
            <div className="hidden lg:block lg:col-span-5 relative animate-in slide-in-from-right duration-1000">
               <div className="relative rounded-[5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-8 border-white group transform hover:rotate-2 transition-all duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71f15360ee?auto=format&fit=crop&q=80&w=1000" 
                    className="w-full aspect-[4/5] object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-1000"
                    alt="Interpreter"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-12 left-12 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-100">Live Persona Active</p>
                      </div>
                      <p className="text-5xl font-black tracking-tight leading-none">V-Interpret</p>
                      <p className="font-bold text-sm text-blue-200 mt-2">Professional Neural Bridge V7.2</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 -skew-x-12 translate-x-1/2 z-0"></div>
      </section>

      {/* Trust Section */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-6 p-12 rounded-[4rem] hover:bg-blue-50 transition-all group">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-blue-100/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Clinical Data Security</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Full HIPAA compliance with local browser encryption. Your patient data stays private.</p>
            </div>
            <div className="space-y-6 p-12 rounded-[4rem] hover:bg-blue-50 transition-all group">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-blue-100/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5a18.022 18.022 0 01-3.827-5.802m3.37 7.221A18.06 18.06 0 0110.25 14.65M13.125 10.75a18.07 18.07 0 01-2.357 4.139m2.357-4.139L17 5m-1.048 9.5a18.02 18.02 0 002.357-4.139m-2.357 4.139L11 21m6-16V3.5" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Medical Lexicon Core</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Advanced understanding of complex clinical terminology in 15+ Indian dialects.</p>
            </div>
            <div className="space-y-6 p-12 rounded-[4rem] hover:bg-blue-50 transition-all group">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-blue-100/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Session Archives</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Download complete transcripts and high-fidelity audio recordings of every session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Clinical Intelligence Node</p>
          </div>
      </section>
    </div>
  );
};

export default LandingPage;
