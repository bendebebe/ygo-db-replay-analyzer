"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronRight, ExternalLink, BookOpen, ChevronLeft, InfoIcon } from "lucide-react"
import Link from "next/link"

interface RpsData {
  playerId: string;
  choice: string;
  won: boolean;
}

interface ReplayPlayer {
  id: string;
  dbName: string;
  rpsData: RpsData[] | null;
}

interface ReplayAnalysis {
  id: string;
  replayUrl: string;
  createdAt: string;
  dbCreatedAt: string;
  player1: ReplayPlayer;
  player2: ReplayPlayer;
}

interface ReplayOverviewTableProps {
  replays: ReplayAnalysis[];
}

const REPLAYS_PER_PAGE = 5;

export function ReplayOverviewTable({ replays }: ReplayOverviewTableProps) {
  const [hoveredReplayId, setHoveredReplayId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>("Component mounted");
  const [currentPage, setCurrentPage] = useState(1);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Debug log on component mount and prop changes
  useEffect(() => {
    setDebugMessage(`Received ${replays?.length || 0} replays`);
  }, [replays]);

  const handleMouseEnter = (id: string, event: React.MouseEvent) => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    
    // Get position for the tooltip
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Calculate position based on screen size
    const tooltipWidth = 300;
    const leftPosition = isMobile ? 
      Math.max(10, (window.innerWidth - tooltipWidth) / 2) : // Center on mobile 
      Math.max(10, rect.left - tooltipWidth); // Left of icon on desktop
    
    setTooltipPosition({
      x: leftPosition,
      y: rect.top
    });
    
    setHoveredReplayId(id);
  };

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle tooltip on click (for touch devices)
    if (hoveredReplayId === id) {
      setHoveredReplayId(null);
    } else {
      handleMouseEnter(id, event);
    }
  };

  const handleMouseLeave = () => {
    tooltipTimeout.current = setTimeout(() => {
      setHoveredReplayId(null);
    }, 300); // Small delay to allow moving to the tooltip
  };

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    tooltipTimeout.current = setTimeout(() => {
      setHoveredReplayId(null);
    }, 300);
  };

  const getWinner = (replay: ReplayAnalysis) => {
    // Get the last (deciding) RPS play for each player
    const player1LastRps = replay.player1.rpsData && replay.player1.rpsData.length > 0 
      ? replay.player1.rpsData[replay.player1.rpsData.length - 1] 
      : null;
      
    const player2LastRps = replay.player2.rpsData && replay.player2.rpsData.length > 0 
      ? replay.player2.rpsData[replay.player2.rpsData.length - 1] 
      : null;
      
    // Check which player won the last round
    if (player1LastRps?.won) return replay.player1;
    if (player2LastRps?.won) return replay.player2;
    return null; // No winner determined
  };

  // Format date from string to readable format
  const formatDate = (dateString: string) => {
    try {
      // Handle both timestamp numbers and date strings
      const timestamp = Number(dateString);
      const date = !isNaN(timestamp) 
        ? new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp) 
        : new Date(dateString);
        
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      return "Invalid date";
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Invalid date";
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil((replays?.length || 0) / REPLAYS_PER_PAGE);
  const paginatedReplays = replays?.slice(
    (currentPage - 1) * REPLAYS_PER_PAGE,
    currentPage * REPLAYS_PER_PAGE
  ) || [];

  // Safely handle replay data that might be missing properties
  const safeRenderTable = () => {
    try {
      if (!replays || !Array.isArray(replays) || replays.length === 0) {
        return (
          <div className="text-center py-8 text-gray-400">
            No replays found or invalid data structure
          </div>
        );
      }

      return (
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-white/5">
                <TableHead className="w-[40px] text-center">Replay</TableHead>
                <TableHead className="w-[40px] text-center">Analysis</TableHead>
                <TableHead className="w-[180px] pl-4 text-left">Date</TableHead>
                <TableHead className="w-[40px] text-center">RPS</TableHead>
                <TableHead className="w-[150px]">Player 1</TableHead>
                <TableHead className="w-[150px]">Player 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReplays.map((replay, index) => {
                if (!replay || !replay.id || !replay.player1 || !replay.player2) {
                  return (
                    <TableRow key={`invalid-${index}`}>
                      <TableCell colSpan={6} className="text-red-400">
                        Invalid replay data at index {index}
                      </TableCell>
                    </TableRow>
                  );
                }
                
                return (
                  <TableRow key={replay.id} className="hover:bg-white/5">
                    <TableCell className="text-center p-2">
                      <a
                        href={replay.replayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10"
                        title="View Replay"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-400" />
                      </a>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Link
                        href={`/replay-analysis/${replay.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10"
                        title="Deck Analysis"
                      >
                        <BookOpen className="h-4 w-4 text-amber-400" />
                      </Link>
                    </TableCell>
                    <TableCell className="pl-4 text-left">
                      {formatDate(replay.dbCreatedAt)}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <div className="flex items-center justify-center">
                        <div 
                          className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(replay.id, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={(e) => handleClick(replay.id, e)}
                          title="RPS Details"
                        >
                          <InfoIcon className="h-4 w-4 text-purple-400" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <Link 
                        href={`/player/${replay.player1.id}`}
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          replay.player1.rpsData && replay.player1.rpsData.length > 0 && replay.player1.rpsData[replay.player1.rpsData.length - 1]?.won
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {replay.player1.dbName}
                      </Link>
                    </TableCell>
                    <TableCell className="p-2">
                      <Link 
                        href={`/player/${replay.player2.id}`}
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          replay.player2.rpsData && replay.player2.rpsData.length > 0 && replay.player2.rpsData[replay.player2.rpsData.length - 1]?.won 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {replay.player2.dbName}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* RPS Data Tooltip Popup - hover-triggered */}
          {hoveredReplayId && paginatedReplays.map(replay => {
            if (replay.id !== hoveredReplayId) return null;
            
            const hasRpsData = replay.player1.rpsData && replay.player2.rpsData && 
                             replay.player1.rpsData.length > 0 && replay.player2.rpsData.length > 0;
            
            if (!hasRpsData) return null;
            
            return (
              <div 
                key={`tooltip-${replay.id}`} 
                id="rps-tooltip"
                className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 w-[300px] max-w-[90vw]"
                style={{
                  top: `${tooltipPosition.y}px`,
                  left: `${tooltipPosition.x}px`,
                }}
                onMouseEnter={handleTooltipMouseEnter}
                onMouseLeave={handleTooltipMouseLeave}
              >
                <div className="space-y-3">
                  {/* RPS Match Table - Better format */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-400 font-medium text-xs">Round</th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs">{replay.player1.dbName}</th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs">{replay.player2.dbName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {replay.player1.rpsData?.map((rps, index) => {
                        const p1Choice = rps.choice;
                        const p2Choice = replay.player2.rpsData?.[index]?.choice || "Unknown";
                        const p1Won = rps.won;
                        const p2Won = replay.player2.rpsData?.[index]?.won || false;
                        const isFinalRound = index === replay.player1.rpsData!.length - 1 && replay.player1.rpsData!.length > 1;
                        
                        return (
                          <tr key={`rps-round-${index}`} className={`border-b border-gray-800 ${isFinalRound ? "bg-gray-800/30" : ""}`}>
                            <td className="py-1 text-xs">
                              {isFinalRound ? (
                                <span className="text-yellow-400">Final</span>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </td>
                            <td className={`py-1 text-xs ${p1Won ? "text-green-400" : "text-red-400"}`}>
                              {p1Choice}
                            </td>
                            <td className={`py-1 text-xs ${p2Won ? "text-green-400" : "text-red-400"}`}>
                              {p2Choice}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Match Result */}
                  <div className="p-2 bg-gray-800/50 rounded-md">
                    <p className="text-white text-xs font-medium">Match Winner: <span className="text-green-400">
                      {getWinner(replay)?.dbName || "Unknown"}
                    </span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      return (
        <div className="text-center py-8 text-red-400">
          Error rendering table: {error instanceof Error ? error.message : String(error)}
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      {/* Debug info section */}
      <div className="mb-4 p-2 bg-black/50 border border-gray-700 rounded text-xs text-gray-400">
        Debug: {debugMessage}
      </div>
      
      {safeRenderTable()}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
      
      {/* Show raw data structure for debugging */}
      <div className="mt-4 p-2 bg-black/50 border border-gray-700 rounded">
        <details>
          <summary className="text-xs text-gray-400 cursor-pointer">Debug: Replay Data Structure</summary>
          <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-400 overflow-auto max-h-40">
            {JSON.stringify(replays?.slice(0, 1) || [], null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
} 