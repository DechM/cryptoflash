"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import TokenIcon from "@/components/icons/TokenIcon";
import { formatUSD, formatPercent, formatCompactUSD } from "@/lib/format";
import { ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  updatedAt?: number;
};

export default function TickerCard({
  symbol,
  name,
  price,
  change24h,
  volume24h,
  updatedAt,
}: Props) {
  const isPositive = change24h > 0;
  const displayName = (symbol || "").toUpperCase();

  return (
    <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TokenIcon symbol={symbol} size={18} className="text-muted-foreground" />
          <span className="uppercase">{displayName}</span>
          <span className="text-sm font-normal text-muted-foreground truncate">
            {name}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold">{formatUSD(price)}</div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            {formatPercent(change24h)}
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Vol 24h: {formatCompactUSD(volume24h)}
        </div>

        {updatedAt && (
          <div className="text-xs text-muted-foreground">
            Updated · {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
