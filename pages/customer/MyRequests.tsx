import React, { useEffect, useState } from 'react';
import { subscribeToCustomerRequests, updateRequestStatus } from '../../services/firebase';
import { UserProfile, ServiceRequest } from '../../types';
import { Clock, MapPin, Wrench, AlertCircle, WifiOff } from 'lucide-react';

interface Props {
  user: UserProfile;
}

const MyRequests: React.FC<Props> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch from Firestore (Real-time)
    const unsubscribe = subscribeToCustomerRequests(user.uid, (data) => {
      mergeRequests(data);
      setLoading(false);
    });

    // 2. Initial load from LocalStorage (Offline Fallback)
    const local = localStorage.getItem('local_requests');
    if (local) {
      try {
        const parsed = JSON.parse(local) as ServiceRequest[];
        const usersLocalRequests = parsed.filter(r => r.customerId === user.uid);
        mergeRequests(usersLocalRequests);
        // If we found local requests, we can stop loading immediately 
        // in case DB is slow/down
        if (usersLocalRequests.length > 0) {
           setLoading(false);
        }
      } catch(e) { console.error(e); }
    }

    return () => unsubscribe();
  }, [user.uid]);

  const mergeRequests = (newReqs: ServiceRequest[]) => {
    setRequests(prev => {
        const combined = [...prev, ...newReqs];
        // Deduplicate by ID
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        // Sort by date desc
        return unique.sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const handleCancel = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
        // Check if it's a local-only request
        if (id.startsWith('local_')) {
            const local = localStorage.getItem('local_requests');
            if (local) {
                const parsed = JSON.parse(local) as ServiceRequest[];
                const updated = parsed.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r);
                localStorage.setItem('local_requests', JSON.stringify(updated));
                mergeRequests(updated as any); // Force re-render
            }
        } else {
            await updateRequestStatus(id, 'CANCELLED');
        }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading your requests...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
             <Wrench size={32} />
           </div>
           <p className="text-slate-500">No service requests found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              {req.id.startsWith('local_') && (
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-bl">
                      OFFLINE MODE
                  </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 capitalize">
                    {req.serviceType.replace('_', ' ')} <span className="text-slate-400 font-normal text-sm">({req.vehicleModel})</span>
                  </h3>
                </div>
                {req.status === 'PENDING' && (
                  <button 
                    onClick={() => handleCancel(req.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
                 <div className="flex items-start gap-2 text-slate-600">
                    <AlertCircle size={16} className="mt-0.5 text-amber-500 shrink-0" />
                    <span>{req.issueDescription}</span>
                 </div>
                 <div className="flex items-start gap-2 text-slate-600">
                    <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
                    <span>{req.locationText}</span>
                 </div>
              </div>

              {req.status === 'ACCEPTED' && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                   <Clock size={16} /> A provider is on the way!
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;