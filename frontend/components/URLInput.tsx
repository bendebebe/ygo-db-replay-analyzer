"use client"

import React, { useState, KeyboardEvent } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { PlusCircle, Copy, Trash2, FileText } from 'lucide-react'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

interface URLInputProps {
  onUrlsChangeAction: (urls: string[]) => void
  initialUrls?: string[]
}

export function URLInput({ onUrlsChangeAction, initialUrls = [] }: URLInputProps): React.ReactElement {
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [currentUrl, setCurrentUrl] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Updated regex to match full ID pattern and capture both parts
  const DB_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?duelingbook\.com\/replay\?id=(\d+-\d+)/g
  
  // Helper to convert full URL to simplified version
  const simplifyUrl = (url: string): string => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?duelingbook\.com\/replay\?id=(\d+)-(\d+)/)
    if (!match) return url
    // Keep only the replay ID part
    return `https://www.duelingbook.com/replay?id=${match[2]}`
  }

  const validateUrl = (url: string): boolean => {
    DB_URL_REGEX.lastIndex = 0
    return DB_URL_REGEX.test(url)
  }

  // Effect to handle initialUrls changes
  React.useEffect(() => {
    if (initialUrls.length > 0) {
      // Filter and validate any initialUrls
      const validUrls = initialUrls.filter(url => validateUrl(url))
                                  .map(url => simplifyUrl(url))
      
      setUrls(validUrls)
      onUrlsChangeAction(validUrls)
    }
  }, [initialUrls]) // eslint-disable-line react-hooks/exhaustive-deps

  const addUrl = () => {
    if (currentUrl && !urls.includes(currentUrl)) {
      if (validateUrl(currentUrl)) {
        const simplifiedUrl = simplifyUrl(currentUrl)
        const newUrls = [...urls, simplifiedUrl]
        setUrls(newUrls)
        onUrlsChangeAction(newUrls)
        setCurrentUrl('')
      } else {
        console.error('Invalid URL format. Expected: duelingbook.com/replay?id=<player_id>-<replay_id>')
      }
    }
  }

  const removeUrl = (indexToRemove: number) => {
    const newUrls = urls.filter((_, index) => index !== indexToRemove)
    setUrls(newUrls)
    onUrlsChangeAction(newUrls)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addUrl()
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const processBulkText = () => {
    if (!bulkText.trim()) {
      setIsDialogOpen(false)
      return
    }

    DB_URL_REGEX.lastIndex = 0
    
    // Extract and simplify all valid URLs from the text
    const matches = Array.from(bulkText.matchAll(DB_URL_REGEX))
    const extractedUrls = matches.map(match => simplifyUrl(match[0]))
    
    // Filter out duplicates and already added URLs
    const newUniqueUrls = extractedUrls.filter(url => !urls.includes(url))
    
    if (newUniqueUrls.length > 0) {
      const updatedUrls = [...urls, ...newUniqueUrls]
      setUrls(updatedUrls)
      onUrlsChangeAction(updatedUrls)
    }
    
    setBulkText('')
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter duelingbook.com/replay?id=<player_id>-<replay_id> URL"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-black/40 text-white border-white/20 placeholder:text-white/40"
        />
        <Button
          onClick={addUrl}
          className="bg-white/10 hover:bg-white/20 border border-white/20"
          title="Add URL"
        >
          <PlusCircle className="h-5 w-5" />
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-white/10 hover:bg-white/20 border border-white/20"
              title="Paste multiple URLs"
            >
              <FileText className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Paste Multiple URLs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste text containing duelingbook.com/replay?id=<player_id>-<replay_id> URLs"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="min-h-[200px] bg-black/40 text-white border-white/20 placeholder:text-white/40"
              />
              <Button 
                onClick={processBulkText}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20"
              >
                Extract URLs
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {urls.length > 0 && (
        <div className="mt-2 space-y-2">
          {urls.map((url, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between gap-2 p-2 rounded bg-white/10 border border-white/10"
            >
              <span className="text-sm text-white truncate">{url}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(url)}
                  className="hover:bg-white/20 text-white/80 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(index)}
                  className="hover:bg-white/20 text-white/80 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 