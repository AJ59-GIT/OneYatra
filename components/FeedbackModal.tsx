
import React, { useState } from 'react';
import { Smile, Frown, Meh, X } from 'lucide-react';
import { Button } from './Button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Submit logic
    setIsSubmitted(true);
    // Save to local storage to prevent multiple prompts
    localStorage.setItem('oneyatra_feedback_data', JSON.stringify({ score, feedback, date: new Date().toISOString() }));
    
    setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setScore(null);
        setFeedback('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            {!isSubmitted ? (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">How was your trip?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your feedback helps us improve.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5"/></button>
                    </div>

                    <div className="flex justify-center gap-6 mb-6">
                        <button 
                            onClick={() => setScore(1)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${score === 1 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 scale-110' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <Frown className="h-10 w-10" />
                            <span className="text-xs font-bold">Bad</span>
                        </button>
                        <button 
                            onClick={() => setScore(2)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${score === 2 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 scale-110' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <Meh className="h-10 w-10" />
                            <span className="text-xs font-bold">Okay</span>
                        </button>
                        <button 
                            onClick={() => setScore(3)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${score === 3 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 scale-110' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <Smile className="h-10 w-10" />
                            <span className="text-xs font-bold">Great</span>
                        </button>
                    </div>

                    {score !== null && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Tell us what you liked or disliked..."
                                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none h-24 mb-4"
                            />
                            <Button onClick={handleSubmit} className="w-full">Submit & Get ₹50</Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Smile className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Your feedback has been submitted. ₹50 has been credited to your wallet.</p>
                    <div className="inline-flex items-center text-brand-600 font-bold text-sm">
                        Closing in a few seconds...
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
