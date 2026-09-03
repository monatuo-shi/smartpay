/**
 * app.js - 支出記帳核心應用程式邏輯與 iPhone/行動端最佳化互動
 */

// 全域狀態
const state = {
  currentDate: new Date(),
  selectedCategory: 'all',
  searchQuery: '',
  editingId: null,
  modalCategory: '餐食',
  modalAccount: '現金'
};

// 輔助函式：格式化金額
function formatCurrency(num) {
  return 'NT$ ' + Number(num || 0).toLocaleString('zh-TW');
}

// 輔助函式：顯示通知 Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-rose-600' : 'bg-slate-800');
  toast.className = `flex items-center gap-2 px-4 py-3 text-white text-sm font-medium rounded-2xl shadow-xl animate-modal-pop ${bgClass}`;
  
  const iconName = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
  toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i><span>${message}</span>`;

  container.appendChild(toast);
  lucide.createIcons({ root: toast });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// 頁面初始化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDateSelectors();
  initCategoryButtons();
  initAccountButtons();
  initCategoryFilterTabs();
  initEventListeners();
  Charts.init();
  refreshUI();
});

// 主題切換初始化
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  Charts.updateTheme();
}

// 日期選擇器初始化
function initDateSelectors() {
  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');
  const txDateInput = document.getElementById('txDate');

  const currentYear = state.currentDate.getFullYear();
  const currentMonth = state.currentDate.getMonth() + 1;

  if (yearSelect) {
    yearSelect.innerHTML = '';
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `${y} 年`;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  }

  if (monthSelect) {
    monthSelect.value = String(currentMonth);
  }

  if (txDateInput) {
    txDateInput.value = new Date().toISOString().slice(0, 10);
  }
}

// 產生分類選擇按鈕 (Modal 內)
function initCategoryButtons() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  const categories = Storage.getCategories();
  container.innerHTML = '';

  if (!state.modalCategory && categories.length > 0) {
    state.modalCategory = categories[0].name;
  }

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = state.modalCategory === cat.name;
    
    btn.className = `flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
      isSelected 
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
    }`;
    btn.innerHTML = `<i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4"></i><span>${cat.name}</span>`;
    
    btn.onclick = () => {
      state.modalCategory = cat.name;
      initCategoryButtons();
    };
    container.appendChild(btn);
  });

  lucide.createIcons({ root: container });
}

// 產生支付方式選擇按鈕 (Modal 內)
function initAccountButtons() {
  const container = document.getElementById('accountPills');
  if (!container) return;

  container.innerHTML = '';
  PAYMENT_METHODS.forEach(acc => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = state.modalAccount === acc;
    btn.className = `px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
      isSelected 
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
    }`;
    btn.textContent = acc;
    btn.onclick = () => {
      state.modalAccount = acc;
      initAccountButtons();
    };
    container.appendChild(btn);
  });
}

