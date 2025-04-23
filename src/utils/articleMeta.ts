interface ArticleMetadata {
  title: string;
  siteName: string;
  description?: string;
  imageUrl?: string;
}

function extractTitleFromUrl(url: string): string {
  const clean = url.replace(/https?:\/\//, '')
  const parts = clean.split(/[\/?#]/).filter(Boolean)
  return parts.pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || clean
}

function extractSiteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Unknown Source'
  }
}

export async function fetchArticleMeta (url: string): Promise<ArticleMetadata> {
  const target = url.startsWith('http') ? url : `https://${url}`
  let siteName = extractSiteName(target); // Extract site name early for potential fallback

  try {
    const res = await fetch(`https://jsonlink.io/api/extract?url=${encodeURIComponent(target)}`)
    if (!res.ok) throw new Error('jsonlink.io request failed')
    const data = await res.json() as any

    const rawTitle = (data.title ?? '').trim();
    siteName = (data.source ?? '').trim() || siteName; // Update siteName if API provides one
    const description = (data.description ?? '').trim() || undefined;
    const imageUrl = Array.isArray(data.images) && data.images.length ? data.images[0] : undefined;

    let finalTitle = '';
    const isRawTitleNumeric = /^[0-9]{3,}$/.test(rawTitle);
    const looksLikeHostname = (title: string) => title.toLowerCase() === siteName.toLowerCase() || title.toLowerCase() === new URL(target).hostname.replace(/^www\./, '').toLowerCase();

    if (rawTitle && !isRawTitleNumeric && !looksLikeHostname(rawTitle)) {
      finalTitle = rawTitle; // Use fetched title if valid, not numeric, and not just the hostname
    } else {
      // Fetched title is invalid or missing. Try extracting from URL.
      const extractedTitle = extractTitleFromUrl(target);
      const isExtractedTitleNumeric = /^[0-9]{3,}$/.test(extractedTitle);
      
      if (extractedTitle && !isExtractedTitleNumeric && !looksLikeHostname(extractedTitle)) {
        finalTitle = extractedTitle; // Use extracted title if valid, non-numeric, and not the hostname
      } else {
        // Both titles are problematic. Use placeholder.
        finalTitle = 'Untitled Article'; 
      }
    }

    return {
      title: finalTitle,
      siteName: siteName,
      description: description,
      imageUrl: imageUrl
    };

  } catch (err) {
    console.error('Metadata fetch error', err)
    // Fallback logic if the API call itself fails
    let title = extractTitleFromUrl(target);
    const isExtractedTitleNumeric = /^[0-9]{3,}$/.test(title);
    const looksLikeHostnameFallback = (t: string) => t.toLowerCase() === siteName.toLowerCase() || t.toLowerCase() === new URL(target).hostname.replace(/^www\./, '').toLowerCase();

    if (!title || isExtractedTitleNumeric || looksLikeHostnameFallback(title)) { // Check numeric/hostname/empty title in fallback
       title = 'Untitled Article';
    }
    return {
      title: title,
      siteName: siteName // Use the siteName extracted earlier
    };
  }
} 