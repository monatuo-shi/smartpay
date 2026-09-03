/**
 * charts.js - 負責支出分類佔比甜甜圈圖渲染
 */

let categoryChartInstance = null;

const Charts = {
  // 初始化圖表
  init() {
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif";
    Chart.defaults.color = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
  },

  // 取得當前主題字色
  getTextColor() {
    return document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569';
  },

  // 更新或渲染支出分類佔比圓餅圖
  renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    // 計算各分類支出總和
    const categoryTotals = {};
    let totalExpense = 0;

    transactions.forEach(t => {
      const cat = t.category || '其他支出';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      totalExpense += t.amount;
    });

    const categories = Storage.getCategories();
    const catColorMap = {};
    categories.forEach(c => catColorMap[c.name] = c.color);

    // 依金額由大到小排序
    const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const data = sortedEntries.map(e => e[1]);
    const backgroundColors = labels.map(l => catColorMap[l] || '#64748b');

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    const emptyContainer = document.getElementById('categoryChartEmpty');
    const chartWrapper = document.getElementById('categoryChartWrapper');

    if (labels.length === 0 || totalExpense === 0) {
      if (emptyContainer) emptyContainer.classList.remove('hidden');
      if (chartWrapper) chartWrapper.classList.add('opacity-0');
      return;
    } else {
      if (emptyContainer) emptyContainer.classList.add('hidden');
      if (chartWrapper) chartWrapper.classList.remove('opacity-0');
    }

    // 更新圖表中央總金額
    const centerAmountEl = document.getElementById('chartCenterTotal');
    if (centerAmountEl) {
      centerAmountEl.textContent = 'NT$ ' + totalExpense.toLocaleString('zh-TW');
    }

    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 12,
              color: this.getTextColor(),
              font: { size: 12, weight: '500' }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                return ` ${context.label}: NT$ ${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  // 主題切換時重新渲染
  updateTheme() {
    this.init();
    if (categoryChartInstance) {
      categoryChartInstance.options.plugins.legend.labels.color = this.getTextColor();
      categoryChartInstance.data.datasets[0].borderColor = document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff';
      categoryChartInstance.update();
    }
  }
};
