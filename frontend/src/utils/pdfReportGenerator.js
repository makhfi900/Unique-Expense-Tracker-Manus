/**
 * PDF Report Generator for Expense Tracker
 * Generates comprehensive expense analysis reports for management
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './currency';

// Color palette for the report
const COLORS = {
  primary: [59, 130, 246],      // Blue
  secondary: [16, 185, 129],    // Green
  danger: [239, 68, 68],        // Red
  warning: [245, 158, 11],      // Amber
  dark: [30, 41, 59],           // Slate dark
  light: [241, 245, 249],       // Slate light
  text: [51, 65, 85],           // Slate text
  muted: [100, 116, 139],       // Slate muted
};

/**
 * Generate optimization insights based on expense data
 */
export const generateInsights = (data) => {
  const insights = [];
  const { categoryBreakdown, monthlyData, kpiData, yearComparison } = data;

  // 1. Top spending category insight
  if (categoryBreakdown && categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    const totalSpending = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);
    // Handle division by zero
    const topPercentage = totalSpending > 0 ? ((topCategory.value / totalSpending) * 100).toFixed(1) : 0;

    if (topPercentage > 30) {
      insights.push({
        type: 'warning',
        title: 'High Category Concentration',
        description: `${topCategory.name} accounts for ${topPercentage}% of total spending. Consider reviewing and diversifying expense allocation.`,
        recommendation: `Review ${topCategory.name} expenses for potential cost optimization opportunities.`
      });
    }
  }

  // 2. Month-over-month trend insight
  if (monthlyData && monthlyData.length >= 2) {
    const recentMonths = monthlyData.slice(-3);
    const avgRecent = recentMonths.reduce((sum, m) => sum + (m.total || m.amount || 0), 0) / recentMonths.length;
    const olderMonths = monthlyData.slice(0, -3);

    if (olderMonths.length > 0) {
      const avgOlder = olderMonths.reduce((sum, m) => sum + (m.total || m.amount || 0), 0) / olderMonths.length;
      // Handle division by zero
      const changePercent = avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder * 100).toFixed(1) : 0;

      if (changePercent > 15) {
        insights.push({
          type: 'alert',
          title: 'Spending Trend Increasing',
          description: `Recent 3-month average spending is ${changePercent}% higher than earlier periods.`,
          recommendation: 'Implement stricter budget controls and review recent high-value expenses.'
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'success',
          title: 'Positive Cost Reduction',
          description: `Recent spending has decreased by ${Math.abs(changePercent)}% compared to earlier periods.`,
          recommendation: 'Continue current cost management practices and document successful strategies.'
        });
      }
    }
  }

  // 3. Category efficiency insights
  if (categoryBreakdown && categoryBreakdown.length > 1) {
    const sortedCategories = [...categoryBreakdown].sort((a, b) => b.value - a.value);
    const topThree = sortedCategories.slice(0, 3);
    const bottomCategories = sortedCategories.slice(-2);

    insights.push({
      type: 'info',
      title: 'Top 3 Expense Categories',
      description: topThree.map((cat, i) => `${i + 1}. ${cat.name}: ${formatCurrency(cat.value)}`).join(', '),
      recommendation: 'Focus cost optimization efforts on these high-impact categories.'
    });
  }

  // 4. Year comparison insights
  if (yearComparison && yearComparison.summary) {
    const { total_difference, total_percentage_change } = yearComparison.summary;
    if (total_percentage_change > 20) {
      insights.push({
        type: 'warning',
        title: 'Significant Year-over-Year Increase',
        description: `Spending has increased by ${total_percentage_change.toFixed(1)}% compared to the previous year.`,
        recommendation: 'Conduct a detailed variance analysis and identify key cost drivers.'
      });
    } else if (total_percentage_change < -10) {
      insights.push({
        type: 'success',
        title: 'Year-over-Year Cost Savings',
        description: `Spending has decreased by ${Math.abs(total_percentage_change).toFixed(1)}% compared to the previous year.`,
        recommendation: 'Document successful cost reduction strategies for future reference.'
      });
    }
  }

  // 5. Expense frequency analysis
  if (kpiData && kpiData.totalExpenses > 0 && kpiData.totalSpent > 0) {
    const avgExpense = kpiData.averageExpense || (kpiData.totalSpent / kpiData.totalExpenses);

    if (avgExpense < 1000) {
      insights.push({
        type: 'info',
        title: 'High Transaction Volume',
        description: `Average expense of ${formatCurrency(avgExpense)} suggests many small transactions.`,
        recommendation: 'Consider consolidating small purchases or negotiating bulk discounts.'
      });
    } else if (avgExpense > 50000) {
      insights.push({
        type: 'info',
        title: 'High-Value Transactions',
        description: `Average expense of ${formatCurrency(avgExpense)} indicates significant individual purchases.`,
        recommendation: 'Ensure proper approval workflows for high-value expenses.'
      });
    }
  }

  return insights;
};

