import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, AppView } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { TypingArena } from './components/TypingArena';
import { TrainerDashboard } from './components/TrainerDashboard';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { MultiplayerArena } from './components/MultiplayerArena';
import { AcademyDashboard } from './components/academy/AcademyDashboard';
import { ExploreTestsPage } from './components/ExploreTestsPage';
import { PublicLeaderboardPage } from './components/PublicLeaderboardPage';
import { CertificateVerificationModal } from './components/CertificateVerificationModal';
import { PublicCertificateVerificationPage } from './components/PublicCertificateVerificationPage';
import { DeveloperFooter } from './components/DeveloperFooter';
import { TypingTest } from './types';

const MainLayout: React.FC = () => {
  const { currentUser, tests } = useApp();

  // Parse initial view from URL
  const getInitialView = (): { view: AppView; certId?: string } => {
    try {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      if (hash.includes('verify-certificate') || path.includes('verify-certificate') || params.get('cert') || params.get('verify')) {
        let certId = params.get('cert') || params.get('verify') || params.get('id') || '';
        if (!certId && hash.includes('verify-certificate/')) {
          certId = hash.split('verify-certificate/')[1]?.split('?')[0]?.split('#')[0]?.trim() || '';
        }
        if (!certId && path.includes('verify-certificate/')) {
          certId = path.split('verify-certificate/')[1]?.split('?')[0]?.split('#')[0]?.trim() || '';
        }
        return { view: 'verify', certId: decodeURIComponent(certId) };
      }

      // Check session
      const rememberPref = localStorage.getItem('testtype_remember_preference');
      const raw = sessionStorage.getItem('testtype_session_user') || (rememberPref === 'true' ? localStorage.getItem('testtype_session_user') : null);
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role === 'admin') return { view: 'admin' };
        if (u?.role === 'trainer') return { view: 'trainer' };
        if (u?.role === 'student') return { view: 'student' };
      }
    } catch (e) {
      console.error(e);
    }
    return { view: 'arena' };
  };

  const initialParsed = getInitialView();
  const [currentView, setCurrentView] = useState<AppView>(initialParsed.view);
  const [activeCertId, setActiveCertId] = useState<string>(initialParsed.certId || '');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<TypingTest | null>(null);

  // Listen to browser URL changes (e.g. hash changes, QR scans, popstate)
  useEffect(() => {
    const handleUrlChange = () => {
      const parsed = getInitialView();
      if (parsed.view === 'verify') {
        setCurrentView('verify');
        if (parsed.certId) setActiveCertId(parsed.certId);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Synchronize view and enforce strict role-based access control
  useEffect(() => {
    if (activeAssessment) return;

    if (!currentUser) {
      if (
        currentView !== 'arena' &&
        currentView !== 'tests' &&
        currentView !== 'leaderboard' &&
        currentView !== 'login' &&
        currentView !== 'multiplayer' &&
        currentView !== 'academy' &&
        currentView !== 'verify'
      ) {
        setCurrentView('arena');
      }
      return;
    }

    // Shared public / open views
    if (
      currentView === 'arena' ||
      currentView === 'tests' ||
      currentView === 'leaderboard' ||
      currentView === 'multiplayer' ||
      currentView === 'academy' ||
      currentView === 'verify'
    ) {
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
      setCurrentView('arena');
    }
  };

  const handleLoginSuccess = (role: 'trainer' | 'student' | 'admin') => {
    setCurrentView(role);
  };

  const handleOpenVerification = (certId?: string) => {
    if (certId) {
      setActiveCertId(certId);
      try {
        window.history.replaceState(null, '', `/#verify-certificate/${encodeURIComponent(certId)}`);
      } catch {}
    }
    setCurrentView('verify');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenVerificationModal={() => handleOpenVerification()}
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
            key={activeAssessment ? activeAssessment.id : 'arena'}
            initialTest={activeAssessment}
            onExitProctored={activeAssessment ? handleExitAssessment : undefined}
          />
        )}

        {currentView === 'tests' && (
          <ExploreTestsPage onLaunchTest={handleLaunchAssessment} />
        )}

        {currentView === 'verify' && (
          <PublicCertificateVerificationPage
            initialCertificateId={activeCertId}
            onBackToApp={() => setCurrentView('arena')}
          />
        )}

        {currentView === 'leaderboard' && (
          <PublicLeaderboardPage
            testId={tests[0]?.id || 'test-code-1'}
            onBackToApp={() => setCurrentView('arena')}
          />
        )}

        {currentView === 'trainer' && currentUser?.role === 'trainer' && (
          <TrainerDashboard
            onLaunchTest={handleLaunchAssessment}
            onOpenVerification={handleOpenVerification}
          />
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
            onOpenVerification={handleOpenVerification}
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
          <AdminPortal onOpenVerification={handleOpenVerification} />
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

      {/* Certificate Verification Modal */}
      {isVerifyModalOpen && (
        <CertificateVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          initialCode={activeCertId}
          onOpenFullPage={handleOpenVerification}
        />
      )}
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
