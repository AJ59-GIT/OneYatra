
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ArrowLeft, ExternalLink, Shield, Globe, Users, Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from '../components/Button';
import { motion } from 'motion/react';

const CompanyInfoPage = () => {
  const navigate = useNavigate();
  const { t } = useSettings();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Company',
      icon: <Globe className="h-5 w-5 text-blue-500" />,
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Blog', path: '/blog' },
        { label: 'Careers', path: '/about' },
        { label: 'Press', path: '/about' }
      ]
    },
    {
      title: 'Support',
      icon: <Heart className="h-5 w-5 text-red-500" />,
      links: [
        { label: 'Help Center (FAQ)', path: '/faq' },
        { label: 'Travel Rules & MaaS', path: '/travel-rules' },
        { label: 'Cancellation Portal', path: '/cancellation' },
        { label: 'Contact Us', path: '/support' }
      ]
    },
    {
      title: 'Partners',
      icon: <Users className="h-5 w-5 text-green-500" />,
      links: [
        { label: 'Vendor Onboarding', path: '/vendor-onboarding' },
        { label: 'Corporate Travel', path: '/corporate' },
        { label: 'Affiliate Program', path: '/refer-earn' },
        { label: 'Agent Login', path: '/vendor-onboarding' }
      ]
    },
    {
      title: 'Legal',
      icon: <Shield className="h-5 w-5 text-purple-500" />,
      links: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Cookie Policy', path: '/privacy' },
        { label: 'Security', path: '/privacy' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-app-bg/80 backdrop-blur-md border-b border-app-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-app-card rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Company Information</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-brand-500 rounded-3xl shadow-premium mb-6">
            <Zap className="h-10 w-10 text-white" fill="currentColor" />
          </div>
          <h2 className="text-4xl font-bold mb-4">{t('app_name')}</h2>
          <p className="text-lg text-app-text opacity-60 max-w-2xl mx-auto">
            India's most trusted unified mobility platform. Connecting billions, one journey at a time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-app-card border border-app-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-app-bg rounded-xl border border-app-border">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wider text-sm">{section.title}</h3>
              </div>
              <ul className="space-y-4">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <button 
                      onClick={() => navigate(link.path)}
                      className="flex items-center justify-between w-full text-app-text opacity-60 hover:text-brand-500 hover:opacity-100 transition-all group"
                    >
                      <span className="font-medium">{link.label}</span>
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="bg-brand-500 text-white rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80 uppercase tracking-widest font-bold mb-1">Email Us</p>
                  <p className="text-lg font-medium">support@oneyatra.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80 uppercase tracking-widest font-bold mb-1">Call Us</p>
                  <p className="text-lg font-medium">1800-YATRA-HELP</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Socials */}
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Follow our journey</p>
          <div className="flex justify-center gap-6">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <button key={i} className="p-4 bg-app-card rounded-2xl border border-app-border text-app-text opacity-60 hover:text-brand-500 hover:border-brand-500 transition-all hover:-translate-y-1">
                <Icon className="h-6 w-6" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-app-border text-center">
        <p className="text-sm opacity-40">© {currentYear} OneYatra Technologies Pvt. Ltd. All rights reserved.</p>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
