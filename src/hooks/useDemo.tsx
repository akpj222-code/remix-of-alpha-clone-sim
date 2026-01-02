import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoPortfolioItem {
  symbol: string;
  company_name: string;
  shares: number;
  average_price: number;
}

interface DemoTrade {
  id: string;
  symbol: string;
  company_name: string;
  trade_type: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  total_amount: number;
  fee: number;
  created_at: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoBalance: number;
  demoPortfolio: DemoPortfolioItem[];
  demoTrades: DemoTrade[];
  startDemo: (initialBalance: number) => void;
  exitDemo: () => void;
  updateDemoBalance: (newBalance: number) => void;
  executeDemoTrade: (
    type: 'buy' | 'sell',
    symbol: string,
    companyName: string,
    shares: number,
    pricePerShare: number,
    fee: number
  ) => { error: Error | null };
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
  const [demoPortfolio, setDemoPortfolio] = useState<DemoPortfolioItem[]>([]);
  const [demoTrades, setDemoTrades] = useState<DemoTrade[]>([]);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isTutorialComplete, setIsTutorialComplete] = useState(false);

  useEffect(() => {
    const savedDemo = localStorage.getItem('demo_mode');
    if (savedDemo) {
      const { active, balance, portfolio, trades, tutorialStep, tutorialComplete } = JSON.parse(savedDemo);
      setIsDemoMode(active);
      setDemoBalance(balance);
      setDemoPortfolio(portfolio || []);
      setDemoTrades(trades || []);
      setCurrentTutorialStep(tutorialStep || 0);
      setIsTutorialComplete(tutorialComplete || false);
    }
  }, []);

  const saveToStorage = (
    active: boolean, 
    balance: number, 
    portfolio: DemoPortfolioItem[], 
    trades: DemoTrade[],
    step: number, 
    complete: boolean
  ) => {
    localStorage.setItem('demo_mode', JSON.stringify({ 
      active, 
      balance,
      portfolio,
      trades,
      tutorialStep: step,
      tutorialComplete: complete 
    }));
  };

  const startDemo = (initialBalance: number) => {
    setIsDemoMode(true);
    setDemoBalance(initialBalance);
    setDemoPortfolio([]);
    setDemoTrades([]);
    setCurrentTutorialStep(0);
    setIsTutorialComplete(false);
    saveToStorage(true, initialBalance, [], [], 0, false);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setDemoBalance(0);
    setDemoPortfolio([]);
    setDemoTrades([]);
    setCurrentTutorialStep(0);
    setIsTutorialComplete(false);
    localStorage.removeItem('demo_mode');
  };

  const updateDemoBalance = (newBalance: number) => {
    setDemoBalance(newBalance);
    saveToStorage(true, newBalance, demoPortfolio, demoTrades, currentTutorialStep, isTutorialComplete);
  };

  const executeDemoTrade = (
    type: 'buy' | 'sell',
    symbol: string,
    companyName: string,
    shares: number,
    pricePerShare: number,
    fee: number
  ): { error: Error | null } => {
    const totalAmount = shares * pricePerShare;
    const grandTotal = type === 'buy' ? totalAmount + fee : totalAmount - fee;
    
    // Validate balance for buy
    if (type === 'buy' && demoBalance < grandTotal) {
      return { error: new Error('Insufficient demo balance') };
    }
    
    // Validate shares for sell
    const existingPosition = demoPortfolio.find(p => p.symbol === symbol);
    if (type === 'sell' && (!existingPosition || existingPosition.shares < shares)) {
      return { error: new Error('Insufficient shares') };
    }

    // Update balance
    const newBalance = type === 'buy' 
      ? demoBalance - grandTotal 
      : demoBalance + grandTotal;
    
    // Update portfolio
    let newPortfolio: DemoPortfolioItem[];
    if (type === 'buy') {
      if (existingPosition) {
        const newShares = existingPosition.shares + shares;
        const newAvgPrice = (
          (existingPosition.shares * existingPosition.average_price + shares * pricePerShare) / newShares
        );
        newPortfolio = demoPortfolio.map(p => 
          p.symbol === symbol 
            ? { ...p, shares: newShares, average_price: newAvgPrice }
            : p
        );
      } else {
        newPortfolio = [...demoPortfolio, {
          symbol,
          company_name: companyName,
          shares,
          average_price: pricePerShare
        }];
      }
    } else {
      const newShares = existingPosition!.shares - shares;
      if (newShares <= 0) {
        newPortfolio = demoPortfolio.filter(p => p.symbol !== symbol);
      } else {
        newPortfolio = demoPortfolio.map(p => 
          p.symbol === symbol ? { ...p, shares: newShares } : p
        );
      }
    }

    // Add trade record
    const newTrade: DemoTrade = {
      id: `demo-${Date.now()}`,
      symbol,
      company_name: companyName,
      trade_type: type,
      shares,
      price_per_share: pricePerShare,
      total_amount: grandTotal,
      fee,
      created_at: new Date().toISOString()
    };
    const newTrades = [newTrade, ...demoTrades].slice(0, 50); // Keep last 50

    setDemoBalance(newBalance);
    setDemoPortfolio(newPortfolio);
    setDemoTrades(newTrades);
    saveToStorage(true, newBalance, newPortfolio, newTrades, currentTutorialStep, isTutorialComplete);

    return { error: null };
  };

  const nextTutorialStep = () => {
    const next = currentTutorialStep + 1;
    if (next >= TUTORIAL_STEPS.length) {
      setIsTutorialComplete(true);
      saveToStorage(true, demoBalance, demoPortfolio, demoTrades, next, true);
    } else {
      setCurrentTutorialStep(next);
      saveToStorage(true, demoBalance, demoPortfolio, demoTrades, next, false);
    }
  };

  const completeTutorial = () => {
    setIsTutorialComplete(true);
    saveToStorage(true, demoBalance, demoPortfolio, demoTrades, TUTORIAL_STEPS.length, true);
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoBalance,
      demoPortfolio,
      demoTrades,
      startDemo,
      exitDemo,
      updateDemoBalance,
      executeDemoTrade,
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
