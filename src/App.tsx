import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loadState, saveState, AppState } from './lib/storage';
import Home from './components/Home';
import History from './components/History';
import Settings from './components/Settings';
import Setup from './components/Setup';
import Layout from './components/Layout';

export type View = 'home' | 'history' | 'settings' | 'setup';

export default function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [currentView, setCurrentView] = useState<View>(state.onboarded ? 'home' : 'setup');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const newState = updater(prev);
      return newState;
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'setup':
        return <Setup onComplete={(settings) => {
          updateState(prev => ({ ...prev, settings, onboarded: true }));
          setCurrentView('home');
        }} />;
      case 'home':
        return <Home state={state} updateState={updateState} setView={setCurrentView} />;
      case 'history':
        return <History state={state} updateState={updateState} />;
      case 'settings':
        return <Settings state={state} updateState={updateState} onReset={() => {
          updateState(prev => ({ ...prev, onboarded: false, logs: {} }));
          setCurrentView('setup');
        }} />;
      default:
        return <Home state={state} updateState={updateState} setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-sans selection:bg-[#00fdc1]/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        ) : (
          <Layout currentView={currentView} setView={setCurrentView}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-32"
            >
              {renderView()}
            </motion.div>
          </Layout>
        )}
      </AnimatePresence>
    </div>
  );
}