// 產生主畫面的分類快速過濾標籤
function initCategoryFilterTabs() {
  const container = document.getElementById('categoryFilterTabs');
  if (!container) return;

  const categories = [{ name: '全部', icon: 'layers' }, ...Storage.getCategories()];
  container.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    const isSelected = state.selectedCategory === (cat.name === '全部' ? 'all' : cat.name);
    
    btn.className = `filter-cat-btn shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
      isSelected 
        ? 'bg-indigo-600 text-white shadow-sm' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;
    btn.innerHTML = `<i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i><span>${cat.name}</span>`;

    btn.onclick = () => {
      state.selectedCategory = cat.name === '全部' ? 'all' : cat.name;
      initCategoryFilterTabs();
      renderTransactionsList();
    };
    container.appendChild(btn);
  });

  lucide.createIcons({ root: container });
}

// 綁定事件監聽器
function initEventListeners() {
  // 主題切換
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

  // 日期切換
  document.getElementById('filterYear')?.addEventListener('change', (e) => {
    state.currentDate.setFullYear(Number(e.target.value));
    refreshUI();
  });
  document.getElementById('filterMonth')?.addEventListener('change', (e) => {
    state.currentDate.setMonth(Number(e.target.value) - 1);
    refreshUI();
  });

  document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    updateDateSelects();
    refreshUI();
  });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    updateDateSelects();
    refreshUI();
  });

  // 搜尋
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderTransactionsList();
  });

  // 記帳 Modal 開關
  document.getElementById('openAddModalBtn')?.addEventListener('click', () => openTransactionModal());
  document.getElementById('mobileFloatingAddBtn')?.addEventListener('click', () => openTransactionModal());
  document.getElementById('closeModalBtn')?.addEventListener('click', closeTransactionModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeTransactionModal);
  document.getElementById('transactionForm')?.addEventListener('submit', handleFormSubmit);

  // 預算 Modal 開關
  document.getElementById('openBudgetModalBtn')?.addEventListener('click', openBudgetModal);
  document.getElementById('closeBudgetModalBtn')?.addEventListener('click', closeBudgetModal);
  document.getElementById('cancelBudgetModalBtn')?.addEventListener('click', closeBudgetModal);
  document.getElementById('budgetForm')?.addEventListener('submit', handleBudgetSubmit);

  // 資料管理 Modal
  document.getElementById('openDataModalBtn')?.addEventListener('click', openDataModal);
  document.getElementById('closeDataModalBtn')?.addEventListener('click', closeDataModal);

  // 匯出 CSV / JSON
  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    Storage.exportJSON();
    showToast('已匯出 JSON 備份');
  });
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    Storage.exportCSV();
    showToast('已匯出 CSV 明細');
  });

  // 匯入 JSON
  const jsonFileInput = document.getElementById('jsonFileInput');
  document.getElementById('triggerImportBtn')?.addEventListener('click', () => {
    jsonFileInput?.click();
  });
  jsonFileInput?.addEventListener('change', handleFileImport);

  // 重設範例與清空
  document.getElementById('resetSampleDataBtn')?.addEventListener('click', () => {
    if (confirm('確定要載入預設範例資料嗎？')) {
      Storage.clearAll();
      Storage.getTransactions();
      refreshUI();
      closeDataModal();
      showToast('已重設為範例資料');
    }
  });

  document.getElementById('clearAllDataBtn')?.addEventListener('click', () => {
    if (confirm('確定要清空所有紀錄嗎？此動作無法復原！')) {
      Storage.saveTransactions([]);
      refreshUI();
      closeDataModal();
      showToast('已清空所有紀錄', 'error');
    }
  });
}

function updateDateSelects() {
  const y = state.currentDate.getFullYear();
  const m = state.currentDate.getMonth() + 1;
  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');
  if (yearSelect) yearSelect.value = String(y);
  if (monthSelect) monthSelect.value = String(m);
}

// 刷新全域 UI
function refreshUI() {
  const allTransactions = Storage.getTransactions();
  const currentYear = state.currentDate.getFullYear();
  const currentMonth = state.currentDate.getMonth() + 1;
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // 當月支出篩選
  const currentMonthTransactions = allTransactions.filter(t => t.date && t.date.startsWith(monthPrefix));

  let totalExpense = 0;
  currentMonthTransactions.forEach(t => {
    totalExpense += t.amount;
  });

  // 更新本月總支出
  const totalExpenseEl = document.getElementById('statTotalExpense');
  if (totalExpenseEl) {
    totalExpenseEl.textContent = formatCurrency(totalExpense);
  }

  // 更新預算區塊
  const monthlyBudget = Storage.getMonthlyBudget();
  document.getElementById('budgetTotalDisplay').textContent = formatCurrency(monthlyBudget);
  document.getElementById('budgetSpentDisplay').textContent = formatCurrency(totalExpense);
  
  const remainingBudget = monthlyBudget - totalExpense;
  const remainingEl = document.getElementById('budgetRemainingDisplay');
  remainingEl.textContent = formatCurrency(remainingBudget);
  
  const budgetProgress = monthlyBudget > 0 ? Math.min(Math.round((totalExpense / monthlyBudget) * 100), 100) : 0;
  const budgetProgressBar = document.getElementById('budgetProgressBar');
  const budgetPercentText = document.getElementById('budgetPercentText');
  const budgetStatusBadge = document.getElementById('budgetStatusBadge');

  if (budgetProgressBar) {
    budgetProgressBar.style.width = `${budgetProgress}%`;
    if (totalExpense > monthlyBudget) {
      budgetProgressBar.className = 'h-full rounded-full transition-all duration-500 bg-rose-500';
    } else if (totalExpense / monthlyBudget >= 0.85) {
      budgetProgressBar.className = 'h-full rounded-full transition-all duration-500 bg-amber-500';
    } else {
      budgetProgressBar.className = 'h-full rounded-full transition-all duration-500 bg-indigo-600';
    }
  }

  if (budgetPercentText) {
    budgetPercentText.textContent = `${Math.round((totalExpense / (monthlyBudget || 1)) * 100)}%`;
  }

  if (budgetStatusBadge) {
    if (totalExpense > monthlyBudget) {
      budgetStatusBadge.textContent = '已超支';
      budgetStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    } else if (totalExpense / monthlyBudget >= 0.85) {
      budgetStatusBadge.textContent = '將用盡';
      budgetStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    } else {
      budgetStatusBadge.textContent = '良好';
      budgetStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    }
  }

  // 渲染支出分類佔比圖
  Charts.renderCategoryChart(currentMonthTransactions);

  // 渲染交易明細清單
  renderTransactionsList();
  lucide.createIcons();
}

// 渲染交易列表
function renderTransactionsList() {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  const allTransactions = Storage.getTransactions();
  const currentYear = state.currentDate.getFullYear();
  const currentMonth = state.currentDate.getMonth() + 1;
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  let list = allTransactions.filter(t => t.date && t.date.startsWith(monthPrefix));

  // 分類過濾
  if (state.selectedCategory !== 'all') {
    list = list.filter(t => t.category === state.selectedCategory);
  }

  // 關鍵字搜尋
  if (state.searchQuery) {
    list = list.filter(t => {
      const q = state.searchQuery;
      return (
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        (t.account && t.account.toLowerCase().includes(q))
      );
    });
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  const countBadge = document.getElementById('transactionCountBadge');
  if (countBadge) {
    countBadge.textContent = `${list.length} 筆`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <i data-lucide="receipt" class="w-12 h-12 mb-3 opacity-30"></i>
        <p class="text-sm font-medium">這個月尚無相關支出紀錄</p>
        <button onclick="openTransactionModal()" class="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          + 立即記一筆支出
        </button>
      </div>
    `;
    lucide.createIcons({ root: container });
    return;
  }

  const catMap = {};
  Storage.getCategories().forEach(c => catMap[c.name] = c);

  container.innerHTML = list.map(tx => {
    const catMeta = catMap[tx.category] || { icon: 'circle-ellipsis', color: '#64748b' };

    return `
      <div class="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 shadow-sm transition-all active:scale-[0.99]">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm" style="background-color: ${catMeta.color || '#64748b'}">
            <i data-lucide="${catMeta.icon || 'tag'}" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900 dark:text-white truncate">${tx.category}</span>
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 shrink-0">${tx.account || '現金'}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              <span class="shrink-0">${tx.date.slice(5)}</span>
              ${tx.note ? `<span class="truncate text-slate-500 dark:text-slate-400">• ${tx.note}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            -NT$ ${tx.amount.toLocaleString()}
          </span>
          <div class="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="editTransaction('${tx.id}')" title="編輯" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteTransaction('${tx.id}')" title="刪除" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons({ root: container });
}

// 記帳 Modal
function openTransactionModal(editTx = null) {
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  const modalTitle = document.getElementById('transactionModalTitle');
  if (!modal || !form) return;

  if (editTx) {
    state.editingId = editTx.id;
    if (modalTitle) modalTitle.textContent = '編輯支出';
    state.modalCategory = editTx.category;
    state.modalAccount = editTx.account || '現金';
    document.getElementById('txAmount').value = editTx.amount;
    document.getElementById('txDate').value = editTx.date;
    document.getElementById('txNote').value = editTx.note || '';
  } else {
    state.editingId = null;
    if (modalTitle) modalTitle.textContent = '新增一筆支出';
    form.reset();
    document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
    state.modalCategory = '餐食';
    state.modalAccount = '現金';
  }

  initCategoryButtons();
  initAccountButtons();

  modal.classList.remove('hidden');
  document.getElementById('txAmount')?.focus();
}

function closeTransactionModal() {
  document.getElementById('transactionModal')?.classList.add('hidden');
  state.editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const note = document.getElementById('txNote').value.trim();

  if (!amount || isNaN(amount) || amount <= 0) {
    alert('請輸入大於 0 的支出金額！');
    return;
  }
  if (!date) {
    alert('請選擇日期！');
    return;
  }

  const record = {
    amount: amount,
    category: state.modalCategory || '餐食',
    account: state.modalAccount || '現金',
    date: date,
    note: note
  };

  if (state.editingId) {
    Storage.updateTransaction(state.editingId, record);
    showToast('已更新支出紀錄');
  } else {
    Storage.addTransaction(record);
    showToast('記帳成功！');
  }

  closeTransactionModal();
  refreshUI();
}

window.editTransaction = function(id) {
  const transactions = Storage.getTransactions();
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    openTransactionModal(tx);
  }
};

