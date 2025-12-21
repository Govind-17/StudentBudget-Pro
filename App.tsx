
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Plus, 
  Minus, 
  LayoutDashboard, 
  History, 
  BrainCircuit, 
  Moon, 
  Sun, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  X,
  ChevronRight,
  Trash2,
  Filter,
  Search,
  Calendar,
  Edit2,
  AlertCircle,
  Utensils,
  Home,
  BookOpen,
  Bus,
  Music,
  Banknote,
  CircleEllipsis,
  Download,
  Target,
  Trophy,
  PiggyBank,
  Share2,
  Image as ImageIcon,
  Camera,
  Settings,
  Grid
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import html2canvas from 'html2canvas';
import { Transaction, CategoryDefinition, TransactionType, SavingsGoal } from './types';
import { getFinancialInsights } from './services/geminiService';

// Snowflake Component
const SnowflakeAnimation: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; size: string; duration: string; delay: string; opacity: number }[]>([]);

  useEffect(() => {
    const count = 25;
    const initialSnowflakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      // Reduced size range for smaller snowflakes
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

// Available icons for custom categories
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

const App: React.FC = () => {
  // State management
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
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai'>('dashboard');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [transactionCategory, setTransactionCategory] = useState<string>('cat-food');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('CircleEllipsis');

  const [aiInsights, setAiInsights] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Deletion confirmation state
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // History Filter State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist state to localStorage
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  
  // Theme application
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Derived icon lookup
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.CircleEllipsis;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id) || categories.find(c => c.id === 'cat-other')!;

  // Derived statistics
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const remainingBudget = monthlyBudget - totalExpense;

    return { totalIncome, totalExpense, balance, remainingBudget, currentMonthTransactions };
  }, [transactions, monthlyBudget]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           getCategoryById(t.category).name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      const tDate = parseISO(t.date);
      if (filterStartDate) {
        matchesDate = matchesDate && (isAfter(tDate, startOfDay(parseISO(filterStartDate))) || tDate.getTime() === startOfDay(parseISO(filterStartDate)).getTime());
      }
      if (filterEndDate) {
        matchesDate = matchesDate && (isBefore(tDate, endOfDay(parseISO(filterEndDate))) || tDate.getTime() === endOfDay(parseISO(filterEndDate)).getTime());
      }

      return matchesType && matchesCategory && matchesSearch && matchesDate;
    });
  }, [transactions, filterType, filterCategory, searchQuery, filterStartDate, filterEndDate, categories]);

  const chartData = useMemo(() => {
    return categories
      .filter(c => c.id !== 'cat-income')
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        value: stats.currentMonthTransactions
          .filter(t => t.category === cat.id)
          .reduce((sum, t) => sum + t.amount, 0)
      }))
      .filter(d => d.value > 0);
  }, [stats.currentMonthTransactions, categories]);

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Category Actions
  const handleOpenCategoryModal = (id?: string) => {
    if (id) {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        setEditingCategoryId(id);
        setNewCatName(cat.name);
        setNewCatIcon(cat.iconName);
      }
    } else {
      setEditingCategoryId(null);
      setNewCatName('');
      setNewCatIcon('CircleEllipsis');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    if (editingCategoryId) {
      setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: newCatName, iconName: newCatIcon } : c));
    } else {
      const newCat: CategoryDefinition = { id: `cat-${crypto.randomUUID()}`, name: newCatName, iconName: newCatIcon };
      setCategories([...categories, newCat]);
    }
    setIsCategoryModalOpen(false);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories(categories.filter(c => c.id !== categoryToDelete));
      setTransactions(prev => prev.map(t => t.category === categoryToDelete ? { ...t, category: 'cat-other' } : t));
      setCategoryToDelete(null);
    }
  };

  // Transaction Actions
  const handleOpenAdd = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setType('expense');
    setTransactionCategory('cat-food');
    setReceiptImage(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setType(transaction.type);
    setTransactionCategory(transaction.category);
    setReceiptImage(transaction.receiptImage);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setReceiptImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (editingId) {
      setTransactions(prev => prev.map(t => 
        t.id === editingId 
          ? { ...t, amount: parseFloat(amount), type, category: transactionCategory, description: description || 'No description', receiptImage } 
          : t
      ));
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        type,
        category: transactionCategory,
        description: description || 'No description',
        date: new Date().toISOString(),
        receiptImage
      };
      setTransactions([newTransaction, ...transactions]);
    }

    setAmount('');
    setDescription('');
    setEditingId(null);
    setReceiptImage(undefined);
    setIsModalOpen(false);
  };

  const handleShareReport = async () => {
    if (!reportRef.current) return;
    setIsSharing(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: isDarkMode ? '#020617' : '#f9fafb', scale: 2, logging: false, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `StudentBudget_Report_${format(new Date(), 'MMM_yyyy')}.png`;
      link.click();
    } catch (err) { console.error("Failed to generate report:", err); } 
    finally { setIsSharing(false); }
  };

  // Savings Goal Handlers
  const handleOpenGoalAdd = () => { setEditingGoalId(null); setGoalTitle(''); setGoalTarget(''); setGoalCurrent('0'); setIsGoalModalOpen(true); };
  const handleOpenGoalEdit = (goal: SavingsGoal) => { setEditingGoalId(goal.id); setGoalTitle(goal.title); setGoalTarget(goal.targetAmount.toString()); setGoalCurrent(goal.currentAmount.toString()); setIsGoalModalOpen(true); };
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    if (editingGoalId) {
      setSavingsGoals(prev => prev.map(g => g.id === editingGoalId ? { ...g, title: goalTitle, targetAmount: parseFloat(goalTarget), currentAmount: parseFloat(goalCurrent || '0') } : g));
    } else {
      const newGoal: SavingsGoal = { id: crypto.randomUUID(), title: goalTitle, targetAmount: parseFloat(goalTarget), currentAmount: parseFloat(goalCurrent || '0'), color: GOAL_COLORS[savingsGoals.length % GOAL_COLORS.length] };
      setSavingsGoals([...savingsGoals, newGoal]);
    }
    setIsGoalModalOpen(false);
  };

  const confirmDelete = () => { if (transactionToDelete) { setTransactions(transactions.filter(t => t.id !== transactionToDelete)); setTransactionToDelete(null); } };
  const confirmGoalDelete = () => { if (goalToDelete) { setSavingsGoals(savingsGoals.filter(g => g.id !== goalToDelete)); setGoalToDelete(null); } };
  
  const addFundsToGoal = (id: string, e: React.MouseEvent) => { 
    e.stopPropagation(); 
    const amountStr = prompt("How much would you like to add?"); 
    if (amountStr && !isNaN(parseFloat(amountStr))) { 
      setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + parseFloat(amountStr) } : g)); 
    } 
  };

  const fetchInsights = async () => { setIsAiLoading(true); const insights = await getFinancialInsights(stats.currentMonthTransactions, monthlyBudget); setAiInsights(insights); setIsAiLoading(false); };
  const resetFilters = () => { setFilterType('all'); setFilterCategory('all'); setFilterStartDate(''); setFilterEndDate(''); setSearchQuery(''); };
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = filteredTransactions.map(t => [format(parseISO(t.date), 'yyyy-MM-dd'), t.type, getCategoryById(t.category).name, `"${t.description.replace(/"/g, '""')}"`, t.amount.toFixed(2)]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen pb-24 relative ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* Snowflake Animation */}
      <SnowflakeAnimation />

      {/* Hidden Report Template */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={reportRef} className={`w-[400px] p-8 space-y-6 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold tracking-tight">StudentBudget Pro</h1></div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
          <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl">
             <p className="text-indigo-100 text-sm font-medium">Monthly Summary</p>
             <h2 className="text-4xl font-bold mt-1">₹{stats.balance.toFixed(2)}</h2>
             <p className="text-xs opacity-70 mt-1">Net Balance</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-gray-50'}`}><p className="text-xs text-emerald-500 font-bold uppercase mb-1">Income</p><p className="text-lg font-bold">₹{stats.totalIncome.toFixed(0)}</p></div>
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-gray-50'}`}><p className="text-xs text-rose-500 font-bold uppercase mb-1">Expenses</p><p className="text-lg font-bold">₹{stats.totalExpense.toFixed(0)}</p></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Top Categories</h3>
            {chartData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
                <span className="text-sm font-bold">₹{d.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">BudgetPro</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShareReport} className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-gray-100 text-indigo-600'}`}>
            <Share2 className={`w-5 h-5 ${isSharing ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-100 text-slate-600'}`}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-6 relative z-10">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className={`p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group transition-all`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                <Wallet className="w-24 h-24" />
              </div>
              <p className="text-indigo-100 text-sm font-medium">Monthly Budget Remaining</p>
              <div className="flex items-end justify-between mt-1">
                <h2 className="text-3xl font-bold">₹{stats.remainingBudget.toFixed(2)}</h2>
                <div className="text-right">
                  <p className="text-xs opacity-70">Goal: ₹{monthlyBudget}</p>
                  <div className="w-32 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.totalExpense / monthlyBudget) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                <div><p className="text-xs text-gray-500 dark:text-slate-400">Income</p><p className="font-bold text-emerald-600 dark:text-emerald-400">₹{stats.totalIncome.toFixed(0)}</p></div>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center"><TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>
                <div><p className="text-xs text-gray-500 dark:text-slate-400">Expenses</p><p className="font-bold text-rose-600 dark:text-rose-400">₹{stats.totalExpense.toFixed(0)}</p></div>
              </div>
            </div>

            {/* Savings Goals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><PiggyBank className="w-5 h-5 text-indigo-500" /> Savings Goals</h3>
                <button onClick={handleOpenGoalAdd} className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></button>
              </div>
              {savingsGoals.length === 0 ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 text-center text-gray-400"><p className="text-sm">No savings goals yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                      <div key={goal.id} onClick={() => handleOpenGoalEdit(goal)} className={`p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div><p className="font-bold text-sm">{goal.title}</p><p className="text-xs text-gray-500 dark:text-slate-400">₹{goal.currentAmount} of ₹{goal.targetAmount}</p></div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => addFundsToGoal(goal.id, e)} className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setGoalToDelete(goal.id); }} className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:scale-105 transition-transform"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visualizer */}
            {chartData.length > 0 && (
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'}`}>
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-500">Spending Breakdown</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toFixed(0)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {chartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate opacity-70">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleOpenAdd} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all active:scale-95">
              <Plus className="w-5 h-5" /> Add Transaction
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">History</h2>
              <div className="flex items-center gap-2">
                <button onClick={exportToCSV} disabled={filteredTransactions.length === 0} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filteredTransactions.length > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' : 'opacity-50 cursor-not-allowed text-gray-400'}`}>
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${isFilterVisible || filterType !== 'all' || filterCategory !== 'all' || filterStartDate || filterEndDate ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
              </div>
            </div>

            {isFilterVisible && (
              <div className={`p-4 rounded-2xl border mb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'income', 'expense'] as const).map((t) => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filterType === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{t}</button>
                  ))}
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`w-full p-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button onClick={resetFilters} className="w-full text-center text-xs text-indigo-600 font-medium pt-1">Reset Filters</button>
              </div>
            )}

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p>No records found.</p></div>
            ) : (
              filteredTransactions.map((t) => {
                const cat = getCategoryById(t.category);
                return (
                  <div key={t.id} onClick={() => handleOpenEdit(t)} className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {getIcon(cat.iconName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{t.description}</p>
                          {t.receiptImage && <ImageIcon className="w-3 h-3 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{cat.name} • {format(parseISO(t.date), 'MMM dd')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}</span>
                      <button onClick={(e) => { e.stopPropagation(); setTransactionToDelete(t.id); }} className="p-2 -mr-2 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-indigo-600/20 text-indigo-100' : 'bg-indigo-50 text-indigo-900'} border border-indigo-100 dark:border-indigo-500/20`}>
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><BrainCircuit className="w-6 h-6" /></div><div><h2 className="font-bold">AI Financial Insight</h2><p className="text-xs opacity-70">Powered by Gemini</p></div></div>
              {!aiInsights && !isAiLoading ? (
                <div className="text-center py-4"><p className="text-sm mb-4">Get personalized tips.</p><button onClick={fetchInsights} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/40">Analyze Budget</button></div>
              ) : isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /><p className="text-sm font-medium animate-pulse">Calculating...</p></div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none"><div className="whitespace-pre-wrap leading-relaxed text-sm">{aiInsights}</div><button onClick={fetchInsights} className="mt-6 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Refresh Insights <ChevronRight className="w-3 h-3" /></button></div>
              )}
            </div>

            {/* Custom Categories Section */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Grid className="w-5 h-5 text-indigo-500" /> My Categories</h3>
                <button onClick={() => handleOpenCategoryModal()} className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {categories.filter(c => c.id !== 'cat-income').map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">{getIcon(cat.iconName)}</div>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    {!cat.isSystem && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenCategoryModal(cat.id)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setCategoryToDelete(cat.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'}`}>
              <h3 className="font-semibold mb-2">Set Monthly Budget</h3>
              <div className="relative"><input type="number" value={monthlyBudget} onChange={(e) => setMonthlyBudget(Number(e.target.value))} className={`w-full p-4 pl-8 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} /><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span></div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 px-6 py-3 border-t backdrop-blur-lg flex justify-between items-center ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-gray-200'}`}>
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-medium">Home</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-indigo-600' : 'text-gray-400'}`}><History className="w-6 h-6" /><span className="text-[10px] font-medium">History</span></button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ai' ? 'text-indigo-600' : 'text-gray-400'}`}><Settings className="w-6 h-6" /><span className="text-[10px] font-medium">Settings</span></button>
      </nav>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all duration-300 animate-slide-up ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{editingCategoryId ? 'Edit Category' : 'New Category'}</h2><button onClick={() => setIsCategoryModalOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Category Name</label><input type="text" placeholder="e.g. Subscriptions" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} required /></div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Select Icon</label>
                <div className="grid grid-cols-6 gap-2 h-40 overflow-y-auto no-scrollbar p-1">
                  {ICON_OPTIONS.map(iconName => (
                    <button key={iconName} type="button" onClick={() => setNewCatIcon(iconName)} className={`p-3 rounded-xl flex items-center justify-center transition-all ${newCatIcon === iconName ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                      {getIcon(iconName)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-colors">Save Category</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all duration-300 animate-slide-up ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{editingId ? 'Edit Record' : 'New Transaction'}</h2><button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                <button type="button" onClick={() => { setType('expense'); if (transactionCategory === 'cat-income') setTransactionCategory('cat-food'); }} className={`py-2 rounded-lg text-sm font-semibold transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}>Expense</button>
                <button type="button" onClick={() => { setType('income'); setTransactionCategory('cat-income'); }} className={`py-2 rounded-lg text-sm font-semibold transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}>Income</button>
              </div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Amount</label><div className="relative"><input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full p-4 pl-8 text-2xl font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} required /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span></div></div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Category</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {categories.filter(c => type === 'expense' ? c.id !== 'cat-income' : true).map(cat => (
                    <button key={cat.id} type="button" onClick={() => setTransactionCategory(cat.id)} className={`flex-shrink-0 p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all ${transactionCategory === cat.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                      {getIcon(cat.iconName)}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Description</label><input type="text" placeholder="Note..." value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} /></div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Receipt</label>
                {!receiptImage ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-500 transition-all ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}><Camera className="w-8 h-8" /><span className="text-xs font-medium">Upload Image</span></button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-video border dark:border-slate-800 group"><img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4"><button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full text-slate-900 shadow-lg"><Camera className="w-5 h-5" /></button><button type="button" onClick={() => setReceiptImage(undefined)} className="p-2 bg-rose-600 rounded-full text-white shadow-lg"><Trash2 className="w-5 h-5" /></button></div></div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-colors">Save Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {(transactionToDelete || goalToDelete || categoryToDelete) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xs p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400"><AlertCircle className="w-8 h-8" /></div>
              <div><h3 className="text-lg font-bold">Are you sure?</h3><p className="text-sm text-gray-500 dark:text-slate-400 mt-1">This action cannot be undone.</p></div>
              <div className="flex flex-col w-full gap-2 pt-2">
                <button onClick={() => { if (transactionToDelete) confirmDelete(); else if (goalToDelete) confirmGoalDelete(); else if (categoryToDelete) confirmDeleteCategory(); }} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold transition-all">Delete</button>
                <button onClick={() => { setTransactionToDelete(null); setGoalToDelete(null); setCategoryToDelete(null); }} className={`w-full py-3 rounded-xl font-semibold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 transition-all duration-300 animate-slide-up ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{editingGoalId ? 'Edit Goal' : 'New Savings Goal'}</h2><button onClick={() => setIsGoalModalOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Goal Title</label><input type="text" placeholder="e.g. New Phone" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Target Amount</label><div className="relative"><input type="number" placeholder="0.00" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className={`w-full p-4 pl-8 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} required /><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span></div></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Starting Amount</label><div className="relative"><input type="number" placeholder="0.00" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} className={`w-full p-4 pl-8 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`} /><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span></div></div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Goal</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(15px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-15px);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(15px);
          }
          100% {
            transform: translateY(110vh) rotate(360deg) translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
