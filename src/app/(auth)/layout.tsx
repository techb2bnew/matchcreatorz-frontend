import Logo from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: '#efefef' }}>

      {/* -- Left panel (brand) ---------------------------- */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12"
        style={{ background: 'linear-gradient(150deg, #1a1a1a 0%, #2d1a1a 60%, #1a1a1a 100%)' }}>
        {/* dot pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="relative text-center">
          <div className="flex justify-center mb-8">
            <Logo className="h-20 w-auto" />
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Connect. Create.<br />
            <span className="text-[#e84545]">Succeed.</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xs mx-auto leading-relaxed">
            The premier marketplace connecting talented creators with ambitious buyers worldwide.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { value: '50K+',  label: 'Creators',     fa: 'fa-users'       },
              { value: '120K+', label: 'Projects',     fa: 'fa-briefcase'   },
              { value: '98%',   label: 'Satisfaction', fa: 'fa-thumbs-up'   },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/5 rounded-2xl py-4 px-3 border border-white/10">
                <i className={`fa ${s.fa} text-[#e84545] text-xl mb-2 block`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- Right panel (form) ---------------------------- */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[540px] my-auto">
          {/* Mobile logo */}
          <div className="flex justify-center mb-4 lg:hidden">
            <Logo className="h-10 w-auto" />
          </div>
          {/* White card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#e0e0e0] px-6 py-5">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
