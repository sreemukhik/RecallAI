import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Search, Trash2, Eye, Calendar, Tag, Loader2 } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface Memory {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  chunks: number;
}

export const MemoryListPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    filterMemories();
  }, [searchQuery, memories]);

  const fetchMemories = async () => {
    try {
      const data = await fetchAPI('/ingest/');

      const mappedMemories: Memory[] = data.map((doc: any) => ({
        id: doc.id.toString(),
        userId: 'current',
        title: doc.title,
        content: doc.content || "No content preview available",
        tags: [],
        createdAt: doc.created_at,
        chunks: 1
      }));

      setMemories(mappedMemories);
      setFilteredMemories(mappedMemories);
    } catch (error) {
      console.error('Error fetching memories:', error);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const filterMemories = () => {
    if (!searchQuery.trim()) {
      setFilteredMemories(memories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = memories.filter(memory =>
      memory.title.toLowerCase().includes(query) ||
      memory.content.toLowerCase().includes(query) ||
      memory.tags.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredMemories(filtered);
  };

  const handleDelete = async () => {
    if (!memoryToDelete) return;

    setDeleting(true);
    setError('');

    try {
      await fetchAPI(`/ingest/${memoryToDelete.id}`, {
        method: 'DELETE'
      });

      // Remove from state
      setMemories(memories.filter(m => m.id !== memoryToDelete.id));
      setMemoryToDelete(null);

      // Close view dialog if it's the deleted memory
      if (selectedMemory?.id === memoryToDelete.id) {
        setSelectedMemory(null);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      setError('Failed to delete memory');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Ensure date is treated as UTC if no timezone is specified
    const dateStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Memories</h1>
          <p className="text-muted-foreground">
            Manage and view all your stored memories
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {filteredMemories.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <div className="rounded-full bg-muted p-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No memories found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "No memories match your search query"
              : "Start by analyzing some content to build your memory bank"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => (
            <Card key={memory.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">
                    {memory.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setMemoryToDelete(memory)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(memory.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {memory.content}
                </p>
                {memory.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {memory.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                    {memory.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{memory.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedMemory(memory)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Memory Dialog */}
      <AlertDialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedMemory?.title}</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {selectedMemory && formatDate(selectedMemory.createdAt)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="prose dark:prose-invert">
              <p className="whitespace-pre-wrap">{selectedMemory?.content}</p>
            </div>
            {selectedMemory?.tags && selectedMemory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMemory.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memoryToDelete} onOpenChange={() => setMemoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
