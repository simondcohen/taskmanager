/**
 * Fetches metadata for a YouTube video URL
 * Tries YouTube oEmbed API first, falls back to noembed.com, then fallback to default thumbnail
 */
export async function fetchYoutubeMeta(url: string): Promise<{title: string; thumbnailUrl: string}> {
  if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Try YouTube oEmbed API first
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        thumbnailUrl: data.thumbnail_url
      };
    }
    
    // If YouTube oEmbed fails, try noembed.com
    const noembedResponse = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    
    if (noembedResponse.ok) {
      const noembedData = await noembedResponse.json();
      return {
        title: noembedData.title,
        thumbnailUrl: noembedData.thumbnail_url
      };
    }
    
    // If both APIs fail, extract video ID and use default thumbnail
    let videoId;
    try {
      if (url.includes('youtu.be')) {
        // Handle youtu.be format
        videoId = url.split('/').pop();
      } else {
        // Handle youtube.com format
        videoId = new URL(url).searchParams.get('v');
      }
      
      if (!videoId) {
        throw new Error('Could not extract video ID');
      }
      
      return {
        title: `YouTube Video (${videoId})`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    } catch (idError) {
      throw new Error('Invalid YouTube URL format');
    }
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    throw new Error('Failed to fetch video metadata');
  }
} 