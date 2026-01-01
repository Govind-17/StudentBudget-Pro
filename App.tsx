import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Plus, 
  LayoutDashboard, 
  History, 
  Moon, 
  Sun, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  X,
  Trash2,
  Filter,
  Search,
  Edit2,
  AlertCircle,
  CircleEllipsis,
  Download,
  PiggyBank,
  Share2,
  Image as ImageIcon,
  Camera,
  Settings,
  Grid,
  Save,
  CheckCircle2,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  Share,
  XCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isAfter, isBefore, startOfDay, endOfDay, eachMonthOfInterval, subMonths, addMonths, isValid } from 'date-fns';
import html2canvas from 'html2canvas';
import { Transaction, CategoryDefinition, TransactionType, SavingsGoal } from './types';

const SnowflakeAnimation: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; size: string; duration: string; delay: string; opacity: number }[]>([]);

  useEffect(() => {
    const count = 25;
    const initialSnowflakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 8 + 6}px`,
      duration: `${Math.random() * 15 + 15}s`,
      delay: `${Math.random() * 10}s`,
      opacity: Math.random() * 0.4 + 0.2,
    }));
    setSnowflakes(initialSnowflakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {snowflakes.map((s) => (
        <div
          key={s.id}
          className="absolute flex items-center justify-center text-white"
          style={{
            left: s.left,
            fontSize: s.size,
            opacity: s.opacity,
            animation: `fall ${s.duration} linear infinite`,
            animationDelay: s.delay,
            top: '-20px',
            filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))'
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
};

const ICON_OPTIONS = [
  'Utensils', 'Home', 'BookOpen', 'Bus', 'Music', 'Banknote', 
  'ShoppingCart', 'Coffee', 'Dumbbell', 'Laptop', 'GraduationCap', 
  'Heart', 'Pizza', 'Smartphone', 'Gamepad2', 'Shirt', 'Briefcase',
  'Zap', 'Car', 'Plane', 'Gift', 'Wine', 'Camera', 'Brush'
];

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'cat-income', name: 'Income', iconName: 'Banknote', isSystem: true },
  { id: 'cat-food', name: 'Food & Drink', iconName: 'Utensils', isSystem: true },
  { id: 'cat-rent', name: 'Rent & Bills', iconName: 'Home', isSystem: true },
  { id: 'cat-books', name: 'Books & Study', iconName: 'BookOpen', isSystem: true },
  { id: 'cat-transport', name: 'Transport', iconName: 'Bus', isSystem: true },
  { id: 'cat-fun', name: 'Fun & Social', iconName: 'Music', isSystem: true },
  { id: 'cat-other', name: 'Other', iconName: 'CircleEllipsis', isSystem: true },
];

const GOAL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const PIE_CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#a4de6c'];


const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : [];
  });
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('monthlyBudget');
    return saved ? JSON.parse(saved) : 10000;
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [transactionCategory, setTransactionCategory] = useState<string>('cat-food');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('CircleEllipsis');

  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);
  const historyReportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.CircleEllipsis;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id) || categories.find(c => c.id === 'cat-other')!;

  const availableMonths = useMemo(() => {
    const transactionDates = transactions.map(t => parseISO(t.date)).filter(d => isValid(d));
    
    let earliestDate: Date;
    if (transactionDates.length === 0) {
      earliestDate = new Date(); // Fallback to current date if no valid transaction dates
    } else {
      earliestDate = transactionDates.reduce((a, b) => (a.getTime() < b.getTime() ? a : b));
    }

    const minDateForInterval = startOfMonth(earliestDate);
    const maxDateForInterval = endOfMonth(new Date()); // Always use current month end as max

    return eachMonthOfInterval({ start: minDateForInterval, end: maxDateForInterval }).reverse();
  }, [transactions]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );
    const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, remainingBudget: monthlyBudget - totalExpense, currentMonthTransactions };
  }, [transactions, monthlyBudget]);

  const pieChartData = useMemo(() => {
    const expenseByCategory: { [key: string]: number } = {};
    stats.currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
    return Object.entries(expenseByCategory)
      .map(([categoryId, amount], index) => ({
        name: getCategoryById(categoryId).name,
        value: amount,
        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value); // Sort to show largest slices first
  }, [stats.currentMonthTransactions, categories]);

  const barChartData = useMemo(() => {
    const monthlyExpenses: { [key: string]: number } = {};
    const today = new Date();
    const monthsArray: Date[] = [];

    // Populate monthsArray with the last 6 months (including current)
    for (let i = 0; i < 6; i++) {
      monthsArray.push(subMonths(today, i));
    }
    // Sort oldest to newest for chart display
    monthsArray.sort((a, b) => a.getTime() - b.getTime());

    // Initialize monthlyExpenses for each of these months
    monthsArray.forEach(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM'); // Use a precise key
      monthlyExpenses[monthKey] = 0;
    });

    // Aggregate expenses
    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      if (isValid(tDate)) {
        const transactionMonthKey = format(tDate, 'yyyy-MM');
        // Only aggregate if it falls within our 6-month window
        if (monthlyExpenses.hasOwnProperty(transactionMonthKey) && t.type === 'expense') {
          monthlyExpenses[transactionMonthKey] += t.amount;
        }
      }
    });

    // Map to chart data format
    return monthsArray.map(monthDate => ({
      month: format(monthDate, 'MMM'), // Short month name for display
      expenses: monthlyExpenses[format(monthDate, 'yyyy-MM')],
    }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           getCategoryById(t.category).name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesDate = true;
      const tDate = parseISO(t.date);
      
      // Conjunction logic for month and date range
      if (filterMonth !== 'all') {
        const monthDate = parseISO(filterMonth);
        if (isValid(monthDate)) { // Check if parsed month date is valid
          const start = startOfMonth(monthDate);
          const end = endOfMonth(monthDate);
          matchesDate = matchesDate && isWithinInterval(tDate, { start, end });
        } else {
          matchesDate = false; // Invalid month filter means no match
        }
      }
      
      const parsedStartDate = filterStartDate ? parseISO(filterStartDate) : null;
      const parsedEndDate = filterEndDate ? parseISO(filterEndDate) : null;

      if (parsedStartDate && isValid(parsedStartDate)) { // Check if parsed start date is valid
          matchesDate = matchesDate && (isAfter(tDate, startOfDay(parsedStartDate)) || tDate.getTime() === startOfDay(parsedStartDate).getTime());
      }
      if (parsedEndDate && isValid(parsedEndDate)) { // Check if parsed end date is valid
          matchesDate = matchesDate && (isBefore(tDate, endOfDay(parsedEndDate)) || tDate.getTime() === endOfDay(parsedEndDate).getTime());
      }
      
      return matchesType && matchesCategory && matchesSearch && matchesDate;
    });
  }, [transactions, filterType, filterCategory, filterMonth, searchQuery, filterStartDate, filterEndDate, categories]);

  const filteredStats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const filterSummary = useMemo(() => {
    const activeFilters: string[] = [];
    if (searchQuery) activeFilters.push(`"${searchQuery}"`);
    if (filterType !== 'all') activeFilters.push(filterType);
    if (filterMonth !== 'all') {
      const parsedMonth = parseISO(filterMonth);
      if (isValid(parsedMonth)) {
        activeFilters.push(format(parsedMonth, 'MMM yyyy'));
      }
    }
    if (filterCategory !== 'all') activeFilters.push(getCategoryById(filterCategory).name);
    if (filterStartDate || filterEndDate) {
      activeFilters.push(`Dates: ${filterStartDate || 'Any'} to ${filterEndDate || 'Any'}`);
    }
    return activeFilters.length > 0 ? `Showing: ${activeFilters.join(' • ')}` : '';
  }, [searchQuery, filterType, filterMonth, filterCategory, filterStartDate, filterEndDate, categories]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterMonth('all');
    setFilterCategory('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setIsFilterVisible(false); // Close filters after clearing
  };

  const handleOpenAdd = () => {
    setEditingId(null); setAmount(''); setDescription(''); setType('expense'); setTransactionCategory('cat-food'); setReceiptImage(undefined); setIsModalOpen(true);
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setEditingId(transaction.id); setAmount(transaction.amount.toString()); setDescription(transaction.description); setType(transaction.type); setTransactionCategory(transaction.category); setReceiptImage(transaction.receiptImage); setIsModalOpen(true);
  };

  const handleOpenDetail = (transaction: Transaction) => {
    setViewingTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSaveConfirmOpen(true);
  };

  const handleFinalizeSave = () => {
    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, amount: parseFloat(amount), type, category: transactionCategory, description: description || 'No description', receiptImage } : t));
    } else {
      const newTransaction: Transaction = { id: crypto.randomUUID(), amount: parseFloat(amount), type, category: transactionCategory, description: description || 'No description', date: new Date().toISOString(), receiptImage };
      setTransactions([newTransaction, ...transactions]);
    }
    setIsSaveConfirmOpen(false);
    setIsModalOpen(false);
  };

  const handleShareReport = async () => {
    if (!reportRef.current) return;
    setIsSharing(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: isDarkMode ? '#020617' : '#f9fafb', scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Report_${format(new Date(), 'MMM_yyyy')}.png`;
      link.click();
    } catch (err) { console.error(err); } finally { setIsSharing(false); }
  };

  const handleShareHistory = async () => {
    if (!historyReportRef.current) return;
    setIsSharing(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const canvas = await html2canvas(historyReportRef.current, { backgroundColor: isDarkMode ? '#020617' : '#f9fafb', scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Transaction_History_${format(new Date(), 'MMM_dd_yyyy')}.png`;
      link.click();
    } catch (err) { console.error(err); } finally { setIsSharing(false); }
  };

  return (
    <div className={`min-h-screen pb-24 relative ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <SnowflakeAnimation />

      {/* Hidden Report Templates */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        {/* Dashboard Report */}
        <div ref={reportRef} className={`w-[400px] p-8 space-y-6 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">StudentBudget Pro</h1>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
          <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl">
             <h2 className="text-4xl font-bold mt-1">₹{stats.balance.toFixed(2)}</h2>
             <p className="text-xs opacity-70 mt-1">Net Balance</p>
          </div>
        </div>

        {/* History Report */}
        <div ref={historyReportRef} className={`w-[500px] p-10 space-y-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
          <div className="flex items-center justify-between border-b pb-6 border-gray-100 dark:border-slate-800">
            <div>
              <h1 className="text-2xl font-black text-indigo-600">StudentBudget Pro</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Transaction History</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase">{format(new Date(), 'MMMM dd, yyyy')}</p>
              {filterMonth !== 'all' && isValid(parseISO(filterMonth)) && (
                <p className="text-xs font-black text-indigo-500">{format(parseISO(filterMonth), 'MMMM yyyy')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Income</p>
              <p className="text-lg font-black text-emerald-600">₹{filteredStats.income.toFixed(0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Expense</p>
              <p className="text-lg font-black text-rose-600">₹{filteredStats.expense.toFixed(0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Net</p>
              <p className="text-lg font-black text-indigo-600">₹{filteredStats.balance.toFixed(0)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTransactions.slice(0, 15).map(t => {
              const cat = getCategoryById(t.category);
              return (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {getIcon(cat.iconName)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{t.description}</p>
                      <p className="text-[10px] text-gray-400">{format(parseISO(t.date), 'MMM dd')}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
            {filteredTransactions.length > 15 && (
              <p className="text-center text-[10px] text-gray-400 italic pt-2">+ {filteredTransactions.length - 15} more transactions</p>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Generated via StudentBudget Pro</p>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold">BudgetPro</h1></div>
        <div className="flex items-center gap-2">
          {activeTab === 'dashboard' ? (
            <button onClick={handleShareReport} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-indigo-600 transition-transform active:scale-90" aria-label="Share Dashboard Report"><Share2 className="w-5 h-5" /></button>
          ) : activeTab === 'history' ? (
            <button onClick={handleShareHistory} className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 transition-transform active:scale-90" aria-label="Share Transaction History"><Share className="w-5 h-5" /></button>
          ) : null}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-slate-600" aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 relative z-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className={`p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20`}>
              <p className="text-indigo-100 text-sm font-medium">Monthly Budget Remaining</p>
              <div className="flex items-end justify-between mt-1">
                <h2 className="text-3xl font-bold">₹{stats.remainingBudget.toFixed(2)}</h2>
                <div className="text-right">
                  <div className="w-32 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min((stats.totalExpense / monthlyBudget) * 100, 100)}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                <div><p className="text-xs text-gray-500">Income</p><p className="font-bold">₹{stats.totalIncome.toFixed(0)}</p></div>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
                <div><p className="text-xs text-gray-500">Expenses</p><p className="font-bold">₹{stats.totalExpense.toFixed(0)}</p></div>
              </div>
            </div>

            {/* Expense Breakdown Pie Chart */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Expense Breakdown (Current Month)</h3>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`₹${value.toFixed(0)}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-6 text-gray-400">No expenses this month for breakdown.</div>
              )}
            </div>

            {/* Monthly Spending Bar Chart */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Last 6 Months Spending</h3>
              {barChartData.some(d => d.expenses > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                    <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#cbd5e1' : '#64748b', fontSize: 10 }} />
                    <YAxis tickFormatter={(value) => `₹${value.toFixed(0)}`} tick={{ fill: isDarkMode ? '#cbd5e1' : '#64748b', fontSize: 10 }} />
                    <Tooltip formatter={(value) => `₹${value.toFixed(0)}`} />
                    <Bar dataKey="expenses" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-6 text-gray-400">No past spending to display.</div>
              )}
            </div>


            {/* Savings Goals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><PiggyBank className="w-5 h-5 text-indigo-500" /> Savings Goals</h3>
                <button onClick={() => { setEditingGoalId(null); setGoalTitle(''); setGoalTarget(''); setGoalCurrent('0'); setIsGoalModalOpen(true); }} className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 transition-transform active:scale-90" aria-label="Add New Savings Goal"><Plus className="w-4 h-4" /></button>
              </div>
              {savingsGoals.length === 0 ? (
                <div className={`p-6 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-gray-200'} text-center text-gray-400`}>
                  <PiggyBank className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">No goals yet. Start saving!</p>
                  <button onClick={() => { setEditingGoalId(null); setGoalTitle(''); setGoalTarget(''); setGoalCurrent('0'); setIsGoalModalOpen(true); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold active:scale-95 transition-all">Add Goal</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                    <div key={goal.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div><p className="font-bold text-sm">{goal.title}</p><p className="text-xs text-gray-500">₹{goal.currentAmount.toFixed(0)} of ₹{goal.targetAmount.toFixed(0)}</p></div>
                        <button onClick={() => setGoalToDelete(goal.id)} className="p-1.5 rounded-lg text-rose-600" aria-label={`Delete ${goal.title}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="w-full h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden relative" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${progress}%`, backgroundColor: goal.color }}>
                          <span className="text-[10px] font-bold text-white mix-blend-difference">{progress.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            <button onClick={handleOpenAdd} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> Add Transaction
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">History</h2>
              <div className="flex gap-2">
                <button onClick={handleShareHistory} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 transition-colors active:scale-95" aria-label="Share Transaction History">
                  <Share className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors active:scale-95 ${isFilterVisible ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-600'}`} aria-expanded={isFilterVisible}>
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
              </div>
            </div>
            {isFilterVisible && (
              <div className={`p-4 rounded-2xl border mb-4 space-y-4 scale-in ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search descriptions..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} 
                    aria-label="Search transactions"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label htmlFor="filter-month" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Month</label>
                      <div className="relative">
                        <select 
                          id="filter-month"
                          value={filterMonth} 
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                          aria-label="Filter by month"
                        >
                          <option value="all">All Months</option>
                          {availableMonths.map(m => (
                            <option key={m.toISOString()} value={m.toISOString()}>
                              {format(m, 'MMMM yyyy')}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                      <div className="flex gap-1">
                        {(['all', 'income', 'expense'] as const).map(t => (
                          <button 
                            key={t} 
                            onClick={() => setFilterType(t)} 
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${filterType === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800'}`}
                            aria-pressed={filterType === t}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label htmlFor="filter-start-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                      <input 
                        type="date" 
                        id="filter-start-date"
                        value={filterStartDate} 
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                        aria-label="Filter by start date"
                      />
                   </div>
                   <div className="space-y-1">
                      <label htmlFor="filter-end-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                      <input 
                        type="date" 
                        id="filter-end-date"
                        value={filterEndDate} 
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                        aria-label="Filter by end date"
                      />
                   </div>
                </div>

                <button onClick={handleClearFilters} className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <XCircle className="w-4 h-4" /> Clear Filters
                </button>
              </div>
            )}

            {filterSummary && (
              <p className={`text-xs text-gray-500 font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filterSummary}
              </p>
            )}
            
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No transactions found matching your filters.</p>
                  <button onClick={handleClearFilters} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold active:scale-95 transition-all">Clear Filters</button>
                </div>
              ) : (
                filteredTransactions.map(t => {
                  const cat = getCategoryById(t.category);
                  return (
                    <div key={t.id} onClick={() => handleOpenDetail(t)} className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:translate-x-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{getIcon(cat.iconName)}</div>
                        <div>
                          <p className="font-semibold text-sm">{t.description}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-gray-500">{format(parseISO(t.date), 'MMM dd')}</p>
                            {t.receiptImage && <ImageIcon className="w-3 h-3 text-indigo-400" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>₹{t.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold flex items-center gap-2"><Grid className="w-5 h-5 text-indigo-500" /> Categories</h3><button onClick={() => setIsCategoryModalOpen(true)} className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 transition-transform active:scale-90" aria-label="Add New Category"><Plus className="w-4 h-4" /></button></div>
              <div className="space-y-2">
                {categories.filter(c => c.id !== 'cat-income').map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600">{getIcon(cat.iconName)}</div><span className="text-sm font-medium">{cat.name}</span></div>
                    {!cat.isSystem && (<button onClick={() => setCategoryToDelete(cat.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors" aria-label={`Delete ${cat.name}`}><Trash2 className="w-3.5 h-3.5" /></button>)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm'}`}>
              <h3 className="font-semibold mb-2">Monthly Budget Limit</h3>
              <div className="relative"><input type="number" value={monthlyBudget} onChange={(e) => setMonthlyBudget(Number(e.target.value))} className={`w-full p-4 pl-8 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} aria-label="Monthly budget limit" /><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span></div>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay for Sharing */}
      {isSharing && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold tracking-widest text-sm uppercase">Generating Report...</p>
        </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 z-50 px-6 py-3 border-t backdrop-blur-lg flex justify-between items-center ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-gray-200'}`}>
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'}`} aria-label="Dashboard"><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'}`} aria-label="Transaction History"><History className="w-6 h-6" /><span className="text-[10px] font-bold">History</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'}`} aria-label="Settings"><Settings className="w-6 h-6" /><span className="text-[10px] font-bold">Settings</span></button>
      </nav>

      {/* Transaction Detail Modal */}
      {isDetailModalOpen && viewingTransaction && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all scale-in ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="transaction-details-title">
            <div className="flex justify-between items-center mb-6">
              <h2 id="transaction-details-title" className="text-xl font-bold">Transaction Details</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800" aria-label="Close transaction details"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center py-6">
                <span className={`text-4xl font-black ${viewingTransaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {viewingTransaction.type === 'income' ? '+' : '-'}₹{viewingTransaction.amount.toFixed(2)}
                </span>
                <p className={`text-sm font-bold uppercase tracking-widest mt-2 ${viewingTransaction.type === 'income' ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                  {viewingTransaction.type}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Category</p>
                    <p className="font-semibold flex items-center gap-2 text-sm">
                      {getIcon(getCategoryById(viewingTransaction.category).iconName)}
                      {getCategoryById(viewingTransaction.category).name}
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date & Time</p>
                    <p className="font-semibold text-sm">{format(parseISO(viewingTransaction.date), 'MMMM dd, yyyy • hh:mm a')}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Description</p>
                    <p className="font-semibold text-sm">{viewingTransaction.description}</p>
                  </div>
                </div>

                {viewingTransaction.receiptImage && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-2">Receipt Attachment</p>
                    <img src={viewingTransaction.receiptImage} alt="Receipt" className="w-full h-48 object-cover rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-800" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    handleOpenEdit(viewingTransaction);
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                  aria-label="Edit transaction"
                >
                  <Edit2 className="w-5 h-5" /> Edit
                </button>
                <button 
                  onClick={() => {
                    setTransactionToDelete(viewingTransaction.id);
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-rose-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="w-5 h-5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
            <div className="flex justify-between items-center mb-6"><h2 id="transaction-modal-title" className="text-xl font-bold">{editingId ? 'Edit' : 'New Transaction'}</h2><button onClick={() => setIsModalOpen(false)} aria-label="Close transaction form"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl" role="radiogroup" aria-label="Transaction type">
                <button type="button" onClick={() => setType('expense')} className={`py-2 rounded-lg text-sm font-semibold ${type === 'expense' ? 'bg-white dark:bg-slate-700' : 'text-gray-500'}`} aria-checked={type === 'expense'} role="radio">Expense</button>
                <button type="button" onClick={() => { setType('income'); setTransactionCategory('cat-income'); }} className={`py-2 rounded-lg text-sm font-semibold ${type === 'income' ? 'bg-white dark:bg-slate-700' : 'text-gray-500'}`} aria-checked={type === 'income'} role="radio">Income</button>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="amount-input" className="text-xs font-semibold text-gray-400 ml-2 uppercase tracking-wider">Amount (₹)</label>
                <input id="amount-input" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} required aria-required="true" />
              </div>

              {type === 'expense' && (
                <div className="space-y-1">
                  <label htmlFor="category-select" className="text-xs font-semibold text-gray-400 ml-2 uppercase tracking-wider">Category</label>
                  <select id="category-select" value={transactionCategory} onChange={(e) => setTransactionCategory(e.target.value)} className={`w-full p-4 rounded-2xl border appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} aria-label="Select transaction category">
                    {categories.filter(c => c.id !== 'cat-income').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="description-input" className="text-xs font-semibold text-gray-400 ml-2 uppercase tracking-wider">Description</label>
                <input id="description-input" type="text" placeholder="e.g. Lunch at Cafe" value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} aria-label="Transaction description" />
              </div>

              {/* Receipt Image Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 ml-2 uppercase tracking-wider">Receipt Attachment</label>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" aria-label="Upload receipt image" />
                {!receiptImage ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 hover:border-indigo-500 transition-all ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-gray-200 hover:bg-gray-50'}`} aria-label="Attach Receipt Image">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">Attach Receipt Image</span>
                  </button>
                ) : (
                  <div className="relative group">
                    <img src={receiptImage} alt="Receipt" className="w-full h-32 object-cover rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-700" />
                    <button type="button" onClick={() => setReceiptImage(undefined)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity" aria-label="Remove receipt image">
                      <X className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity" aria-label="Change receipt image">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold mt-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> {editingId ? 'Update' : 'Save'} Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xs p-6 rounded-3xl text-center shadow-2xl scale-in ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} role="alertdialog" aria-modal="true" aria-labelledby="save-confirm-title" aria-describedby="save-confirm-description">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 id="save-confirm-title" className="text-lg font-bold mb-2">Save Changes?</h3>
            <p id="save-confirm-description" className="text-sm text-gray-500 mb-6">Are you sure you want to save these changes to your budget?</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleFinalizeSave} 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                Yes, Save
              </button>
              <button 
                onClick={() => setIsSaveConfirmOpen(false)} 
                className="w-full py-3 bg-gray-100 dark:bg-slate-800 rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
            <div className="flex justify-between items-center mb-6"><h2 id="goal-modal-title" className="text-xl font-bold">New Goal</h2><button onClick={() => setIsGoalModalOpen(false)} aria-label="Close new goal form"><X className="w-5 h-5" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); if (!goalTitle || !goalTarget) return; const newGoal: SavingsGoal = { id: crypto.randomUUID(), title: goalTitle, targetAmount: parseFloat(goalTarget), currentAmount: parseFloat(goalCurrent || '0'), color: GOAL_COLORS[savingsGoals.length % GOAL_COLORS.length] }; setSavingsGoals([...savingsGoals, newGoal]); setIsGoalModalOpen(false); }} className="space-y-4">
              <input type="text" placeholder="Goal Title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} required aria-required="true" aria-label="Goal title" />
              <input type="number" placeholder="Target Amount" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} required aria-required="true" aria-label="Target amount" />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Goal</button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <div className="flex justify-between items-center mb-6"><h2 id="category-modal-title" className="text-xl font-bold">New Category</h2><button onClick={() => setIsCategoryModalOpen(false)} aria-label="Close new category form"><X className="w-5 h-5" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); if (!newCatName) return; const newCat: CategoryDefinition = { id: `cat-${crypto.randomUUID()}`, name: newCatName, iconName: newCatIcon }; setCategories([...categories, newCat]); setIsCategoryModalOpen(false); setNewCatName(''); }} className="space-y-4">
              <input type="text" placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`} required aria-required="true" aria-label="Category name" />
              <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded-2xl max-h-48 overflow-y-auto" role="radiogroup" aria-label="Select category icon">
                {ICON_OPTIONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setNewCatIcon(icon)} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${newCatIcon === icon ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`} aria-checked={newCatIcon === icon} role="radio" aria-label={`Select ${icon} icon`}>
                    {getIcon(icon)}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Category</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {(transactionToDelete || goalToDelete || categoryToDelete) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xs p-6 rounded-3xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description">
            <h3 id="delete-confirm-title" className="text-lg font-bold text-center mb-2">Are you sure?</h3>
            <p id="delete-confirm-description" className="text-sm text-center text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { if (transactionToDelete) setTransactions(transactions.filter(t => t.id !== transactionToDelete)); if (goalToDelete) setSavingsGoals(savingsGoals.filter(g => g.id !== goalToDelete)); if (categoryToDelete) { setCategories(categories.filter(c => c.id !== categoryToDelete)); setTransactions(prev => prev.map(t => t.category === categoryToDelete ? { ...t, category: 'cat-other' } : t)); } setTransactionToDelete(null); setGoalToDelete(null); setCategoryToDelete(null); }} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold active:scale-[0.98] transition-all">Delete</button>
              <button onClick={() => { setTransactionToDelete(null); setGoalToDelete(null); setCategoryToDelete(null); }} className="w-full py-3 bg-gray-100 dark:bg-slate-800 rounded-xl font-semibold active:scale-[0.98] transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in {
          animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default App;