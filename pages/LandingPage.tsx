import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, User, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-grow bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-32">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           {/* Abstract Pattern */}
           <div className="w-96 h-96 bg-amber-500 rounded-full blur-3xl absolute -top-20 -left-20"></div>
           <div className="w-96 h-96 bg-blue-600 rounded-full blur-3xl absolute bottom-0 right-0"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full mb-8 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">Live in 50+ Cities</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Instant Roadside Help, <br className="hidden md:block"/> 
            <span className="text-amber-500">Wherever You Are.</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            Connect with verified mechanics and towing partners in minutes. 
            Don't let a breakdown stop your journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/auth?role=customer')}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20"
            >
              <User size={20} />
              <span>I need assistance</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => navigate('/auth?role=provider')}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700"
            >
              <Wrench size={20} />
              <span>I offer services</span>
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How Mech On Wheels Works</h2>
            <p className="text-slate-600">Get back on the road in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: MapPin, 
                title: "1. Share Location", 
                desc: "Tell us where you are and what the issue is. We use AI to diagnose the problem." 
              },
              { 
                icon: ShieldCheck, 
                title: "2. Get Matched", 
                desc: "We connect you with the nearest verified mechanic or towing service immediately." 
              },
              { 
                icon: Clock, 
                title: "3. Quick Service", 
                desc: "Track your provider in real-time. Pay securely and get back on the road." 
              }
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;