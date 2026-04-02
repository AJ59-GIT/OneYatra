
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Shield, Info, Train, Bus, Car, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';

const RULES_DATA = [
  {
    id: 'railways',
    title: 'Indian Railways (IRCTC)',
    icon: <Train className="h-6 w-6 text-blue-600" />,
    rules: [
      {
        title: 'Booking Timings',
        content: 'General bookings open 120 days in advance. Tatkal opens at 10:00 AM (AC) and 11:00 AM (Non-AC) one day before departure.'
      },
      {
        title: 'Unreserved Ticket Validity',
        content: 'For distances < 200km, ticket is valid for 3 hours from issue or until the first scheduled train. For > 200km, valid for 3 days.'
      },
      {
        title: 'Cancellation Fees',
        content: 'Flat fee for 48+ hrs before. 25% for 12-48 hrs, 50% for 4-12 hrs. No refund within 4 hrs of departure.'
      },
      {
        title: 'ID Requirements',
        content: 'Original photo ID (Aadhar, PAN, Voter ID, etc.) is mandatory. Digital IDs via DigiLocker are accepted.'
      }
    ]
  },
  {
    id: 'mumbai-local',
    title: 'Mumbai Local Trains',
    icon: <Train className="h-6 w-6 text-brand-600" />,
    rules: [
      {
        title: 'Single Journey Validity',
        content: 'Journey must commence within 1 hour of ticket issue. No break journey allowed.'
      },
      {
        title: 'Return Journey Validity',
        content: 'Return leg is valid until midnight of the following day.'
      },
      {
        title: 'Platform Tickets',
        content: 'Valid for 2 hours from the time of issue.'
      }
    ]
  },
  {
    id: 'metro',
    title: 'Metro Services',
    icon: <MapPin className="h-6 w-6 text-green-600" />,
    rules: [
      {
        title: 'Delhi Metro (DMRC)',
        content: 'Max 170 minutes to exit paid area. Exiting same station limit is 20 minutes.'
      },
      {
        title: 'Mumbai Metro',
        content: 'Max 75 minutes to exit paid area. Exiting same station limit is 20 minutes.'
      },
      {
        title: 'Bangalore Metro',
        content: 'Max 120 minutes to exit paid area. Exiting same station limit is 20 minutes.'
      }
    ]
  },
  {
    id: 'buses',
    title: 'Interstate & State Buses',
    icon: <Bus className="h-6 w-6 text-orange-600" />,
    rules: [
      {
        title: 'Schedule Adherence',
        content: 'Reserved tickets are valid only for the specific bus and time mentioned.'
      },
      {
        title: 'Unreserved Local Buses',
        content: 'Tickets are valid only for the immediate journey. Cannot be reused for later buses.'
      },
      {
        title: 'Luggage Policy',
        content: 'Standard limit is 15-20kg. Commercial goods or oversized items incur extra charges.'
      }
    ]
  },
  {
    id: 'ride-hailing',
    title: 'Uber / Ola / Cabs',
    icon: <Car className="h-6 w-6 text-gray-800" />,
    rules: [
      {
        title: 'Cancellation Grace Period',
        content: 'Fees apply if cancelled 2-5 minutes after driver assignment or if driver waits 5+ minutes at pickup.'
      },
      {
        title: 'OTP Verification',
        content: 'Mandatory to share OTP with driver to ensure ride security and correct matching.'
      },
      {
        title: 'Surge Pricing',
        content: 'Regulated by state governments, typically capped at 1.5x to 2x of base fare.'
      }
    ]
  }
];

