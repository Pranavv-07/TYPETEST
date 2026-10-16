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
import { ModuleUnderDevelopment } from './components/ModuleUnderDevelopment';
import { DeveloperFooter } from './components/DeveloperFooter';
import { isAcademyGloballyOpen } from './services/academyService';
import { TypingTest } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GraduationCap, ShieldAlert } from 'lucide-react';
import { trackPageView } from './services/analyticsService';

const MainLayout: React.FC = () => {
  const { currentUser, tests, moduleControls, toggleModule, isModuleDisabled } = useApp();

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

  // Track Single Page Application (SPA) view changes to Google Analytics
  useEffect(() => {
    trackPageView(currentView);
  }, [currentView]);

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
          isModuleDisabled('arena') ? (
            <ModuleUnderDevelopment
              moduleName="Practice Arena"
              customMessage={moduleControls.arena?.statusMessage}
              onBackToArena={() => setCurrentView('tests')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('arena', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Practice Arena">
              <TypingArena
                key={activeAssessment ? activeAssessment.id : 'arena'}
                initialTest={activeAssessment}
                onExitProctored={activeAssessment ? handleExitAssessment : undefined}
              />
            </ErrorBoundary>
          )
        )}

        {currentView === 'tests' && (
          isModuleDisabled('tests') ? (
            <ModuleUnderDevelopment
              moduleName="Explore Tests Directory"
              customMessage={moduleControls.tests?.statusMessage}
              onBackToArena={() => setCurrentView('arena')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('tests', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Tests Directory">
              <ExploreTestsPage onLaunchTest={handleLaunchAssessment} />
            </ErrorBoundary>
          )
        )}

        {currentView === 'verify' && (
          isModuleDisabled('verify') ? (
            <ModuleUnderDevelopment
              moduleName="Certificate Verification"
              customMessage={moduleControls.verify?.statusMessage}
              onBackToArena={() => setCurrentView('arena')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('verify', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Certificate Verification">
              <PublicCertificateVerificationPage
                initialCertificateId={activeCertId}
                onBackToApp={() => setCurrentView('arena')}
              />
            </ErrorBoundary>
          )
        )}

        {currentView === 'leaderboard' && (
          isModuleDisabled('leaderboard') ? (
            <ModuleUnderDevelopment
              moduleName="Public Leaderboards"
              customMessage={moduleControls.leaderboard?.statusMessage}
              onBackToArena={() => setCurrentView('arena')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('leaderboard', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Public Leaderboard">
              <PublicLeaderboardPage
                testId={tests[0]?.id || 'test-code-1'}
                onBackToApp={() => setCurrentView('arena')}
              />
            </ErrorBoundary>
          )
        )}

        {currentView === 'trainer' && (
          currentUser?.role === 'trainer' ? (
            <ErrorBoundary fallbackTitle="Unable to load Trainer Portal">
              <TrainerDashboard
                onLaunchTest={handleLaunchAssessment}
                onOpenVerification={handleOpenVerification}
              />
            </ErrorBoundary>
          ) : (
            <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Trainer Privileges Required</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                You must be logged in as an authorized faculty trainer to access institutional cohort controls, create assignments, and view classroom analytics.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Log In as Trainer
                </button>
                <button
                  onClick={() => setCurrentView('arena')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Return to Arena
                </button>
              </div>
            </div>
          )
        )}

        {currentView === 'student' && (
          !currentUser ? (
            <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Student Portal Access</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in with your institutional student credentials or roll number to access your assigned tests, milestone certificates, and verified history.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Log In to Student Account
                </button>
                <button
                  onClick={() => setCurrentView('arena')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Practice Arena
                </button>
              </div>
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Student Portal">
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
            </ErrorBoundary>
          )
        )}

        {currentView === 'academy' && (
          isModuleDisabled('academy') ? (
            <ModuleUnderDevelopment
              moduleName="Touch Typing Academy"
              customMessage={moduleControls.academy?.statusMessage}
              onBackToArena={() => setCurrentView('arena')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('academy', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Typing Academy">
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
            </ErrorBoundary>
          )
        )}

        {currentView === 'multiplayer' && (
          isModuleDisabled('multiplayer') ? (
            <ModuleUnderDevelopment
              moduleName="Multiplayer Arena"
              customMessage={moduleControls.multiplayer?.statusMessage}
              onBackToArena={() => setCurrentView('arena')}
              onGoToDashboard={currentUser?.role === 'student' ? () => setCurrentView('student') : undefined}
              isAdmin={currentUser?.role === 'admin'}
              onAdminEnable={() => toggleModule('multiplayer', false)}
            />
          ) : (
            <ErrorBoundary fallbackTitle="Unable to load Multiplayer Arena">
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
            </ErrorBoundary>
          )
        )}

        {currentView === 'admin' && (
          currentUser?.role === 'admin' ? (
            <ErrorBoundary fallbackTitle="Unable to load Admin Console">
              <AdminPortal onOpenVerification={handleOpenVerification} />
            </ErrorBoundary>
          ) : (
            <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Administrator Credentials Required</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super administrator authentication is required to access system configuration, audit logs, and institutional controls.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-rose-500/20"
                >
                  Log In as Administrator
                </button>
                <button
                  onClick={() => setCurrentView('arena')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Return to Arena
                </button>
              </div>
            </div>
          )
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
