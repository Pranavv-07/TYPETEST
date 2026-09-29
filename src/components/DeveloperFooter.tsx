import React from 'react';
import { Phone, Mail, Linkedin, Sparkles, Code2, Heart } from 'lucide-react';

export const DeveloperFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/95 text-slate-400 py-8 px-4 font-sans relative overflow-hidden">
      {/* Subtle emerald glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Branding & Attribution */}
        <div className="text-center md:text-left space-y-1.5">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Code2 className="w-3.5 h-3.5" />
              DEVELOPED BY PRANAV VEDULA | 24B11CS355
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Department of Technical Training (DOTT), Aditya University
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            High-Performance Institutional Typing Speed Assessment & Examination Engine
          </p>
        </div>

        {/* Connect With Me Details */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Phone */}
          <a
            href="tel:8179344043"
            title="Call Developer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs font-medium group shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono">8179344043</span>
          </a>

          {/* Email */}
          <a
            href="mailto:vedulapranav@gmail.com"
            title="Email Developer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs font-medium group shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono">vedulapranav@gmail.com</span>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/pranavvedula/"
            target="_blank"
            rel="noopener noreferrer"
            title="Connect on LinkedIn"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all text-xs font-semibold group shadow-sm shadow-emerald-500/10"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Linkedin className="w-3.5 h-3.5" />
            </div>
            <span>LinkedIn Profile</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
