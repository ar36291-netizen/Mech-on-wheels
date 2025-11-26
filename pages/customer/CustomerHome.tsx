import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Car, ArrowRight, Activity, Clock } from 'lucide-react';
import { UserProfile } from '../../types';

interface Props {
  user: UserProfile;
}

const CustomerHome: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">What vehicle needs assistance today?</p>
        </div>
        <button 
          onClick={() => navigate('/customer/requests')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Clock size={16} />
          <span>My Requests</span>
        </button>
      </div>

      {/* Service Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => navigate('/customer/new-request?vehicle=bike')}
          className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-400 hover:shadow-md transition-all text-left"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bike size={120} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <Bike size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Two-Wheeler Service</h2>
            <p className="text-slate-500 mb-6">Bike breakdown, flat tyre, or fuel delivery.</p>
            <div className="inline-flex items-center text-amber-600 font-semibold">
              Request Help <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/customer/new-request?vehicle=car')}
          className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all text-left"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Car size={120} className="text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Car size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Four-Wheeler Service</h2>
            <p className="text-slate-500 mb-6">Car towing, engine issues, or lockouts.</p>
            <div className="inline-flex items-center text-blue-600 font-semibold">
              Request Help <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-slate-800 rounded-full">
           <Activity size={32} className="text-green-400" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold mb-1">24/7 Emergency Assistance</h3>
          <p className="text-slate-400 text-sm">Our providers are available round the clock. Average response time is 15 minutes.</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;