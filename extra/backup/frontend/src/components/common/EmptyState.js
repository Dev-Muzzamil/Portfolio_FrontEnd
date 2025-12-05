// Reusable empty state component to reduce redundancy

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Award, 
  Wrench, 
  FileText, 
  Search,
  Plus
} from 'lucide-react';
import { getEmptyStateConfig } from '../../utils/uiHelpers';

const EmptyState = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction,
  icon: CustomIcon,
  className = '',
  showAction = true,
  actionIcon = Plus,
  size = 'md'
}) => {
  const config = getEmptyStateConfig(type, {
    title,
    description,
    actionText,
    icon: CustomIcon
  });

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const iconSize = iconSizes[size];

  const getIconComponent = () => {
    if (CustomIcon) return CustomIcon;
    
    switch (config.icon) {
      case 'FolderOpen':
        return FolderOpen;
      case 'Award':
        return Award;
      case 'Wrench':
        return Wrench;
      case 'Search':
        return Search;
      default:
        return FileText;
    }
  };

  const IconComponent = getIconComponent();
  const ActionIcon = actionIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      {/* Icon */}
      <div className={`${iconSize} ${config.color} mb-4`}>
        <IconComponent className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Action Button */}
      {showAction && onAction && (
        <motion.button
          onClick={onAction}
          className="mt-6 btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ActionIcon className="w-4 h-4" />
          <span>{config.actionText}</span>
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
