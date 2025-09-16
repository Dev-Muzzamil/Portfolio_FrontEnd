import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

const InactivityWarning = () => {
  const { showInactivityWarning, dismissWarning } = useAuth();

  if (!showInactivityWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-lg shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-orange-800">
              Session Timeout Warning
            </h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>
                You will be automatically logged out in 5 minutes due to inactivity. 
                Click "Stay Logged In" to extend your session.
              </p>
            </div>
            <div className="mt-4">
              <div className="flex space-x-3">
                <button
                  onClick={dismissWarning}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={dismissWarning}
                  className="text-orange-500 hover:text-orange-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;