window.deleteTransaction = function(id) {
  if (confirm('確定要刪除這筆支出嗎？')) {
    Storage.deleteTransaction(id);
    refreshUI();
    showToast('已刪除紀錄', 'error');
  }
};

// 預算設定 Modal
function openBudgetModal() {
  const modal = document.getElementById('budgetModal');
  const input = document.getElementById('budgetAmountInput');
  if (modal && input) {
    input.value = Storage.getMonthlyBudget();
    modal.classList.remove('hidden');
    input.focus();
  }
}

function closeBudgetModal() {
  document.getElementById('budgetModal')?.classList.add('hidden');
}

function handleBudgetSubmit(e) {
  e.preventDefault();
  const val = parseFloat(document.getElementById('budgetAmountInput').value);
  if (isNaN(val) || val < 0) {
    alert('請輸入有效的預算金額');
    return;
  }
  Storage.saveMonthlyBudget(val);
  closeBudgetModal();
  refreshUI();
  showToast('支出預算已更新');
}

// 資料管理 Modal
function openDataModal() {
  document.getElementById('dataModal')?.classList.remove('hidden');
}

function closeDataModal() {
  document.getElementById('dataModal')?.classList.add('hidden');
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = Storage.importJSON(event.target.result);
    if (result.success) {
      refreshUI();
      closeDataModal();
      showToast(`成功還原資料（共 ${result.count} 筆）`);
    } else {
      alert('匯入失敗：' + result.error);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
