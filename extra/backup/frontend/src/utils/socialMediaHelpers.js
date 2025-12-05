/**
 * Extract username from social media URLs
 */

export const extractUsernameFromUrl = (url, platform) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const cleanUrl = url.trim();
    
    switch (platform) {
      case 'github':
        // Extract from https://github.com/username or github.com/username
        const githubMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\?]+)/);
        return githubMatch ? githubMatch[1] : '';
        
      case 'linkedin':
        // Extract from https://linkedin.com/in/username or linkedin.com/in/username
        const linkedinMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\?]+)/);
        return linkedinMatch ? linkedinMatch[1] : '';
        
      case 'x':
        // Extract from https://x.com/username or x.com/username
        const xMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?x\.com\/([^\/\?]+)/);
        return xMatch ? xMatch[1] : '';
        
      case 'instagram':
        // Extract from https://instagram.com/username or instagram.com/username
        const instagramMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^\/\?]+)/);
        return instagramMatch ? instagramMatch[1] : '';
        
      case 'facebook':
        // Extract from https://facebook.com/username or facebook.com/username
        const facebookMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^\/\?]+)/);
        return facebookMatch ? facebookMatch[1] : '';
        
      case 'youtube':
        // Extract from https://youtube.com/@username or youtube.com/@username
        const youtubeMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?([^\/\?]+)/);
        return youtubeMatch ? youtubeMatch[1] : '';
        
      case 'tiktok':
        // Extract from https://tiktok.com/@username or tiktok.com/@username
        const tiktokMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/\?]+)/);
        return tiktokMatch ? tiktokMatch[1] : '';
        
      case 'discord':
        // Extract from https://discord.gg/invite or discord.gg/invite
        const discordMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?discord\.gg\/([^\/\?]+)/);
        return discordMatch ? discordMatch[1] : '';
        
      case 'telegram':
        // Extract from https://t.me/username or t.me/username
        const telegramMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([^\/\?]+)/);
        return telegramMatch ? telegramMatch[1] : '';
        
      case 'whatsapp':
        // Extract phone number from whatsapp links
        const whatsappMatch = cleanUrl.match(/whatsapp\.com\/send\?phone=([0-9]+)/);
        return whatsappMatch ? whatsappMatch[1] : '';
        
      case 'snapchat':
        // Extract from https://snapchat.com/add/username or snapchat.com/add/username
        const snapchatMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([^\/\?]+)/);
        return snapchatMatch ? snapchatMatch[1] : '';
        
      case 'reddit':
        // Extract from https://reddit.com/u/username or reddit.com/u/username
        const redditMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?reddit\.com\/u\/([^\/\?]+)/);
        return redditMatch ? redditMatch[1] : '';
        
      case 'behance':
        // Extract from https://behance.net/username or behance.net/username
        const behanceMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?behance\.net\/([^\/\?]+)/);
        return behanceMatch ? behanceMatch[1] : '';
        
      case 'dribbble':
        // Extract from https://dribbble.com/username or dribbble.com/username
        const dribbbleMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?dribbble\.com\/([^\/\?]+)/);
        return dribbbleMatch ? dribbbleMatch[1] : '';
        
      case 'pinterest':
        // Extract from https://pinterest.com/username or pinterest.com/username
        const pinterestMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([^\/\?]+)/);
        return pinterestMatch ? pinterestMatch[1] : '';
        
      case 'medium':
        // Extract from https://medium.com/@username or medium.com/@username
        const mediumMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?medium\.com\/@([^\/\?]+)/);
        return mediumMatch ? mediumMatch[1] : '';
        
      case 'dev':
        // Extract from https://dev.to/username or dev.to/username
        const devMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?dev\.to\/([^\/\?]+)/);
        return devMatch ? devMatch[1] : '';
        
      case 'stackoverflow':
        // Extract from https://stackoverflow.com/users/userid/username or stackoverflow.com/users/userid/username
        const stackoverflowMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?stackoverflow\.com\/users\/[^\/]+\/([^\/\?]+)/);
        return stackoverflowMatch ? stackoverflowMatch[1] : '';
        
      case 'website':
        // For websites, extract domain name or use a default
        try {
          const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
          return urlObj.hostname.replace('www.', '');
        } catch {
          return '';
        }
        
      default:
        return '';
    }
  } catch (error) {
    console.error('Error extracting username:', error);
    return '';
  }
};

