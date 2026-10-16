import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { FloatingAIButton } from './components/common/FloatingAIButton';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { RemindersPage } from './pages/RemindersPage';
import { CalendarPage } from './pages/CalendarPage';
import { VoicePage } from './pages/VoicePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { Brain, Loader2 } from 'lucide-react';

function AppContent() {
  const { currentTab } = useApp();
  const { user, loading, signOut } = useAuth();
  // Loading screen while evaluating session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-accent-blue flex items-center justify-center shadow-glow mb-4 animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
          <span>Starting Smriti AI...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and not in guest preview mode, show Login Page
  // If unauthenticated, show Login Page
  if (!user) {
    return <LoginPage />;
  }
  const handleLogout = async () => {
  await signOut();
};

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'chat':
        return <ChatPage />;
      case 'voice':
        return <VoicePage />;
      case 'memories':
        return <MemoriesPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'settings':
        return (
          <SettingsPage
            onLogout={handleLogout}
            userEmail={user?.email || null}
            userName={user?.user_metadata?.full_name || user?.user_metadata?.name || null}
            userAvatar={user?.user_metadata?.avatar_url || null}
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Floating AI Quick Capture Button */}
      <FloatingAIButton />

      {/* Global Toast Alert Layer */}
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;


