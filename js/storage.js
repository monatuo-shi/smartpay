/**
 * storage.js - 負責資料存儲 (LocalStorage)、分類、支付方式與資料備份
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'bk_transactions_data',
  CATEGORIES: 'bk_categories_data',
  BUDGET: 'bk_monthly_budget',
  THEME: 'bk_theme_mode',
  INITIALIZED: 'bk_app_has_initialized'
};

// 指定支出分類項目
const DEFAULT_CATEGORIES = [
  { id: 'exp_food', name: '餐食', icon: 'utensils', color: '#f97316' },
  { id: 'exp_drinks', name: '飲料', icon: 'coffee', color: '#06b6d4' },
  { id: 'exp_fuel', name: '油錢', icon: 'fuel', color: '#ef4444' },
  { id: 'exp_parking', name: '停車費', icon: 'circle-parking', color: '#3b82f6' },
  { id: 'exp_shopping', name: '購物', icon: 'shopping-bag', color: '#ec4899' },
  { id: 'exp_entertainment', name: '娛樂', icon: 'gamepad-2', color: '#8b5cf6' },
  { id: 'exp_other', name: '其他支出', icon: 'circle-ellipsis', color: '#64748b' }
];

// 指定支付方式
const PAYMENT_METHODS = [
  '現金',
  '信用卡',
  'LINEPAY',
  '7-11OPENPOINT',
  '全家全盈配'
];

// 初次進入時的範例資料（以當月日期動態產生）
function generateSampleTransactions() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  return [
    {
      id: 'sample-1',
      type: 'expense',
      amount: 150,
      category: '餐食',
      account: 'LINEPAY',
      date: `${year}-${month}-02`,
      note: '午餐便當'
    },
    {
      id: 'sample-2',
      type: 'expense',
      amount: 65,
      category: '飲料',
      account: '7-11OPENPOINT',
      date: `${year}-${month}-03`,
      note: '拿鐵咖啡'
    },
    {
      id: 'sample-3',
      type: 'expense',
      amount: 1200,
      category: '油錢',
      account: '信用卡',
      date: `${year}-${month}-05`,
      note: '加滿 95 無鉛汽油'
    },
    {
      id: 'sample-4',
      type: 'expense',
      amount: 80,
      category: '停車費',
      account: '全家全盈配',
      date: `${year}-${month}-07`,
      note: '市區地下停車場 2 小時'
    },
    {
      id: 'sample-5',
      type: 'expense',
      amount: 650,
      category: '購物',
      account: '信用卡',
      date: `${year}-${month}-10`,
      note: '生活日常用品'
    },
    {
      id: 'sample-6',
      type: 'expense',
      amount: 380,
      category: '娛樂',
      account: 'LINEPAY',
      date: `${year}-${month}-12`,
      note: '週末電影票'
    },
    {
      id: 'sample-7',
      type: 'expense',
      amount: 220,
      category: '餐食',
      account: '現金',
      date: `${year}-${month}-14`,
      note: '晚餐拉麵'
    }
  ];
}

const Storage = {
  // 取得所有支出紀錄
  getTransactions() {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

    // 只有在第一次全新進入時才載入範例資料
    if (!initialized) {
      const initial = generateSampleTransactions();
      this.saveTransactions(initial);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return initial;
    }

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('解析資料失敗', e);
      return [];
    }
  },

  // 儲存所有支出紀錄
  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // 新增一筆支出
  addTransaction(item) {
    const transactions = this.getTransactions();
    const newRecord = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'expense',
      ...item,
      amount: Number(item.amount)
    };
    transactions.unshift(newRecord);
    this.saveTransactions(transactions);
    return newRecord;
  },

  // 刪除指定紀錄
  deleteTransaction(id) {
    let transactions = this.getTransactions();
    transactions = transactions.filter(tx => tx.id !== id);
    this.saveTransactions(transactions);
    return transactions;
  },

  // 編輯指定紀錄
  updateTransaction(id, updatedFields) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...updatedFields,
        type: 'expense',
        amount: Number(updatedFields.amount)
      };
      this.saveTransactions(transactions);
      return transactions[index];
    }
    return null;
  },

  // 取得月預算
  getMonthlyBudget() {
    const budget = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return budget ? Number(budget) : 15000;
  },

  // 設定月預算
  saveMonthlyBudget(amount) {
    localStorage.setItem(STORAGE_KEYS.BUDGET, String(amount));
  },

  // 取得分類清單
  getCategories() {
    return DEFAULT_CATEGORIES;
  },

  // 匯出 JSON 備份檔
  exportJSON() {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      budget: this.getMonthlyBudget()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `支出記帳備份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 匯出 CSV 檔 (Excel 相容 UTF-8 BOM)
  exportCSV() {
    const transactions = this.getTransactions();
    const headers = ['ID', '日期', '分類', '支付方式', '金額', '備註'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.account || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `支出明細_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 匯入 JSON 備份
  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      } else if (Array.isArray(data)) {
        this.saveTransactions(data);
      }
      if (data.budget) {
        this.saveMonthlyBudget(data.budget);
      }
      return { success: true, count: this.getTransactions().length };
    } catch (e) {
      console.error('匯入資料失敗:', e);
      return { success: false, error: e.message };
    }
  },

  // 清空所有資料
  clearAll() {
    this.saveTransactions([]);
  }
};
