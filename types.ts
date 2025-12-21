
export type TransactionType = 'income' | 'expense';

export interface CategoryDefinition {
  id: string;
  name: string;
  iconName: string;
  isSystem?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string; // References CategoryDefinition.id
  type: TransactionType;
  description: string;
  date: string;
  receiptImage?: string; // Base64 encoded image string
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export interface BudgetState {
  transactions: Transaction[];
  categories: CategoryDefinition[];
  monthlyBudget: number;
  isDarkMode: boolean;
  savingsGoals: SavingsGoal[];
}
