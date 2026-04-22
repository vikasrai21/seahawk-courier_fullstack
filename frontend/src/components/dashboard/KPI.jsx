import { ArrowUp, ArrowDown } from 'lucide-react';

export default function KPI({ label, value, sub, icon: Icon, accent, trend }) {
  const up = trend >= 0;
  
  return (
    <div className="fade-in-up relative group overflow-hidden rounded-[32px] p-6 transition-all duration-500 hover:-translate-y-1 border border-slate-100 dark:border-[rgba(99,130,191,0.12)] bg-white/60 dark:bg-transparent backdrop-blur-xl"
      style={{
        background: 'var(--shk-surface, rgba(255,255,255,0.6))',
      }}
    >
      {/* Decorative top bar — gradient accent */}
      <div 
        className="absolute top-0 left-0 h-[2px] transition-all duration-700 group-hover:w-full" 
        style={{ 
          width: '50px',
          background: `linear-gradient(90deg, ${accent}, ${accent}66, transparent)`,
        }} 
      />

      {/* Ambient glow — dark mode only */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-0 dark:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl group-hover:opacity-0 dark:group-hover:opacity-100"
        style={{ background: `${accent}10` }}
      />

      {/* Subtle Background Pattern */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.06] pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <Icon size={120} strokeWidth={1} />
      </div>

      <div className="flex justify-between items-start mb-6">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg"
          style={{ 
            background: `${accent}15`, 
            border: `1px solid ${accent}30`,
            boxShadow: `0 4px 16px ${accent}15`
          }}
        >
          <Icon size={22} style={{ color: accent }} />
        </div>
        
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
            up ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                 'text-rose-500 bg-rose-500/10 border-rose-500/20'
          }`}>
            {up ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1 relative z-10">
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
          {value}
        </div>
        
        <div className="text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1" style={{ color: `${accent}cc` }}>
          {label}
        </div>
        
        {sub && (
          <div className="text-[10px] font-bold text-slate-400/70 dark:text-slate-500 italic">
            {sub}
          </div>
        )}
      </div>

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none rounded-[32px]" />
      
      {/* Hover glow border effect */}
      <div 
        className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ 
          boxShadow: `inset 0 0 0 1px ${accent}20, 0 12px 36px ${accent}10`
        }}
      />
    </div>
  );
}
