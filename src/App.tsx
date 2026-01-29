import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { IngestionPage } from './components/IngestionPage';
import { QueryPage } from './components/QueryPage';
import { MemoryListPage } from './components/MemoryListPage';
import { SettingsPage } from './components/SettingsPage';
import { Button } from './components/ui/button';
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  List,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';

type Page = 'dashboard' | 'ingest' | 'query' | 'memories' | 'settings';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingest' as Page, label: 'Add Memory', icon: Database },
    { id: 'query' as Page, label: 'Query', icon: MessageSquare },
    { id: 'memories' as Page, label: 'Memories', icon: List },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'ingest':
        return <IngestionPage onNavigate={setCurrentPage} />;
      case 'query':
        return <QueryPage />;
      case 'memories':
        return <MemoryListPage />;
      case 'settings':
        return <SettingsPage onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-card border border-border rounded-lg p-2 shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">Memory AI</h2>
            <p className="text-sm text-muted-foreground mt-1">Privacy-First</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${isActive ? 'bg-secondary' : ''}`}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 md:p-8 max-w-7xl">
          {renderPage()}
        </div>
      </main>

      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
