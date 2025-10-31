'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';

type Props = {
  data: number[];
  isPositive: boolean;
  coinId: string;
  width?: number;
  height?: number;
};

export function LiveSparklineChart({ 
  data: initialData, 
  isPositive: initialIsPositive, 
  coinId,
  width = 96, 
  height = 40 
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataPoints, setDataPoints] = useState<number[]>(initialData);
  const { price, hasWebSocket } = useLiveCryptoPrice({ 
    coinId,
    fallbackPrice: initialData.length > 0 ? initialData[initialData.length - 1] : undefined,
  });

  // Update dataPoints when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      setDataPoints(initialData);
    }
  }, [initialData]);

  // Update data points with live price
  useEffect(() => {
    if (hasWebSocket && price > 0) {
      setDataPoints((prev) => {
        if (prev.length === 0) return initialData;
        
        const lastPrice = prev[prev.length - 1];
        
        // If price changed significantly (0.1% or more), update the last point
        if (Math.abs(price - lastPrice) / lastPrice > 0.001) {
          const newDataPoints = [...prev];
          // Update the last point with live price for smooth animation
          newDataPoints[newDataPoints.length - 1] = price;
          return newDataPoints;
        }
        
        return prev;
      });
    }
  }, [price, hasWebSocket, initialData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataPoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate dimensions
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min and max values
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1; // Avoid division by zero

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Determine if positive based on first vs last
    const isPositive = dataPoints[dataPoints.length - 1] >= dataPoints[0];

    // Draw line
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    dataPoints.forEach((value, index) => {
      const x = padding + (index / (dataPoints.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height);
    gradient.addColorStop(0, isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)');
    gradient.addColorStop(1, isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = gradient;
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fill();
  }, [dataPoints, width, height]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

