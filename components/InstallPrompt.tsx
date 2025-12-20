'use client';

import { useEffect, useState } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    console.log('📱 InstallPrompt component mounted');

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✓ App already installed (standalone mode)');
      setIsInstalled(true);
      return;
    }

    setIsSupported('beforeinstallprompt' in window);
    console.log('📱 beforeinstallprompt supported:', 'beforeinstallprompt' in window);

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('✓✓✓ beforeinstallprompt event fired - READY TO INSTALL ✓✓✓');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('✓ App installed successfully');
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log if we're on a supported platform
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available');
      return;
    }

    console.log('🔽 Showing install prompt...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    console.log('❌ Install prompt dismissed');
    setShowPrompt(false);
  };

  if (isInstalled) {
    return null;
  }

  // Show prompt if ready, or show debug info if not ready
  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Install Aegis Tracker</h3>
              <p className="text-sm opacity-90">
                Get instant access to your tracker on the home screen. Works offline too!
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-cyan-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded transition"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {!showPrompt && !isSupported && (
        <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-40">
          ⚠️ PWA not ready (open Console for details)
        </div>
      )}
    </>
  );
}
