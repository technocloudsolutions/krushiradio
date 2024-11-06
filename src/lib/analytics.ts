interface AnalyticsData {
  downloads: { [key: string]: number };
  plays: { [key: string]: number };
  lastUpdated: string;
}

export const updateAnalytics = (type: 'download' | 'play', programId: number) => {
  try {
    // Get existing analytics data
    const storedData = localStorage.getItem('programAnalytics');
    const analytics: AnalyticsData = storedData ? JSON.parse(storedData) : {
      downloads: {},
      plays: {},
      lastUpdated: new Date().toISOString()
    };

    // Update the count
    if (type === 'download') {
      analytics.downloads[programId] = (analytics.downloads[programId] || 0) + 1;
    } else {
      analytics.plays[programId] = (analytics.plays[programId] || 0) + 1;
    }

    analytics.lastUpdated = new Date().toISOString();

    // Save updated analytics
    localStorage.setItem('programAnalytics', JSON.stringify(analytics));
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
};

export const getAnalytics = (): AnalyticsData => {
  try {
    const storedData = localStorage.getItem('programAnalytics');
    return storedData ? JSON.parse(storedData) : {
      downloads: {},
      plays: {},
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      downloads: {},
      plays: {},
      lastUpdated: new Date().toISOString()
    };
  }
}; 