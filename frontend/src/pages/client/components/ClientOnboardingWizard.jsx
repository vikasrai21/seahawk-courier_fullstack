import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  MapPin,
  PackagePlus,
  FileSpreadsheet,
  Wallet,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const steps = [
  {
    id: 'profile',
    title: 'Verify Profile',
    icon: UserCircle,
    desc: 'Ensure your billing and contact details are correct before shipping.',
  },
  {
    id: 'pickup',
    title: 'Add Pickup Location',
    icon: MapPin,
    desc: 'Set up your primary warehouse or store for seamless pickups.',
  },
  {
    id: 'book',
    title: 'First Shipment',
    icon: PackagePlus,
    desc: 'Create your very first single shipment manually.',
  },
  {
    id: 'import',
    title: 'Bulk Import',
    icon: FileSpreadsheet,
    desc: 'Learn how to upload hundreds of orders via CSV or Excel.',
  },
  {
    id: 'wallet',
    title: 'Fund Wallet',
    icon: Wallet,
    desc: 'Add credits or setup auto-topup so your shipments never pause.',
  },
];

export default function ClientOnboardingWizard({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Prevent scrolling when wizard is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    localStorage.setItem('shk_onboarding_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('shk_onboarding_skipped', 'true');
    onClose();
  };

  const navigateToFeature = (path) => {
    handleComplete();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex h-[550px] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Left Sidebar - Step Progress */}
        <div className="hidden w-1/3 flex-col border-r border-slate-100 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50 md:flex">
          <div className="mb-8 flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Sparkles size={20} />
            <h2 className="font-black tracking-tight">Getting Started</h2>
          </div>
          <div className="relative flex-1">
            <div className="absolute bottom-0 left-3 top-2 w-[2px] bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col gap-6 relative z-10">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                return (
                  <div key={step.id} className={`flex items-start gap-4 transition-opacity duration-300 ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${
                      isActive ? 'border-sky-500 text-sky-600 dark:text-sky-400' :
                      isPast ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      'border-slate-300 text-slate-400 dark:border-slate-700'
                    }`}>
                      {isPast ? <CheckCircle2 size={12} strokeWidth={3} /> : <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-sky-500' : 'bg-transparent'}`} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{step.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col p-8 md:p-12">
          <button onClick={handleSkip} className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X size={20} />
          </button>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col justify-center"
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                  {(() => {
                    const CurrentIcon = steps[currentStep].icon;
                    return <CurrentIcon size={32} strokeWidth={1.5} />;
                  })()}
                </div>
                <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {steps[currentStep].title}
                </h3>
                <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {steps[currentStep].desc}
                </p>

                {/* Step specific interactive content */}
                {currentStep === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Welcome, {user?.name || 'Partner'}!</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your registered email is {user?.email || 'N/A'}. Let's get your logistics engine started.</p>
                  </div>
                )}
                
                {currentStep === 1 && (
                  <button onClick={() => navigateToFeature('/portal/pickups')} className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Go to Pickup Settings</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add your warehouse address now</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                  </button>
                )}

                {currentStep === 2 && (
                  <button onClick={() => navigateToFeature('/portal/book-shipment')} className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Create First Shipment</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Try the single booking form</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button onClick={() => navigateToFeature('/portal/import')} className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Explore Bulk Import</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Download the CSV template</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                  </button>
                )}

                {currentStep === 4 && (
                  <button onClick={() => navigateToFeature('/portal/wallet')} className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Visit Wallet Settings</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enable WhatsApp recharge alerts</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-500 disabled:opacity-0 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-3">
              <button onClick={handleSkip} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                Skip for now
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-sky-500 active:bg-sky-700 shadow-md shadow-sky-500/20"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Continue'}
                {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
