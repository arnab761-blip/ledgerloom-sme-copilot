export type SupportedCurrency = 'BDT' | 'CNY' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
  exchangeRateToBDT: number; // 1 unit of this currency = X BDT
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    nativeName: 'টাকা (BDT ৳)',
    flag: '🇧🇩',
    exchangeRateToBDT: 1.0,
  },
  {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan (RMB)',
    nativeName: '人民币 (CNY ¥)',
    flag: '🇨🇳',
    exchangeRateToBDT: 16.5,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nativeName: 'US Dollar (USD $)',
    flag: '🇺🇸',
    exchangeRateToBDT: 120.0,
  },
];

/**
 * Convert an amount from a source currency (usually BDT stored in Excel) to target currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency = 'BDT',
  toCurrency: SupportedCurrency = 'BDT'
): number {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  const fromConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrency) ||
    SUPPORTED_CURRENCIES[0];
  const toConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === toCurrency) ||
    SUPPORTED_CURRENCIES[0];

  // Convert to BDT base
  const amountInBDT = amount * fromConfig.exchangeRateToBDT;
  // Convert from BDT to target
  const converted = amountInBDT / toConfig.exchangeRateToBDT;

  if (toCurrency === 'USD') {
    return Math.round(converted * 100) / 100;
  }
  return Math.round(converted);
}

/**
 * Format currency amount with symbol and code
 */
export function formatCurrencyAmount(
  amount: number,
  currency: SupportedCurrency = 'BDT',
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  }
): string {
  const config =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
    SUPPORTED_CURRENCIES[0];

  const showSymbol = options?.showSymbol ?? true;
  const showCode = options?.showCode ?? true;

  const formattedNum = Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' && amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  if (showSymbol && showCode) {
    return `${config.symbol} ${formattedNum} ${config.code}`;
  }
  if (showSymbol) {
    return `${config.symbol} ${formattedNum}`;
  }
  if (showCode) {
    return `${formattedNum} ${config.code}`;
  }
  return formattedNum;
}

/**
 * Returns default preset quick amounts for Target Profit Planner based on currency
 */
export function getProfitPresets(currency: SupportedCurrency): number[] {
  switch (currency) {
    case 'USD':
      return [100, 250, 500, 1000];
    case 'CNY':
      return [1000, 2500, 5000, 10000];
    case 'BDT':
    default:
      return [10000, 25000, 50000, 100000];
  }
}

/**
 * Returns default target profit initial value for Target Profit Planner based on currency
 */
export function getDefaultTargetProfit(currency: SupportedCurrency): string {
  switch (currency) {
    case 'USD':
      return '250';
    case 'CNY':
      return '2000';
    case 'BDT':
    default:
      return '30000';
  }
}

/**
 * Returns overdue debt alert threshold based on currency (equivalent to 30,000 BDT)
 */
export function getOverdueThreshold(currency: SupportedCurrency): number {
  return convertCurrency(30000, 'BDT', currency);
}
