import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAPI } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Check, X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

interface IngestionPageProps {
  onNavigate: (page: string) => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onNavigate }) => {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedMemory, setUploadedMemory] = useState<any>(null);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!content.trim()) {
        throw new Error('Please enter some content');
      }

      const data = await fetchAPI('/ingest/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() ? title.trim() : (content.trim().slice(0, 50) + (content.trim().length > 50 ? "..." : "")),
          content: content.trim(),
          tags // Backend might not support tags yet, but let's send them
        })
      });

      // Response check is handled inside fetchAPI, if it returns it's successful
      // But fetchAPI returns response.json(), so 'data' is the JSON body.


      setUploadedMemory(data);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setTitle('');
        setContent('');
        setTags([]);
        setUploadedMemory(null);
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Error creating memory:', err);
      let errorMessage = 'Failed to create memory';
      if (typeof err === 'string') errorMessage = err;
      else if (err instanceof Error) errorMessage = err.message;
      else if (err && typeof err === 'object') errorMessage = err.detail || err.message || 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Add Memory</h1>
        <p className="text-muted-foreground">
          Upload notes, conversations, logs, or any text you want to remember
        </p>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong className="text-foreground">Your data is private and only visible to you.</strong>
          {' '}All memories are encrypted and stored securely.
        </AlertDescription>
      </Alert>

      {/* Success Message */}
      {success && uploadedMemory && (
        <Alert className="border-green-500/20 bg-green-500/5">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Memory uploaded successfully!</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Details</CardTitle>
          <CardDescription>
            Add a title and content. Tags help organize your memories for easier retrieval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Team meeting notes, Personal journal entry..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                If left blank, a title will be generated from your content
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter your notes, conversation logs, thoughts, or any text you want to remember..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={12}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {content.length} characters • ~{Math.ceil(content.length / 500)} chunks
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="e.g., work, meeting, personal..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={loading || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Examples: work, personal, meeting, research, project-name
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !content.trim()} className="flex-1">
                {loading ? 'Uploading...' : 'Upload Memory'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">How Memory Storage Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Chunking:</strong> Your content is automatically divided into smaller chunks (~500 characters each) for optimal retrieval.
          </p>
          <p>
            <strong className="text-foreground">Embedding:</strong> Each chunk is converted into a vector embedding (a mathematical representation) that allows semantic search.
          </p>
          <p>
            <strong className="text-foreground">Privacy:</strong> Your raw text and embeddings are stored encrypted and are never used to train AI models or shared with third parties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
