import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { TypingArena } from './components/TypingArena';
import { TrainerDashboard } from './components/TrainerDashboard';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { MultiplayerArena } from './components/MultiplayerArena';
import { AcademyDashboard } from './components/academy/AcademyDashboard';
import { DeveloperFooter } from './components/DeveloperFooter';
import { TypingTest } from './types';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [currentView, setCurrentView] = useState<'arena' | 'trainer' | 'student' | 'admin' | 'login' | 'multiplayer' | 'academy'>(() => {
    // Only auto-restore if remember preference was explicitly enabled
    const rememberPref = localStorage.getItem('testtype_remember_preference');
    const raw = sessionStorage.getItem('testtype_session_user') || (rememberPref === 'true' ? localStorage.getItem('testtype_session_user') : null);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u?.role === 'admin') return 'admin';
        if (u?.role === 'trainer') return 'trainer';
        if (u?.role === 'student') return 'student';
      } catch (e) {
        console.error(e);
      }
    }
    return 'login';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<TypingTest | null>(null);

  // Synchronize view and enforce strict role-based access control
  useEffect(() => {
    if (activeAssessment) return;

    if (!currentUser) {
      if (currentView !== 'arena' && currentView !== 'login' && currentView !== 'multiplayer' && currentView !== 'academy') {
        setCurrentView('login');
      }
      return;
    }

    // Shared views: 'arena', 'multiplayer', 'academy'
    if (currentView === 'arena' || currentView === 'multiplayer' || currentView === 'academy') {
      return;
    }

    if (currentUser.role === 'student') {
      if (currentView === 'trainer' || currentView === 'admin' || currentView === 'login') {
        setCurrentView('student');
      }
    } else if (currentUser.role === 'trainer') {
      if (currentView === 'admin' || currentView === 'student' || currentView === 'login') {
        setCurrentView('trainer');
      }
    } else if (currentUser.role === 'admin') {
      if (currentView === 'student' || currentView === 'login') {
        setCurrentView('admin');
      }
    }
  }, [currentUser, activeAssessment, currentView]);

  const handleLaunchAssessment = (test: TypingTest) => {
    setActiveAssessment(test);
    setCurrentView('arena');
  };

  const handleExitAssessment = () => {
    setActiveAssessment(null);
    if (currentUser?.role === 'trainer') {
      setCurrentView('trainer');
    } else if (currentUser?.role === 'student') {
      setCurrentView('student');
    } else if (currentUser?.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('login');
    }
  };

  const handleLoginSuccess = (role: 'trainer' | 'student' | 'admin') => {
    setCurrentView(role);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentView === 'login' && !currentUser && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setCurrentView('arena')}
          />
        )}

        {currentView === 'arena' && (
          <TypingArena
            initialTest={activeAssessment}
            onExitProctored={activeAssessment ? handleExitAssessment : undefined}
          />
        )}

        {currentView === 'trainer' && currentUser?.role === 'trainer' && (
          <TrainerDashboard onLaunchTest={handleLaunchAssessment} />
        )}

        {currentView === 'student' && currentUser?.role === 'student' && (
          <StudentPortal
            onStartAssessment={handleLaunchAssessment}
            onOpenPractice={() => {
              setActiveAssessment(null);
              setCurrentView('arena');
            }}
            onOpenMultiplayer={() => setCurrentView('multiplayer')}
            onOpenAcademy={() => setCurrentView('academy')}
          />
        )}

        {currentView === 'academy' && (
          <AcademyDashboard
            currentUser={currentUser}
            onExit={() =>
              setCurrentView(
                currentUser
                  ? currentUser.role === 'trainer'
                    ? 'trainer'
                    : currentUser.role === 'admin'
                    ? 'admin'
                    : 'student'
                  : 'arena'
              )
            }
          />
        )}

        {currentView === 'multiplayer' && (
          <MultiplayerArena
            onExit={() =>
              setCurrentView(
                currentUser
                  ? currentUser.role === 'trainer'
                    ? 'trainer'
                    : currentUser.role === 'admin'
                    ? 'admin'
                    : 'student'
                  : 'arena'
              )
            }
          />
        )}

        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminPortal />
        )}
      </main>

      {/* Official Developer Attribution Footer */}
      <DeveloperFooter />

      {/* Login Modal for quick authentication */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