/**
 * Find the burning point (highest single expense) in each category
 */
export const findBurningPoints = (expenses, categories) => {
  const burningPoints = {};

  if (!expenses || !Array.isArray(expenses)) return burningPoints;

  expenses.forEach(expense => {
    const categoryId = expense.category_id || expense.category?.id;
    const categoryName = expense.category?.name || 'Uncategorized';
    const amount = parseFloat(expense.amount) || 0;

    if (!burningPoints[categoryName] || amount > burningPoints[categoryName].amount) {
      burningPoints[categoryName] = {
        amount,
        description: expense.description,
        date: expense.expense_date,
        categoryName
      };
    }
  });

  return Object.values(burningPoints).sort((a, b) => b.amount - a.amount);
};

/**
 * Main PDF Report Generator Class
 */
export class ExpenseReportGenerator {
  constructor(data) {
    this.data = data;
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.margin = 15;
    this.currentY = this.margin;
  }

  /**
   * Add header to each page
   */
  addHeader(title = 'Expense Analysis Report') {
    // Header background
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    // Company/App name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Unique Expense Tracker', this.margin, 15);

    // Report title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(title, this.margin, 25);

    // Date
    this.doc.setFontSize(10);
    this.doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, this.pageWidth - this.margin - 60, 25);

    this.currentY = 45;
  }

  /**
   * Add footer to each page
   */
  addFooter(pageNum, totalPages) {
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
    this.doc.text(
      'Confidential - For Management Use Only',
      this.margin,
      this.pageHeight - 10
    );
  }

  /**
   * Add section title
   */
  addSectionTitle(title, icon = '') {
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin + 10;
    }

    this.doc.setFillColor(...COLORS.light);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 12, 'F');

    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${icon} ${title}`, this.margin + 3, this.currentY + 3);

    this.currentY += 15;
  }

  /**
   * Add Executive Summary section
   */
  addExecutiveSummary() {
    this.addSectionTitle('Executive Summary');

    const { kpiData, dateRange } = this.data;

    // Period info
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.text);

    const periodText = dateRange
      ? `Analysis Period: ${dateRange.startDate} to ${dateRange.endDate}`
      : `Analysis Period: Current Year`;
    this.doc.text(periodText, this.margin, this.currentY);
    this.currentY += 8;

    // KPI Cards
    const kpis = [
      { label: 'Total Spending', value: formatCurrency(kpiData?.totalSpent || 0), color: COLORS.primary },
      { label: 'Total Transactions', value: (kpiData?.totalExpenses || 0).toString(), color: COLORS.secondary },
      { label: 'Average Expense', value: formatCurrency(kpiData?.averageExpense || 0), color: COLORS.warning },
      { label: 'Categories Used', value: `${kpiData?.categoriesUsed || 0} of ${kpiData?.totalCategories || 0}`, color: COLORS.dark },
    ];

    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4;
    const cardHeight = 25;

    kpis.forEach((kpi, index) => {
      const x = this.margin + (cardWidth + 5) * index;

      // Card background
      this.doc.setFillColor(...kpi.color);
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 2, 2, 'F');

      // Card text
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.text(kpi.label, x + 3, this.currentY + 8);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, x + 3, this.currentY + 18);
      this.doc.setFont('helvetica', 'normal');
    });

    this.currentY += cardHeight + 15;
  }

  /**
   * Add Category Breakdown section
   */
  addCategoryBreakdown() {
    this.addSectionTitle('Category Breakdown');

    const { categoryBreakdown } = this.data;

    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(10);
      this.doc.text('No category data available', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const totalSpending = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);

    const tableData = categoryBreakdown.map((cat, index) => {
      // Handle division by zero - if totalSpending is 0, percentage is 0%
      const percentage = totalSpending > 0
        ? ((cat.value / totalSpending) * 100).toFixed(1)
        : '0.0';

      return [
        (index + 1).toString(),
        cat.name,
        formatCurrency(cat.value),
        `${percentage}%`,
        (cat.count || 0).toString()
      ];
    });

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Category', 'Amount', '% of Total', 'Transactions']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      }
    });

    // Access finalY from doc.lastAutoTable (correct jspdf-autotable API)
    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 10;
  }

  /**
   * Add Burning Points section (highest expense per category)
   */
  addBurningPoints() {
    this.addSectionTitle('Category Burning Points (Highest Expenses)');

    const { burningPoints } = this.data;

    if (!burningPoints || burningPoints.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(10);
      this.doc.text('No burning point data available', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const tableData = burningPoints.slice(0, 10).map((bp, index) => {
      // Safely handle description truncation - check for null/undefined first
      let description = 'N/A';
      if (bp.description) {
        description = bp.description.length > 40
          ? bp.description.substring(0, 40) + '...'
          : bp.description;
      }

      return [
        (index + 1).toString(),
        bp.categoryName,
        description,
        formatCurrency(bp.amount),
        bp.date || 'N/A'
      ];
    });

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Category', 'Description', 'Amount', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242] // Light red
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    // Access finalY from doc.lastAutoTable (correct jspdf-autotable API)
    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 10;
  }

  /**
   * Add Monthly Trends section
   */
  addMonthlyTrends() {
    this.addSectionTitle('Monthly Spending Trends');

    const { monthlyData } = this.data;

    if (!monthlyData || monthlyData.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(10);
      this.doc.text('No monthly trend data available', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const tableData = monthlyData.map(month => [
      month.month || month.month_name || month.monthKey || 'N/A',
      formatCurrency(month.total || month.amount || month.total_amount || 0),
      (month.expenses || month.expense_count || 0).toString(),
      formatCurrency((month.total || month.amount || month.total_amount || 0) / (month.expenses || month.expense_count || 1))
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Month', 'Total Spending', 'Transactions', 'Avg per Transaction']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' }
      }
    });

    // Access finalY from doc.lastAutoTable (correct jspdf-autotable API)
    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 10;
  }

  /**
   * Add Key Insights and Recommendations section
   */
  addInsightsSection() {
    this.addSectionTitle('Key Insights & Recommendations');

    const insights = generateInsights(this.data);

    if (insights.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(10);
      this.doc.text('Insufficient data to generate insights', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    insights.forEach((insight, index) => {
      if (this.currentY > this.pageHeight - 60) {
        this.doc.addPage();
        this.currentY = this.margin + 10;
      }

      // Insight type indicator
      let bgColor;
      switch (insight.type) {
        case 'warning': bgColor = [254, 243, 199]; break; // Light amber
        case 'alert': bgColor = [254, 226, 226]; break;   // Light red
        case 'success': bgColor = [209, 250, 229]; break; // Light green
        default: bgColor = [224, 242, 254]; break;        // Light blue
      }

      // Calculate text lines first to determine dynamic box height
      const maxTextWidth = this.pageWidth - 2 * this.margin - 10;
      const descLines = this.doc.splitTextToSize(insight.description, maxTextWidth);
      const recLines = this.doc.splitTextToSize(`Recommendation: ${insight.recommendation}`, maxTextWidth);

      // Calculate dynamic box height: title (10) + description lines (7 each) + recommendation lines (6 each) + padding
      const titleHeight = 10;
      const descHeight = descLines.length * 5;
      const recHeight = recLines.length * 4;
      const boxHeight = Math.max(35, titleHeight + descHeight + recHeight + 15);

      this.doc.setFillColor(...bgColor);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 2, 2, 'F');

      // Insight number
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.dark);
      this.doc.text(`${index + 1}. ${insight.title}`, this.margin + 3, this.currentY + 7);

      // Description - render all lines
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      let yOffset = this.currentY + 14;
      descLines.forEach((line, lineIndex) => {
        this.doc.text(line, this.margin + 3, yOffset + (lineIndex * 5));
      });

      // Recommendation - render all lines
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.muted);
      const recStartY = yOffset + (descLines.length * 5) + 3;
      recLines.forEach((line, lineIndex) => {
        this.doc.text(line, this.margin + 3, recStartY + (lineIndex * 4));
      });

      this.currentY += boxHeight + 5;
    });

    this.currentY += 5;
  }

  /**
   * Add Year Comparison section if available
   */
  addYearComparison() {
    const { yearComparison } = this.data;

    if (!yearComparison || !yearComparison.summary) return;

    this.addSectionTitle('Year-over-Year Comparison');

    const { summary, baseYear, compareYear } = yearComparison;

    // Summary cards
    const metrics = [
      {
        label: `${baseYear} Total`,
        value: formatCurrency(summary.baseYearTotal || 0)
      },
      {
        label: `${compareYear} Total`,
        value: formatCurrency(summary.compareYearTotal || 0)
      },
      {
        label: 'Difference',
        value: `${summary.total_difference >= 0 ? '+' : ''}${formatCurrency(summary.total_difference || 0)}`
      },
      {
        label: 'Change %',
        value: `${summary.total_percentage_change >= 0 ? '+' : ''}${(summary.total_percentage_change || 0).toFixed(1)}%`
      },
    ];

    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4;

    metrics.forEach((metric, index) => {
      const x = this.margin + (cardWidth + 5) * index;

      this.doc.setFillColor(...COLORS.light);
      this.doc.roundedRect(x, this.currentY, cardWidth, 20, 2, 2, 'F');

      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(8);
      this.doc.text(metric.label, x + 3, this.currentY + 7);

      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.value, x + 3, this.currentY + 15);
      this.doc.setFont('helvetica', 'normal');
    });

    this.currentY += 30;
  }

  /**
   * Generate the complete report
   */
  generate() {
    // Page 1: Header and Executive Summary
    this.addHeader();
    this.addExecutiveSummary();
    this.addCategoryBreakdown();

    // Page 2+: Detailed sections
    this.addBurningPoints();
    this.addMonthlyTrends();
    this.addYearComparison();
    this.addInsightsSection();

    // Add page numbers
    const totalPages = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages);
    }

    return this.doc;
  }

  /**
   * Download the PDF
   */
  download(filename = 'expense-report') {
    const doc = this.generate();
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`${filename}-${timestamp}.pdf`);
  }

  /**
   * Get PDF as blob for preview
   */
  getBlob() {
    const doc = this.generate();
    return doc.output('blob');
  }
}

/**
 * Quick function to generate and download report
 */
export const downloadExpenseReport = (data) => {
  const generator = new ExpenseReportGenerator(data);
  generator.download();
};

export default ExpenseReportGenerator;
