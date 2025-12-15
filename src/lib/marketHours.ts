// US Stock Market Hours (NYSE/NASDAQ)
// Regular hours: 9:30 AM - 4:00 PM ET (Monday-Friday)
// Pre-market: 4:00 AM - 9:30 AM ET
// After-hours: 4:00 PM - 8:00 PM ET

export interface MarketStatus {
  isOpen: boolean;
  status: 'pre-market' | 'open' | 'after-hours' | 'closed';
  message: string;
  nextOpen?: string;
  nextClose?: string;
}

// US holidays when market is closed (2024-2025)
const US_HOLIDAYS = [
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
  '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25',
];

function getETTime(): Date {
  // Convert current time to Eastern Time
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(etString);
}

function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return US_HOLIDAYS.includes(dateStr);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getMarketStatus(): MarketStatus {
  const etNow = getETTime();
  const hours = etNow.getHours();
  const minutes = etNow.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Market times in minutes from midnight ET
  const preMarketOpen = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  const afterHoursClose = 20 * 60; // 8:00 PM

  // Check if it's a weekend or holiday
  if (isWeekend(etNow) || isHoliday(etNow)) {
    const nextOpen = getNextMarketOpen(etNow);
    return {
      isOpen: false,
      status: 'closed',
      message: isWeekend(etNow) ? 'Market closed for the weekend' : 'Market closed for holiday',
      nextOpen: nextOpen.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
    };
  }

  // Pre-market
  if (currentMinutes >= preMarketOpen && currentMinutes < marketOpen) {
    const opensIn = marketOpen - currentMinutes;
    return {
      isOpen: false,
      status: 'pre-market',
      message: `Pre-market trading • Opens in ${formatMinutes(opensIn)}`,
      nextOpen: formatTime(9, 30),
    };
  }

  // Regular market hours
  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    const closesIn = marketClose - currentMinutes;
    return {
      isOpen: true,
      status: 'open',
      message: `Market Open • Closes in ${formatMinutes(closesIn)}`,
      nextClose: formatTime(16, 0),
    };
  }

  // After-hours
  if (currentMinutes >= marketClose && currentMinutes < afterHoursClose) {
    return {
      isOpen: false,
      status: 'after-hours',
      message: 'After-hours trading • Limited liquidity',
    };
  }

  // Market closed (after 8 PM or before 4 AM)
  const nextOpen = getNextMarketOpen(etNow);
  return {
    isOpen: false,
    status: 'closed',
    message: 'Market Closed',
    nextOpen: nextOpen.toLocaleString('en-US', { 
      weekday: 'short', 
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
  };
}

function getNextMarketOpen(currentDate: Date): Date {
  const nextOpen = new Date(currentDate);
  
  // Move to next day if market is closed for today
  const hours = nextOpen.getHours();
  if (hours >= 16) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  // Skip weekends and holidays
  while (isWeekend(nextOpen) || isHoliday(nextOpen)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  nextOpen.setHours(9, 30, 0, 0);
  return nextOpen;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period} ET`;
}

// Crypto markets are 24/7
export function getCryptoMarketStatus(): MarketStatus {
  return {
    isOpen: true,
    status: 'open',
    message: 'Crypto markets are open 24/7',
  };
}
