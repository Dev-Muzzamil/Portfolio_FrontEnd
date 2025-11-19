// Normalize social links from either an array of { platform, url, isActive }
// or an object map { github: '...', linkedin: '...', ... }
export const normalizeSocial = (input) => {
  if (!input) return {};
  // If it's already an object map
  if (typeof input === 'object' && !Array.isArray(input)) {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === 'string' && v.trim()) out[k.toLowerCase()] = v.trim();
    }
    return out;
  }

  // If it's an array of platform entries
  if (Array.isArray(input)) {
    return input.reduce((acc, item) => {
      if (!item || item.isActive === false) return acc;
      const platform = (item.platform || '').toLowerCase();
      const url = (item.url || '').trim();
      if (!platform || !url) return acc;
      acc[platform] = url;
      return acc;
    }, {});
  }

  return {};
};

// Extract email/phone/location from a data object with sensible fallbacks
export const extractContact = (data = {}) => {
  const email = data.email || '';
  const phone = data.phone || '';
  const location = data.location || '';
  return { email, phone, location };
};
