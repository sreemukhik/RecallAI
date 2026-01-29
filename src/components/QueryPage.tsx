import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Send, ChevronDown, ChevronUp, Database, Shield, Loader2 } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface Source {
  memoryId: string;
  title: string;
  snippet: string;
  tags: string[];
  createdAt: string;
}

interface QueryResult {
  id: string;
  query: string;
  answer: string;
  sources: Source[];
  sourcesCount: number;
  timestamp: string;
}

export const QueryPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [results]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setError('');
    setLoading(true);

    const currentQuery = query.trim();
    setQuery('');

    try {
      // Switched to local backend via fetchAPI
      const data = await fetchAPI('/query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery })
      });

      // Backend now returns AugmentedQueryResponse: { answer: string, sources: SearchResult[] }

      const sources: Source[] = (data.sources || []).map((item: any) => ({
        memoryId: item.document_id.toString(),
        title: item.metadata.title || `Memory #${item.document_id}`,
        snippet: item.content_snippet,
        tags: [], // Tags available in metadata? item.metadata.tags? For now empty
        createdAt: new Date().toISOString() // Metadata might have created_at if we included it
      }));

      const newResult: QueryResult = {
        id: crypto.randomUUID(),
        query: currentQuery,
        answer: data.answer || "No answer generated.",
        sources: sources,
        sourcesCount: sources.length,
        timestamp: new Date().toISOString()
      };

      setResults([...results, newResult]);

    } catch (err: any) {
      setError(err.message || 'Failed to process query');
      console.error('Error processing query:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Query Your Memory</h1>
        <p className="text-muted-foreground">
          Ask questions in natural language and get answers from your stored memories
        </p>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-primary/20 bg-primary/5 mb-6">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription>
          All queries are processed securely. Your memories remain private and are never shared.
        </AlertDescription>
      </Alert>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-6">
        {results.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">How to Query Your Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Natural Language:</strong> Ask questions as you would to a person. For example:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>"What did I discuss in last week's team meeting?"</li>
                  <li>"Show me my notes about the new product launch"</li>
                  <li>"What are my personal goals from my journal?"</li>
                </ul>
              </div>
              <div>
                <strong className="text-foreground">Source Traceability:</strong> Every answer includes references to the specific memories it's based on, so you can verify the information.
              </div>
              <div>
                <strong className="text-foreground">Semantic Search:</strong> The system understands meaning, not just keywords. It finds relevant information even if you use different words.
              </div>
            </CardContent>
          </Card>
        )}

        {results.map((result) => (
          <div key={result.id} className="space-y-4">
            {/* User Query */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                <p className="text-sm">{result.query}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex justify-start">
              <Card className="max-w-[85%] bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm leading-relaxed">{result.answer}</p>

                  {/* Sources Indicator */}
                  {result.sourcesCount > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Based on <strong className="text-foreground">{result.sourcesCount}</strong> stored {result.sourcesCount === 1 ? 'memory' : 'memories'}
                      </span>
                    </div>
                  )}

                  {/* Expandable Sources */}
                  {result.sources.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <span className="text-xs">View source snippets</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        {result.sources.map((source, idx) => (
                          <Card key={source.memoryId} className="bg-background">
                            <CardContent className="pt-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm">{source.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Source {idx + 1}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground italic">
                                "{source.snippet}"
                              </p>
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex flex-wrap gap-1">
                                  {source.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(source.createdAt)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <Card className="max-w-[85%] bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Searching your memories...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Query Input */}
      <Card className="sticky bottom-0">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask a question about your memories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Tip: Be specific with your questions for better results. Include context like dates, topics, or tags.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
