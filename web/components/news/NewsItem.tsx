'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/format';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type NewsItemProps = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
};

export function NewsItem({ title, url, source, publishedAt, summary }: NewsItemProps) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <article className="border rounded-lg p-4 space-y-3 hover:bg-muted/10 transition-colors">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium flex-1">
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
            >
              {title}
            </Link>
          </h3>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
            aria-label={`Open article from ${source}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {source}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(publishedAt)}</span>
        </div>
      </div>

      {summary && (
        <div className="space-y-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm flex items-center gap-1"
            aria-expanded={showSummary}
            aria-label={showSummary ? 'Hide summary' : 'Show summary'}
          >
            {showSummary ? (
              <>
                <ChevronUp className="h-4 w-4" /> Hide summary
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> Show summary
              </>
            )}
          </button>
          {showSummary && (
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          )}
        </div>
      )}
    </article>
  );
}