/**
 * Auto-populate username field when URL changes
 */
export const handleUrlChange = (url, platform, setValue) => {
  const username = extractUsernameFromUrl(url, platform);
  if (username) {
    setValue(`socialLinks.${platform}.username`, username);
  }
};

/**
 * Get platform-specific URL patterns for validation
 */
export const getUrlPatterns = (platform) => {
  switch (platform) {
    case 'github':
      return {
        pattern: /^(https?:\/\/)?(www\.)?github\.com\/[^\/\s]+$/,
        placeholder: 'https://github.com/username'
      };
    case 'linkedin':
      return {
        pattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[^\/\s]+$/,
        placeholder: 'https://linkedin.com/in/username'
      };
    case 'x':
      return {
        pattern: /^(https?:\/\/)?(www\.)?x\.com\/[^\/\s]+$/,
        placeholder: 'https://x.com/username'
      };
    case 'instagram':
      return {
        pattern: /^(https?:\/\/)?(www\.)?instagram\.com\/[^\/\s]+$/,
        placeholder: 'https://instagram.com/username'
      };
    case 'facebook':
      return {
        pattern: /^(https?:\/\/)?(www\.)?facebook\.com\/[^\/\s]+$/,
        placeholder: 'https://facebook.com/username'
      };
    case 'youtube':
      return {
        pattern: /^(https?:\/\/)?(www\.)?youtube\.com\/@?[^\/\s]+$/,
        placeholder: 'https://youtube.com/@username'
      };
    case 'tiktok':
      return {
        pattern: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[^\/\s]+$/,
        placeholder: 'https://tiktok.com/@username'
      };
    case 'discord':
      return {
        pattern: /^(https?:\/\/)?(www\.)?discord\.gg\/[^\/\s]+$/,
        placeholder: 'https://discord.gg/invite'
      };
    case 'telegram':
      return {
        pattern: /^(https?:\/\/)?(www\.)?t\.me\/[^\/\s]+$/,
        placeholder: 'https://t.me/username'
      };
    case 'whatsapp':
      return {
        pattern: /^(https?:\/\/)?wa\.me\/[0-9]+$/,
        placeholder: 'https://wa.me/1234567890'
      };
    case 'snapchat':
      return {
        pattern: /^(https?:\/\/)?(www\.)?snapchat\.com\/add\/[^\/\s]+$/,
        placeholder: 'https://snapchat.com/add/username'
      };
    case 'reddit':
      return {
        pattern: /^(https?:\/\/)?(www\.)?reddit\.com\/u\/[^\/\s]+$/,
        placeholder: 'https://reddit.com/u/username'
      };
    case 'behance':
      return {
        pattern: /^(https?:\/\/)?(www\.)?behance\.net\/[^\/\s]+$/,
        placeholder: 'https://behance.net/username'
      };
    case 'dribbble':
      return {
        pattern: /^(https?:\/\/)?(www\.)?dribbble\.com\/[^\/\s]+$/,
        placeholder: 'https://dribbble.com/username'
      };
    case 'pinterest':
      return {
        pattern: /^(https?:\/\/)?(www\.)?pinterest\.com\/[^\/\s]+$/,
        placeholder: 'https://pinterest.com/username'
      };
    case 'medium':
      return {
        pattern: /^(https?:\/\/)?(www\.)?medium\.com\/@[^\/\s]+$/,
        placeholder: 'https://medium.com/@username'
      };
    case 'dev':
      return {
        pattern: /^(https?:\/\/)?(www\.)?dev\.to\/[^\/\s]+$/,
        placeholder: 'https://dev.to/username'
      };
    case 'stackoverflow':
      return {
        pattern: /^(https?:\/\/)?(www\.)?stackoverflow\.com\/users\/[^\/\s]+$/,
        placeholder: 'https://stackoverflow.com/users/userid/username'
      };
    case 'website':
      return {
        pattern: /^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
        placeholder: 'https://yourwebsite.com'
      };
    default:
      return {
        pattern: /^https?:\/\/.+/,
        placeholder: 'https://example.com'
      };
  }
};
