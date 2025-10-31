export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
};

type RSSItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
};

type RSSFeed = {
  items: RSSItem[];
  title?: string;
  description?: string;
};

// Use r.jina.ai proxy for RSS feeds to avoid CORS
async function fetchRSSFeed(feedUrl: string): Promise<RSSFeed | null> {
  try {
    const proxyUrl = `https://r.jina.ai/${feedUrl}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as RSSFeed;
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
    return null;
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const feeds = [
      {
        url: 'https://www.coindesk.com/feed/',
        source: 'CoinDesk',
      },
      {
        url: 'https://www.theblock.co/rss.xml',
        source: 'The Block',
      },
    ];

    const allItems: NewsItem[] = [];
    const seenUrls = new Set<string>();

    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      feeds.map((feed) => fetchRSSFeed(feed.url))
    );

    for (let i = 0; i < feeds.length; i++) {
      const feedData = feedResults[i];
      const source = feeds[i].source;

      if (!feedData || !feedData.items) continue;

      for (const item of feedData.items) {
        if (!item.title || !item.link) continue;

        // Dedupe by URL
        const url = item.link;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString();

        // Generate ID from URL
        const id = Buffer.from(url).toString('base64').slice(0, 32);

        allItems.push({
          id,
          title: item.title,
          url,
          source,
          publishedAt,
          summary: item.description || item.contentSnippet || undefined,
        });
      }
    }

    // Sort by published date, most recent first
    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Return top ~30 items
    return allItems.slice(0, 30);
  } catch (error) {
    console.error('Failed to fetch news data:', error);
    return [];
  }
}

export async function summarizeNewsItems(items: NewsItem[]): Promise<NewsItem[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return items; // Skip summarization if no API key
  }

  try {
    // Batch items in groups of 5 to keep usage reasonable
    const batchSize = 5;
    const batches: NewsItem[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const summarized: NewsItem[] = [];

    for (const batch of batches) {
      try {
        const summaries = await Promise.all(
          batch.map(async (item) => {
            try {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content:
                        'You are a crypto news summarizer. Provide a concise 2-3 sentence summary of the article. Be neutral and factual. Do not hallucinate.',
                    },
                    {
                      role: 'user',
                      content: `Summarize this crypto news article: ${item.title}`,
                    },
                  ],
                  max_tokens: 150,
                  temperature: 0.3,
                }),
              });

              if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
              }

              const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
              const summary = data.choices[0]?.message?.content?.trim();

              return {
                ...item,
                summary: summary || item.summary,
              };
            } catch (error) {
              console.error(`Failed to summarize item ${item.id}:`, error);
              return item; // Return original item if summarization fails
            }
          })
        );

        summarized.push(...summaries);
      } catch (error) {
        console.error('Failed to process batch:', error);
        // Fallback: add items without summarization
        summarized.push(...batch);
      }
    }

    return summarized;
  } catch (error) {
    console.error('Failed to summarize news items:', error);
    return items; // Return original items if summarization fails
  }
}
