'use client';

import { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NewsItem } from '@/components/news/NewsItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NewsList() {
  const { data: news, error } = useSWR<Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    summary?: string;
  }>>('/api/news', fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: true,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'coindesk' | 'theblock'>('all');

  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (activeTab === 'all') return news;
    return news.filter((item) => item.source.toLowerCase() === activeTab);
  }, [news, activeTab]);

  if (error) {
    return (
      <Alert variant="default">
        <AlertDescription>News temporarily unavailable. Retrying...</AlertDescription>
      </Alert>
    );
  }

  if (!news || news.length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>News temporarily unavailable.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="coindesk">CoinDesk</TabsTrigger>
        <TabsTrigger value="theblock">The Block</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-4">
        <div className="space-y-4">
          {filteredNews.map((item) => (
            <NewsItem
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              source={item.source}
              publishedAt={item.publishedAt}
              summary={item.summary}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
