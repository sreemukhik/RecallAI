import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
import { Shield, Database, Lock, Eye, AlertTriangle, Trash2, Download } from 'lucide-react';
import { Separator } from './ui/separator';
import { fetchAPI } from '../utils/api';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, accessToken, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAllData = async () => {
    setDeleting(true);
    setError('');

    try {
      await fetchAPI('/ingest/', {
        method: 'DELETE'
      });

      setShowDeleteDialog(false);
      onNavigate('dashboard');
    } catch (error) {
      console.error('Error deleting all data:', error);
      setError('Failed to delete all data. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy & Settings</h1>
        <p className="text-muted-foreground">
          Understand how your data is stored and control your privacy settings
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Data is Stored */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            How Your Data is Stored
          </CardTitle>
          <CardDescription>
            Understanding our privacy-first approach to memory storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">End-to-End Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  All your memories are encrypted at rest using industry-standard AES-256 encryption.
                  Your data is encrypted before it reaches our servers and can only be decrypted with your credentials.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Vector Embeddings</h3>
                <p className="text-sm text-muted-foreground">
                  Your text is converted into vector embeddings (mathematical representations) to enable semantic search.
                  These embeddings are stored alongside your encrypted text. <strong>Embeddings alone cannot reconstruct your original text</strong>,
                  ensuring an additional layer of privacy.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">What We Store</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">We store:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Your encrypted memory content</li>
                    <li>Vector embeddings for search</li>
                    <li>Metadata (titles, tags, timestamps)</li>
                    <li>User authentication data</li>
                  </ul>
                  <p className="mt-3"><strong className="text-foreground">We DO NOT store:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Your passwords (only hashed versions)</li>
                    <li>Any data not explicitly uploaded by you</li>
                    <li>Analytics or tracking beyond essential security logs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Data Usage</h3>
                <p className="text-sm text-muted-foreground">
                  Your memories are <strong>never used to train AI models</strong>. They are never shared with third parties,
                  sold, or used for any purpose other than providing you with memory retrieval services.
                  Your data is yours and yours alone.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Controls
          </CardTitle>
          <CardDescription>
            Manage your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium mb-1">View All Memories</h4>
              <p className="text-sm text-muted-foreground">
                See all stored memories with full transparency
              </p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('memories')}>
              View Memories
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium mb-1">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all your memories in JSON format
              </p>
            </div>
            <Button variant="outline" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export (Coming Soon)
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex-1">
              <h4 className="font-medium mb-1 text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Delete All Data
              </h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your memories. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete All Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will <strong>permanently delete all your stored memories</strong>.
                This includes:
              </p>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                <li>All memory content and metadata</li>
                <li>All vector embeddings</li>
                <li>All tags and timestamps</li>
              </ul>
              <p className="font-medium text-foreground">
                This action cannot be undone. Are you absolutely sure?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllData}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
