import React, { useState, useEffect } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';

const InstitutionSelector = ({ 
  value, 
  onChange, 
  placeholder = "Select or enter institution...",
  className = "",
  disabled = false,
  educationData = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInstitution, setCustomInstitution] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Extract institutions from education data
  const educationInstitutions = educationData
    .map(edu => edu.institution)
    .filter(institution => institution && institution.trim())
    .filter((institution, index, self) => self.indexOf(institution) === index); // Remove duplicates

  // Common online platforms and tech companies
  const commonPlatforms = [
    'Coursera',
    'edX',
    'Udacity',
    'Udemy',
    'Pluralsight',
    'LinkedIn Learning',
    'Google',
    'Microsoft',
    'Amazon Web Services (AWS)',
    'IBM',
    'Oracle',
    'Salesforce',
    'Adobe',
    'Autodesk',
    'Unity Technologies',
    'Epic Games',
    'NVIDIA',
    'Intel',
    'AMD',
    'Other'
  ];

  // Combine education institutions with common platforms
  const allInstitutions = [
    ...educationInstitutions,
    ...(educationInstitutions.length > 0 ? ['---'] : []), // Separator if we have education institutions
    ...commonPlatforms
  ];

  // Check if current value is a custom institution (not in the list)
  useEffect(() => {
    if (value && !allInstitutions.includes(value)) {
      setCustomInstitution(value);
      setShowCustomInput(true);
    }
  }, [value, allInstitutions]);

  const handleSelect = (institution) => {
    if (institution === 'Other') {
      setShowCustomInput(true);
      setIsOpen(false);
      // Focus on the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Enter institution name..."]');
        if (input) input.focus();
      }, 100);
    } else {
      onChange(institution);
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customInstitution.trim()) {
      onChange(customInstitution.trim());
      setShowCustomInput(false);
    } else {
      // Show validation feedback
      const input = document.querySelector('input[placeholder="Enter institution name..."]');
      if (input) {
        input.classList.add('border-red-500');
        setTimeout(() => input.classList.remove('border-red-500'), 2000);
      }
    }
  };

  const handleCustomCancel = () => {
    setCustomInstitution('');
    setShowCustomInput(false);
    if (value && allInstitutions.includes(value)) {
      // Keep the existing value if it was from the list
    } else {
      onChange('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCustomCancel();
    }
  };

  const displayValue = showCustomInput ? customInstitution : value;

  if (showCustomInput) {
    return (
      <div className={`relative ${className}`}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={customInstitution}
              onChange={(e) => setCustomInstitution(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter institution name..."
              disabled={disabled}
              className="flex-1 input-field focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={disabled || !customInstitution.trim()}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            ✓ Save
          </button>
          <button
            type="button"
            onClick={handleCustomCancel}
            disabled={disabled}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            ✕ Cancel
          </button>
          </div>
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <span>💡</span>
            <span>Press Enter to save or Escape to cancel</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
      >
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {allInstitutions.map((institution, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(institution)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                value === institution ? 'bg-blue-50 text-blue-900 font-medium' : 'text-gray-900'
              } ${institution === '---' ? 'border-t border-gray-200 bg-gray-50 text-gray-500 cursor-default font-medium' : ''} ${
                institution === 'Other' ? 'border-t border-gray-200 font-medium text-blue-600 hover:bg-blue-50' : ''
              }`}
              disabled={institution === '---'}
            >
              <div className="flex items-center space-x-2">
                {institution === 'Other' && <span className="text-sm">➕</span>}
                <span>{institution === '---' ? 'Online Platforms & Companies' : institution}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default InstitutionSelector;
