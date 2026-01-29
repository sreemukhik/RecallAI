import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Database, Clock, HardDrive, Plus, Shield } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface Stats {
  totalMemories: number;
  lastUpload: string | null;
  storageBytes: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalMemories: 0, lastUpload: null, storageBytes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Use the existing list endpoint to avoid needing a backend restart for the new /stats endpoint
      const docs = await fetchAPI('/ingest/');

      const totalMemories = docs.length;
      let lastUpload = null;
      let storageBytes = 0;

      if (docs.length > 0) {
        // Docs are already sorted by created_at desc from backend
        lastUpload = docs[0].created_at;

        // Calculate total storage size
        storageBytes = docs.reduce((acc: number, doc: any) => acc + (doc.content?.length || 0), 0);
      }

      setStats({
        totalMemories,
        lastUpload,
        storageBytes
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    // Ensure date is treated as UTC if no timezone is specified
    const dateStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">
          Manage your personal AI memory and query your stored information
        </p>
      </div>

      {/* Privacy Assurance Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Your data is private and secure</h3>
              <p className="text-sm text-muted-foreground">
                All your memories are encrypted and only accessible to you. They are never used to train AI models or shared with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Memories
            </CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : stats.totalMemories}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Upload
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : formatDate(stats.lastUpload)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most recent ingestion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : formatBytes(stats.storageBytes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approximate size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate('ingest')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Add Memory</CardTitle>
            <CardDescription>
              Upload new notes, conversations, or documents to your personal memory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Start Upload
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate('query')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Query Memory</CardTitle>
            <CardDescription>
              Ask questions and get answers from your stored memories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Querying
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats.totalMemories === 0 && !loading && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              You haven't uploaded any memories yet. Here's how to begin:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">Upload your first memory</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Add Memory" to upload notes, conversations, or any text you want to remember
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">Query your memories</h4>
                <p className="text-sm text-muted-foreground">
                  Use natural language to ask questions and retrieve information from your stored data
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">Stay in control</h4>
                <p className="text-sm text-muted-foreground">
                  View, manage, and delete your memories anytime from the Memories page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
