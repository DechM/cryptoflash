'use client';

import { useEffect, useRef } from 'react';

type Props = {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
};

export function SparklineChart({ data, isPositive, width = 96, height = 40 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

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
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw line
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
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
  }, [data, isPositive, width, height]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

