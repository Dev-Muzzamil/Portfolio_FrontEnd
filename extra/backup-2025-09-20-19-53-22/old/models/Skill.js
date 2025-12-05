const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'database', 'ai-ml', 'certification', 'other'],
    default: 'other'
  },
  level: {
    type: Number,
    min: 1,
    max: 100
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    default: '#3B82F6'
  },
  group: {
    type: String,
    enum: ['technical', 'soft', 'tools', 'frameworks', 'languages', 'ai-ml', 'other'],
    default: 'technical'
  },
  visible: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['manual', 'certificate'],
    default: 'manual'
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);


