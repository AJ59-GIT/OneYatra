
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Phone, Calendar, UserCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { getCurrentUser, updateUserProfile } from '../services/authService';
import { UserProfile } from '../types';

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'M' as 'M' | 'F' | 'O',
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || 'M',
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No user found");

      const updatedProfile: UserProfile = {
        ...currentUser,
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
      };

      const success = await updateUserProfile(updatedProfile);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Completed!</h1>
          <p className="text-gray-500 dark:text-slate-400">
            Thank you for completing your profile. Redirecting you to the home page...
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-600 via-brand-500 to-amber-500 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
              <p className="text-brand-100 text-sm">Help us personalize your travel experience by providing a few more details.</p>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-brand-400/20 rounded-full blur-2xl" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-brand-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-brand-500" />
                  Gender
                </label>
                <div className="flex gap-2">
                  {(['M', 'F', 'O'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                        formData.gender === g
                          ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-brand-200'
                      }`}
                    >
                      {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-brand-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Complete Profile
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
