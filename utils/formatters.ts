
/**
 * Formats an ISO date string or timestamp to a human-readable format.
 * @param dateStr ISO date string or timestamp
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (dateStr?: string | number | null, options: Intl.DateTimeFormatOptions = {}) => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options
    }).format(date);
  } catch (e) {
    return 'N/A';
  }
};

/**
 * Formats a relative time (e.g., "2 hours ago").
 * @param dateStr ISO date string or timestamp
 * @returns Relative time string
 */
export const formatRelativeTime = (dateStr?: string | number | null) => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateStr);
  } catch (e) {
    return 'N/A';
  }
};
