import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CallWithContext, TranscriptBlock } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';
import { supabase } from '../lib/supabase';
import { Search, Lock } from 'lucide-react';
import { highlightCriticalKeywords } from '../lib/utils';

interface LiveTranscriptProps {
  call: CallWithContext;
}

export default function LiveTranscript({ call }: LiveTranscriptProps) {
  const [transcripts, setTranscripts] = useState<TranscriptBlock[]>(call.transcripts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollLocked, setScrollLocked] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTranscripts(call.transcripts || []);
  }, [call.transcripts]);

  useEffect(() => {
    const subscription = supabase
      .channel(`transcript-${call.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcript_blocks',
          filter: `call_id=eq.${call.id}`,
        },
        (payload) => {
          setTranscripts((prev) => [...prev, payload.new as TranscriptBlock]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [call.id]);

  useEffect(() => {
    if (scrollLocked && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcripts, scrollLocked]);

  const filteredTranscripts = useMemo(() => {
    if (!searchQuery) return transcripts;

    return transcripts.filter((block) =>
      block.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transcripts, searchQuery]);

  const speakerColors = {
    caller: 'text-green-700 font-semibold',
    ai: 'text-blue-700 font-semibold',
    responder: 'text-purple-700 font-semibold',
  };

  const speakerBgColors = {
    caller: 'bg-green-50 border-l-4 border-l-green-500',
    ai: 'bg-blue-50 border-l-4 border-l-blue-500',
    responder: 'bg-purple-50 border-l-4 border-l-purple-500',
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle level="h3">Live Transcript</CardTitle>
        <div className="flex items-center gap-2 mt-3">
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
          <Button
            variant={scrollLocked ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setScrollLocked(!scrollLocked)}
            title={scrollLocked ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <Lock size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-2 pr-4"
          onScroll={(e) => {
            if (scrollLocked) {
              const element = e.currentTarget;
              const isAtBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight < 50;
              setScrollLocked(isAtBottom);
            }
          }}
        >
          {filteredTranscripts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>
                {searchQuery ? 'No matching transcript lines' : 'Waiting for transcript...'}
              </p>
            </div>
          ) : (
            filteredTranscripts.map((block) => (
              <div
                key={block.id}
                className={`p-3 rounded-lg transition-colors ${speakerBgColors[block.speaker]}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={speakerColors[block.speaker]}>
                    {block.speaker.charAt(0).toUpperCase() + block.speaker.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(block.timestamp_iso).toLocaleTimeString()}
                  </span>
                </div>

                <p
                  className="text-sm text-gray-900 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightCriticalKeywords(block.text) }}
                />

                {block.tags && block.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {block.tags.map((tag) => (
                      <Badge key={tag} variant="warning" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {filteredTranscripts.length} of {transcripts.length} lines
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
