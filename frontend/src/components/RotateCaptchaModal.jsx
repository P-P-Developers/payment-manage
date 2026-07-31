import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

const IMAGES = [
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80', // Motorcycle
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80', // Classic car
  'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=400&q=80', // Sports car
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80', // Dog
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80', // Beagle dog
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', // Cat
  'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=400&q=80', // Modern House
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', // Mountain Peak
  'https://images.unsplash.com/photo-1580202313706-5a2a6b22eb82?auto=format&fit=crop&w=400&q=80', // Coffee Cup
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80', // House exterior
];

export default function RotateCaptchaModal({ isOpen, onClose, onSuccess }) {
  const [rotation, setRotation] = useState(0);
  const [targetOffset, setTargetOffset] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, error, success

  const initCaptcha = () => {
    // Generate a random initial tilt (e.g., between 45 and 315, but not too close to 0)
    let randomOffset = Math.floor(Math.random() * 270) + 45;
    setTargetOffset(randomOffset);
    setRotation(0);
    setStatus('idle');
    setImageIndex(Math.floor(Math.random() * IMAGES.length));
  };

  useEffect(() => {
    if (isOpen) {
      initCaptcha();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = () => {
    // Calculate final actual rotation
    const actualRotation = (targetOffset + parseInt(rotation)) % 360;
    
    // Check if image is roughly upright (between 0-20 or 340-360)
    if (actualRotation <= 20 || actualRotation >= 340) {
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 800); // Wait for success animation
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 600); // Remove error animation after a bit
    }
  };

  const handleRefresh = () => {
    initCaptcha();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 transform transition-all ${status === 'error' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${status === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
              {status === 'success' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Security Check
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
            Use the slider below to rotate the image until it is correctly upright.
          </p>

          <div className="relative">
            <div 
              className={`w-48 h-48 rounded-full overflow-hidden border-4 shadow-inner transition-colors duration-300 ${status === 'success' ? 'border-emerald-500 shadow-emerald-500/30' : status === 'error' ? 'border-rose-500 shadow-rose-500/30' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <img 
                src={IMAGES[imageIndex]} 
                alt="Captcha"
                className="w-full h-full object-cover transition-transform"
                style={{ transform: `rotate(${targetOffset + parseInt(rotation)}deg)` }}
                draggable="false"
              />
            </div>
            
            <button 
              onClick={handleRefresh}
              className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-lg rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
              title="Refresh Image"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full mt-2 px-2">
            <input 
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => {
                setRotation(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={status === 'success'}
            className={`w-full py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              status === 'success' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {status === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Verified
              </>
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
