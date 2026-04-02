
import React, { useState } from 'react';
import { ArrowLeft, Building2, Truck, UserCheck, BarChart3, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const VendorOnboardingPage = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    type: 'CAB',
    fleetSize: ''
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Application Submitted!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Our vendor relations team will review your application and get back to you within 48 hours to complete the verification process.</p>
        <Button onClick={onBack} size="lg">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Partner with OneYatra</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
            Join India's fastest-growing mobility network. Reach millions of travelers and grow your business with our advanced vendor tools.
          </p>

          <div className="space-y-8">
            {[
              { icon: BarChart3, title: 'Grow Your Revenue', desc: 'Access a massive pool of daily travelers looking for reliable transport options.' },
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'Get paid on time, every time. Transparent billing and automated settlements.' },
              { icon: UserCheck, title: 'Vendor Dashboard', desc: 'Manage your fleet, track earnings, and optimize routes with our powerful analytics.' }
            ].map((benefit, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center shrink-0">
                  <benefit.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Registration</h2>
            <div className="flex gap-1">
              {[1, 2].map(s => (
                <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? 'bg-brand-600' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
              ))}
            </div>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <Input 
                  label="Business Name" 
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  placeholder="e.g. SuperFast Travels" 
                  required
                />
                <Input 
                  label="Owner/Manager Name" 
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  placeholder="Full Name" 
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Email Address" 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="business@email.com" 
                    required
                  />
                  <Input 
                    label="Phone Number" 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91" 
                    required
                  />
                </div>
                <Button type="submit" className="w-full py-4 text-lg">Next Step</Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Service Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'CAB', label: 'Cab/Taxi', icon: Truck },
                      { id: 'BUS', label: 'Bus Operator', icon: Building2 }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({...formData, type: type.id})}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.type === type.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-800 text-gray-500'}`}
                      >
                        <type.icon className="h-6 w-6" />
                        <span className="text-xs font-bold">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Input 
                  label="Fleet Size" 
                  type="number"
                  value={formData.fleetSize}
                  onChange={e => setFormData({...formData, fleetSize: e.target.value})}
                  placeholder="Number of vehicles" 
                  required
                />
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button type="submit" className="flex-1">Submit Application</Button>
                </div>
              </div>
            )}
          </form>
          
          <p className="text-[10px] text-gray-500 text-center mt-6">
            By submitting, you agree to OneYatra's <span className="text-brand-600 font-bold cursor-pointer">Vendor Terms of Service</span> and <span className="text-brand-600 font-bold cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboardingPage;
