
import { GoogleGenAI } from "@google/genai";
// Fixed import: Removed non-existent 'Category' type and kept 'Transaction'
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], monthlyBudget: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const prompt = `
    As a student financial advisor, analyze this monthly budget data:
    - Monthly Savings Goal/Budget: ₹${monthlyBudget}
    - Total Income: ₹${totalIncome}
    - Total Expenses: ₹${totalExpenses}
    - Category Spending: ${JSON.stringify(categoryBreakdown)}
    
    Provide 3-4 specific, actionable, and encouraging pieces of advice for a student in India. 
    Focus on areas where they might be overspending or ways to reach their budget goal.
    Keep the tone friendly and supportive. Return only the advice points in a markdown list format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "No insights available at the moment. Keep tracking your spending!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights. Please try again later.";
  }
};