const MAAS_PROVIDERS = [
  {
    category: "Public Transport (Rail/Bus)",
    providers: ["IRCTC (Indian Railways)", "MSRTC (Maharashtra)", "DTC (Delhi)", "BMTC (Bangalore)", "BEST (Mumbai)", "KSRTC (Karnataka/Kerala)", "UPSRTC (Uttar Pradesh)", "TSRTC (Telangana)", "APSRTC (Andhra Pradesh)"]
  },
  {
    category: "Ride-Hailing & Cabs",
    providers: ["Uber", "Ola", "Rapido", "BluSmart", "InDrive", "Savaari", "Mega Cabs", "Meru Cabs"]
  },
  {
    category: "Metro Rail Networks",
    providers: ["DMRC (Delhi)", "MMRDA/MMOPL (Mumbai)", "BMRCL (Bangalore)", "CMRL (Chennai)", "KMRL (Kochi)", "HMRL (Hyderabad)", "L&T Metro", "Gujarat Metro (GMRC)"]
  },
  {
    category: "Micro-mobility (Bikes/Scooters)",
    providers: ["Yulu", "Bounce", "Vogo", "MyByk", "Zypp Electric"]
  },
  {
    category: "Inter-city Bus Aggregators",
    providers: ["RedBus", "AbhiBus", "ZingBus", "IntrCity SmartBus", "FreshBus", "GoTour"]
  },
  {
    category: "Car Rentals & Self-Drive",
    providers: ["Zoomcar", "Revv", "Myles", "Avis India", "IndusGo"]
  },
  {
    category: "Water Transport",
    providers: ["Mumbai-Mandwa Ferry", "Kochi Water Metro", "Kolkata Ferry Services", "Ro-Ro Ferry (Gujarat)"]
  }
];

interface TravelRulesPageProps {
  onBack: () => void;
}

const TravelRulesPage: React.FC<TravelRulesPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'providers'>('rules');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('railways');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full w-10 px-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Travel Rules & MaaS</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Rules & Regulations
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'providers'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            MaaS Providers
          </button>
        </div>

        {activeTab === 'rules' ? (
          <div className="space-y-6">
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 rounded-2xl p-4 flex gap-4 items-start mb-8">
              <div className="bg-brand-500/10 p-2 rounded-lg">
                <Info className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-900 dark:text-brand-100">Important Notice</h3>
                <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
                  These rules are based on current 2026 regulations. Always check with the specific service provider for the most up-to-date information before your journey.
                </p>
              </div>
            </div>

            {RULES_DATA.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                      {category.icon}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{category.title}</h2>
                  </div>
                  <div className={`transition-transform duration-300 ${expandedCategory === category.id ? 'rotate-180' : ''}`}>
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                </button>

                {expandedCategory === category.id && (
                  <div className="px-6 pb-6 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {category.rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="mt-1">
                          <CheckCircle2 className="h-4 w-4 text-brand-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{rule.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {rule.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-6 mt-8">
              <div className="flex gap-3 items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-amber-900 dark:text-amber-100">General Penalty Warning</h3>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                Traveling without a valid ticket or with an expired ticket (exceeding time limits) attracts a minimum penalty of <strong>₹250</strong> plus the full fare of the journey. In metros, overstaying in the paid area results in an hourly fine.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              India's Mobility as a Service (MaaS) ecosystem is powered by a diverse range of public and private providers. OneYatra integrates these services to provide a seamless travel experience.
            </p>

            {MAAS_PROVIDERS.map((group, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
              >
                <h3 className="text-brand-600 dark:text-brand-400 font-bold text-sm uppercase tracking-wider mb-4">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.providers.map((provider, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700"
                    >
                      {provider}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}

            <div className="mt-12 p-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl text-white text-center shadow-xl shadow-brand-500/20">
              <h3 className="text-xl font-bold mb-2">Become a Partner</h3>
              <p className="text-brand-100 text-sm mb-6 max-w-md mx-auto">
                Are you a mobility service provider? Join the OneYatra MaaS network and reach millions of travelers across India.
              </p>
              <Button className="bg-white text-brand-600 hover:bg-brand-50 border-none font-bold">
                Apply for Onboarding
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelRulesPage;
