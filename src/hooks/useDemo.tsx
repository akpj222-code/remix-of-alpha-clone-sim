import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  demoBalance: number;
  startDemo: (initialBalance: number) => void;
  exitDemo: () => void;
  updateDemoBalance: (newBalance: number) => void;
  currentTutorialStep: number;
  nextTutorialStep: () => void;
  completeTutorial: () => void;
  isTutorialComplete: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const TUTORIAL_STEPS = [
  { title: "Welcome to Demo Trading!", message: "This is a risk-free environment to learn trading. Your demo balance is virtual - perfect for practice!" },
  { title: "Understanding the Dashboard", message: "The dashboard shows your portfolio overview, recent trades, and market insights. Explore the navigation to find Stocks and Crypto." },
  { title: "Browsing Markets", message: "Use the Stocks and Crypto pages to browse available assets. Watch the prices change in real-time!" },
  { title: "Making Your First Trade", message: "Click on any asset to open the trade modal. You can buy or sell shares. Start small to understand the mechanics." },
  { title: "Managing Risk", message: "Never invest more than you can afford to lose. Diversify your portfolio across different assets." },
  { title: "Reading Charts", message: "Pay attention to price trends and percentage changes. Green means the asset is up, red means it's down." },
  { title: "Portfolio Tracking", message: "Visit the Portfolio page to see all your holdings, their current values, and your profit/loss." },
  { title: "You're Ready!", message: "You now know the basics! Continue practicing with your demo account. When ready, switch to real trading." }
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoBalance, setDemoBalance] = useState(0);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isTutorialComplete, setIsTutorialComplete] = useState(false);

  useEffect(() => {
    const savedDemo = localStorage.getItem('demo_mode');
    if (savedDemo) {
      const { active, balance, tutorialStep, tutorialComplete } = JSON.parse(savedDemo);
      setIsDemoMode(active);
      setDemoBalance(balance);
      setCurrentTutorialStep(tutorialStep || 0);
      setIsTutorialComplete(tutorialComplete || false);
    }
  }, []);

  const saveToStorage = (active: boolean, balance: number, step: number, complete: boolean) => {
    localStorage.setItem('demo_mode', JSON.stringify({ 
      active, 
      balance, 
      tutorialStep: step,
      tutorialComplete: complete 
    }));
  };

  const startDemo = (initialBalance: number) => {
    setIsDemoMode(true);
    setDemoBalance(initialBalance);
    setCurrentTutorialStep(0);
    setIsTutorialComplete(false);
    saveToStorage(true, initialBalance, 0, false);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setDemoBalance(0);
    setCurrentTutorialStep(0);
    setIsTutorialComplete(false);
    localStorage.removeItem('demo_mode');
  };

  const updateDemoBalance = (newBalance: number) => {
    setDemoBalance(newBalance);
    saveToStorage(true, newBalance, currentTutorialStep, isTutorialComplete);
  };

  const nextTutorialStep = () => {
    const next = currentTutorialStep + 1;
    if (next >= TUTORIAL_STEPS.length) {
      setIsTutorialComplete(true);
      saveToStorage(true, demoBalance, next, true);
    } else {
      setCurrentTutorialStep(next);
      saveToStorage(true, demoBalance, next, false);
    }
  };

  const completeTutorial = () => {
    setIsTutorialComplete(true);
    saveToStorage(true, demoBalance, TUTORIAL_STEPS.length, true);
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoBalance,
      startDemo,
      exitDemo,
      updateDemoBalance,
      currentTutorialStep,
      nextTutorialStep,
      completeTutorial,
      isTutorialComplete
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

export { TUTORIAL_STEPS };
