import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-8xl font-bold text-primary-600 mb-4"
          >
            404
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Page Not Found
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            Sorry, the page you are looking for doesn't exist or has been moved.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="btn-outline flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Search Suggestion */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Looking for something specific?</span>
              </div>
              <p className="text-sm text-gray-500">
                Try visiting our main sections: About, Projects, Skills, or Contact
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;