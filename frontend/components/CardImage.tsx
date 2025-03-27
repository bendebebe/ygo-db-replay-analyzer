"use client"

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { YgoCardInfo } from "@/lib/graphql/types/cards"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface CardImageProps {
  serialNumber: string;
  name: string;
  imageUrl: string;
  className?: string;
  count?: number;
  cardInfo?: YgoCardInfo;
}

export function CardImage({ serialNumber, name, imageUrl, className, count }: CardImageProps) {
  const [error, setError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (!imageUrl || error) {
    return (
      <div 
        className={cn(
          "w-full aspect-[59/86] bg-white/5 flex items-center justify-center text-center p-1 text-xs text-white/60",
          className
        )}
      >
        {name || `Card ${serialNumber}`}
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isInBounds = 
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    
    setIsHovered(isInBounds);
  };

  return (
    <HoverCard open={isHovered}>
      <HoverCardTrigger asChild>
        <div 
          ref={containerRef}
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
        >
          <div className="w-full aspect-[59/86] rounded-lg overflow-hidden relative">
            <Image
              src={imageUrl}
              alt={name || `Card ${serialNumber}`}
              fill
              sizes="(max-width: 768px) 25vw, (max-width: 1024px) 16.67vw, 12.5vw"
              className={cn("object-contain", className)}
              onError={() => setError(true)}
            />
          </div>
          {count && (
            <span className="absolute top-0.5 right-0.5 bg-black/50 rounded px-1 text-white text-xs">
              {count}x
            </span>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[300px] p-0 bg-black/90 border-white/20" 
        side="right"
        align="start"
        sideOffset={8}
        style={{ zIndex: isHovered ? 50 : 0 }}
      >
        <div className="aspect-[59/86] relative w-full">
          <Image
            src={imageUrl}
            alt={name || `Card ${serialNumber}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 