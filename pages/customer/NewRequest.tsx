import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createServiceRequest } from '../../services/firebase';
import { analyzeVehicleIssue, AIAnalysisResult } from '../../services/geminiService';
import { UserProfile, SERVICE_TYPES, ServiceType, ServiceRequest } from '../../types';
import { ArrowLeft, MapPin, Wand2, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
}

const NewRequest: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVehicle = searchParams.get('vehicle') as 'bike' | 'car' || 'car';

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form Data
  const [vehicleType, setVehicleType] = useState(initialVehicle);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('onsite_repair');
  
  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState<AIAnalysisResult | null>(null);

  const handleAIAnalysis = async () => {
    if (!issueDescription || issueDescription.length < 5) return;
    
    setIsAnalyzing(true);
    setAiSuggestion(null);
    try {
      const result = await analyzeVehicleIssue(vehicleType, issueDescription);
      if (result) {
        setAiSuggestion(result);
        setServiceType(result.suggestedService);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Safe parsing of estimated price
    let price: number | undefined = undefined;
    if (aiSuggestion?.estimatedCostRange) {
      const matches = aiSuggestion.estimatedCostRange.match(/\d+/);
      if (matches && matches[0]) {
        price = parseInt(matches[0]);
      }
    }

    const requestData = {
        customerId: user.uid,
        vehicleType,
        vehicleModel,
        vehicleNumber,
        issueDescription,
        locationText,
        serviceType,
        estimatedPrice: price
    };

    try {
      await createServiceRequest(requestData);
      navigate('/customer/requests');
    } catch (error) {
      console.error("DB Create Failed:", error);
      
      // FALLBACK: If DB is down (timeout or permission error), save to LocalStorage
      // so the user can still see it in "My Requests" and proceed.
      const mockId = 'local_' + Date.now();
      const mockRequest: ServiceRequest = {
          id: mockId,
          ...requestData,
          providerId: null,
          status: 'PENDING',
          createdAt: Date.now(),
          updatedAt: Date.now()
      };

      const existingLocal = localStorage.getItem('local_requests');
      const localRequests = existingLocal ? JSON.parse(existingLocal) : [];
      localRequests.push(mockRequest);
      localStorage.setItem('local_requests', JSON.stringify(localRequests));

      alert("Network/Database issue detected. Request saved in offline mode.");
      navigate('/customer/requests');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/customer/home')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Home
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <h1 className="text-xl font-bold text-slate-900">Request Assistance</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the details to get connected with a mechanic.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Vehicle Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {['bike', 'car'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVehicleType(v as any)}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${
                  vehicleType === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Model</label>
              <input 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. Honda Civic"
                value={vehicleModel}
                onChange={e => setVehicleModel(e.target.value)}
              />
             </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
              <input 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. ABC-1234"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
              />
             </div>
          </div>

          {/* Issue & AI */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What's the problem?</label>
            <div className="relative">
              <textarea 
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                placeholder="Describe the issue (e.g. engine smoking, flat tyre, weird noise)..."
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                onBlur={handleAIAnalysis} // Trigger AI on blur if sufficient length
              />
              <button 
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || issueDescription.length < 5}
                className="absolute bottom-2 right-2 p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors disabled:opacity-50"
                title="Use AI to diagnose"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              </button>
            </div>
            
            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                  <Wand2 size={14} /> AI Diagnosis
                </div>
                <p className="text-amber-900 mb-1">{aiSuggestion.shortSummary}</p>
                <div className="flex justify-between items-center text-xs text-amber-700 mt-2">
                   <span>Suggested: <strong>{SERVICE_TYPES.find(s => s.id === aiSuggestion.suggestedService)?.label}</strong></span>
                   <span>Est. Cost: <strong>{aiSuggestion.estimatedCostRange}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Service Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Service Required</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => setServiceType(type.id)}
                  className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                    serviceType === type.id 
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                required
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Enter landmark or address"
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Request Assistance'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;