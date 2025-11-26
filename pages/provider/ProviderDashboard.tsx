import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subscribeToProviderRequests, updateRequestStatus, toggleProviderAvailability } from '../../services/firebase';
import { UserProfile, ServiceRequest } from '../../types';
import { MapPin, Clock, CheckCircle, AlertCircle, Phone } from 'lucide-react';

interface Props {
  user: UserProfile;
}

const ProviderDashboard: React.FC<Props> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(user.isAvailable || false);
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'history'>('new');

  useEffect(() => {
    // Sync local availability state with user prop
    setIsAvailable(user.isAvailable || false);
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToProviderRequests(user.uid, (data) => {
      setRequests(data);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAvailabilityToggle = async () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    await toggleProviderAvailability(user.uid, newState);
  };

  const handleAccept = async (id: string) => {
    await updateRequestStatus(id, 'ACCEPTED', user.uid);
  };

  const handleStatusUpdate = async (id: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    await updateRequestStatus(id, status);
  };

  // Filter requests
  const newRequests = requests.filter(r => r.status === 'PENDING' && !r.providerId);
  const activeRequests = requests.filter(r => (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') && r.providerId === user.uid);
  const historyRequests = requests.filter(r => (r.status === 'COMPLETED' || r.status === 'CANCELLED') && r.providerId === user.uid);

  // Mock Data for Chart
  const chartData = [
    { name: 'Mon', earnings: 120 },
    { name: 'Tue', earnings: 200 },
    { name: 'Wed', earnings: 150 },
    { name: 'Thu', earnings: 280 },
    { name: 'Fri', earnings: 190 },
    { name: 'Sat', earnings: 350 },
    { name: 'Sun', earnings: 300 },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Availability Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between md:w-1/3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Status</h2>
            <p className="text-slate-500 text-sm mb-4">Toggle your visibility to customers.</p>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
              {isAvailable ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button 
              onClick={handleAvailabilityToggle}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isAvailable ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[200px]">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Weekly Earnings</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Requests Management */}
      <div>
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'new' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            New Requests ({newRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Active Jobs ({activeRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="grid gap-4">
          {(activeTab === 'new' ? newRequests : activeTab === 'active' ? activeRequests : historyRequests).map(req => (
            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-amber-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-bold text-lg text-slate-900 capitalize flex items-center gap-2">
                     {req.serviceType.replace('_', ' ')}
                     <span className="text-xs font-normal px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                       {req.vehicleType}
                     </span>
                   </h3>
                   <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} /> {Math.floor((Date.now() - req.createdAt) / 60000)}m ago</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {req.locationText}</span>
                   </div>
                 </div>
                 {req.estimatedPrice && (
                    <div className="text-right">
                       <span className="block text-xs text-slate-400">Est. Earnings</span>
                       <span className="font-bold text-amber-600">${req.estimatedPrice}</span>
                    </div>
                 )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-slate-700 text-sm mb-4">
                <span className="font-semibold text-slate-900">Issue:</span> {req.issueDescription}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {activeTab === 'new' && (
                  <button 
                    onClick={() => handleAccept(req.id)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 rounded-lg transition-colors"
                  >
                    Accept Job
                  </button>
                )}

                {activeTab === 'active' && (
                  <>
                     <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200">
                        <Phone size={18} /> Call Customer
                     </button>
                     {req.status === 'ACCEPTED' && (
                       <button 
                         onClick={() => handleStatusUpdate(req.id, 'IN_PROGRESS')}
                         className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors"
                       >
                         Mark In Progress
                       </button>
                     )}
                     {req.status === 'IN_PROGRESS' && (
                       <button 
                         onClick={() => handleStatusUpdate(req.id, 'COMPLETED')}
                         className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                       >
                         <CheckCircle size={18} /> Complete Job
                       </button>
                     )}
                  </>
                )}
                
                {activeTab === 'history' && (
                   <span className={`text-sm font-bold ${req.status === 'COMPLETED' ? 'text-green-600' : 'text-red-500'}`}>
                      Job {req.status}
                   </span>
                )}
              </div>
            </div>
          ))}
          
          {(activeTab === 'new' ? newRequests : activeTab === 'active' ? activeRequests : historyRequests).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No {activeTab} requests found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;