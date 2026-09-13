import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        const element = document.querySelector(steps[currentStep].selector);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      };

      handleResize(); // Initial calculation
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, currentStep, steps]);
  
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const position = step?.position || 'bottom';

  if (!isOpen || !targetRect) return null;

  const popoverStyle: React.CSSProperties = {};
  const arrowStyle: React.CSSProperties = {};
  
  const popoverWidth = 300; // estimated width
  const popoverHeight = popoverRef.current?.offsetHeight || 150; // estimated height
  const gap = 15;
  
  switch (position) {
    case 'bottom':
      popoverStyle.top = `${targetRect.bottom + gap}px`;
      popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
      arrowStyle.bottom = '100%';
      arrowStyle.left = '50%';
      arrowStyle.transform = 'translateX(-50%)';
      arrowStyle.borderBottom = '8px solid rgb(55 65 81)';
      arrowStyle.borderLeft = '8px solid transparent';
      arrowStyle.borderRight = '8px solid transparent';
      break;
    case 'top':
      popoverStyle.top = `${targetRect.top - popoverHeight - gap}px`;
      popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
      arrowStyle.top = '100%';
      arrowStyle.left = '50%';
      arrowStyle.transform = 'translateX(-50%)';
      arrowStyle.borderTop = '8px solid rgb(55 65 81)';
      arrowStyle.borderLeft = '8px solid transparent';
      arrowStyle.borderRight = '8px solid transparent';
      break;
    case 'right':
       popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
       popoverStyle.left = `${targetRect.right + gap}px`;
       arrowStyle.right = '100%';
       arrowStyle.top = '50%';
       arrowStyle.transform = 'translateY(-50%)';
       arrowStyle.borderRight = '8px solid rgb(55 65 81)';
       arrowStyle.borderTop = '8px solid transparent';
       arrowStyle.borderBottom = '8px solid transparent';
      break;
    case 'left':
        popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
        popoverStyle.left = `${targetRect.left - popoverWidth - gap}px`;
        arrowStyle.left = '100%';
        arrowStyle.top = '50%';
        arrowStyle.transform = 'translateY(-50%)';
        arrowStyle.borderLeft = '8px solid rgb(55 65 81)';
        arrowStyle.borderTop = '8px solid transparent';
        arrowStyle.borderBottom = '8px solid transparent';
      break;
  }
  
  // Ensure popover stays within viewport
  if (parseFloat(String(popoverStyle.left)) < 10) {
    popoverStyle.left = '10px';
  }
  if (parseFloat(String(popoverStyle.left)) + popoverWidth > window.innerWidth - 10) {
    popoverStyle.left = `${window.innerWidth - popoverWidth - 10}px`;
  }
  if (parseFloat(String(popoverStyle.top)) < 10) {
    popoverStyle.top = '10px';
  }
  

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"></div>

      {/* Spotlight */}
      <div
        className="absolute transition-all duration-300 ease-in-out bg-gray-900"
        style={{
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          left: `${targetRect.left - 4}px`,
          top: `${targetRect.top - 4}px`,
          width: `${targetRect.width + 8}px`,
          height: `${targetRect.height + 8}px`,
        }}
      ></div>

      {/* Popover */}
      <div
        ref={popoverRef}
        className="absolute bg-slate-900 text-white rounded-2xl shadow-2xl p-5 border border-slate-700/80 transition-all duration-300 ease-in-out z-[9999]"
        style={{ ...popoverStyle, width: `${popoverWidth}px` }}
      >
        <div className="absolute" style={arrowStyle} />
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="text-base font-bold tracking-tight text-white">{step.title}</h3>
                <span className="text-[11px] font-mono text-indigo-400">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">{step.content}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Skip Tour
          </button>
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;