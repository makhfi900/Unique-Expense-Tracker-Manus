/**
 * PDF Report Generator for Expense Tracker
 * Generates comprehensive expense analysis reports for management
 *
 * Accessibility Features:
 * - Large fonts for readability (optimized for 68+ year old users)
 * - High contrast colors
 * - Clear section separation
 * - Generous spacing
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './currency';

// Color palette for the report - HIGH CONTRAST for accessibility
const COLORS = {
  primary: [0, 82, 155],          // Dark Blue - high contrast
  secondary: [0, 128, 85],        // Dark Green - high contrast
  danger: [180, 30, 30],          // Dark Red - high contrast
  warning: [180, 95, 0],          // Dark Amber - high contrast
  dark: [20, 30, 45],             // Very dark slate
  light: [245, 247, 250],         // Light background
  text: [30, 40, 55],             // Dark text for readability
  muted: [80, 90, 105],           // Muted but still readable
  white: [255, 255, 255],
};

// Font sizes optimized for older readers (68+ years)
const FONTS = {
  title: 24,           // Large title
  subtitle: 16,        // Section headers
  heading: 14,         // Sub-section headers
  body: 12,            // Main body text
  small: 11,           // Secondary text
  tiny: 10,            // Footer/metadata
  tableHeader: 12,     // Table headers
  tableBody: 11,       // Table content
};

// Spacing for readability
const SPACING = {
  sectionGap: 20,      // Between major sections
  paragraphGap: 10,    // Between paragraphs
  lineHeight: 1.5,     // Line height multiplier
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
 * Optimized for accessibility - suitable for users aged 35-68+
 */
export class ExpenseReportGenerator {
  constructor(data, logoBase64 = null) {
    this.data = data;
    this.logoBase64 = logoBase64;
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.margin = 18; // Slightly larger margins for readability
    this.currentY = this.margin;
  }

  /**
   * Load logo from URL and convert to base64
   */
  static async loadLogo(logoUrl = '/new_logo_capital1.PNG') {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        console.warn('Could not load logo for PDF');
        resolve(null);
      };
      img.src = logoUrl;
    });
  }

  /**
   * Add header to each page with logo and large readable text
   */
  addHeader(title = 'Expense Analysis Report') {
    // Header background - taller for better visibility
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');

    // Add logo if available
    const logoX = this.margin;
    const logoY = 5;
    const logoSize = 35; // Logo size in mm

    if (this.logoBase64) {
      try {
        this.doc.addImage(this.logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }

    // Text position - offset if logo present
    const textX = this.logoBase64 ? logoX + logoSize + 8 : this.margin;

    // Institution name - LARGE for visibility
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(FONTS.title);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Unique Public Graduate College', textX, 18);

    // Subtitle
    this.doc.setFontSize(FONTS.subtitle);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Chichawatni - Financial Management System', textX, 28);

    // Report title - emphasized
    this.doc.setFontSize(FONTS.heading);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, textX, 38);

    // Date on the right - larger font
    this.doc.setFontSize(FONTS.small);
    this.doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.doc.text(dateStr, this.pageWidth - this.margin, 38, { align: 'right' });

    this.currentY = 55;
  }

  /**
   * Add footer to each page - larger text for readability
   */
  addFooter(pageNum, totalPages) {
    // Footer line
    this.doc.setDrawColor(...COLORS.muted);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);

    this.doc.setFontSize(FONTS.tiny);
    this.doc.setTextColor(...COLORS.muted);

    // Page number - centered and larger
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );

    // Confidential notice
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      'CONFIDENTIAL - For Management Use Only',
      this.margin,
      this.pageHeight - 10
    );

    // Institution name on the right
    this.doc.text(
      'Unique Public Graduate College',
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: 'right' }
    );
  }

  /**
   * Add section title - LARGE and clearly visible
   */
  addSectionTitle(title, icon = '') {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin + 10;
    }

    // Section background - taller for emphasis
    this.doc.setFillColor(...COLORS.light);
    this.doc.roundedRect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 16, 2, 2, 'F');

    // Left border accent
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(this.margin, this.currentY - 5, 4, 16, 'F');

    // Section title - LARGE font
    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(FONTS.subtitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${icon} ${title}`.trim(), this.margin + 8, this.currentY + 5);

    this.currentY += SPACING.sectionGap;
  }

  /**
   * Add Executive Summary section - LARGE readable KPIs
   */
  addExecutiveSummary() {
    this.addSectionTitle('Executive Summary');

    const { kpiData, dateRange } = this.data;

    // Period info - LARGER font
    this.doc.setFontSize(FONTS.body);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.dark);

    const periodText = dateRange
      ? `Analysis Period: ${dateRange.startDate} to ${dateRange.endDate}`
      : `Analysis Period: Current Year`;
    this.doc.text(periodText, this.margin, this.currentY);
    this.currentY += 12;

    // KPI Cards - LARGER with better contrast
    const kpis = [
      { label: 'TOTAL SPENDING', value: formatCurrency(kpiData?.totalSpent || 0), color: COLORS.primary },
      { label: 'TRANSACTIONS', value: (kpiData?.totalExpenses || 0).toString(), color: COLORS.secondary },
      { label: 'AVERAGE', value: formatCurrency(kpiData?.averageExpense || 0), color: COLORS.warning },
      { label: 'CATEGORIES', value: `${kpiData?.categoriesUsed || 0} / ${kpiData?.totalCategories || 0}`, color: COLORS.dark },
    ];

    // 2x2 grid for larger cards on A4
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    const cardHeight = 32; // Taller cards

    kpis.forEach((kpi, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = this.margin + (cardWidth + 10) * col;
      const y = this.currentY + (cardHeight + 8) * row;

      // Card background with rounded corners
      this.doc.setFillColor(...kpi.color);
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

      // Label - LARGER
      this.doc.setTextColor(...COLORS.white);
      this.doc.setFontSize(FONTS.small);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.label, x + 6, y + 12);

      // Value - VERY LARGE for readability
      this.doc.setFontSize(FONTS.subtitle);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, x + 6, y + 25);
      this.doc.setFont('helvetica', 'normal');
    });

    this.currentY += (cardHeight + 8) * 2 + SPACING.sectionGap;
  }

  /**
   * Add Category Breakdown section - LARGER readable tables
   */
  addCategoryBreakdown() {
    this.addSectionTitle('Category Breakdown');

    const { categoryBreakdown } = this.data;

    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(FONTS.body);
      this.doc.text('No category data available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const totalSpending = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);

    const tableData = categoryBreakdown.map((cat, index) => {
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
      head: [['#', 'Category', 'Amount', '% of Total', 'Count']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: FONTS.tableHeader,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: FONTS.tableBody,
        cellPadding: 4,
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + SPACING.sectionGap;
  }

  /**
   * Add Burning Points section (highest expense per category) - READABLE
   */
  addBurningPoints() {
    this.addSectionTitle('Highest Expenses by Category');

    const { burningPoints } = this.data;

    if (!burningPoints || burningPoints.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(FONTS.body);
      this.doc.text('No expense data available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const tableData = burningPoints.slice(0, 10).map((bp, index) => {
      let description = 'N/A';
      if (bp.description) {
        description = bp.description.length > 35
          ? bp.description.substring(0, 35) + '...'
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
        fontStyle: 'bold',
        fontSize: FONTS.tableHeader,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: FONTS.tableBody,
        cellPadding: 4,
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245] // Very light red
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 55 },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 28, halign: 'center' }
      }
    });

    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + SPACING.sectionGap;
  }

  /**
   * Add Monthly Trends section - LARGER readable tables
   */
  addMonthlyTrends() {
    this.addSectionTitle('Monthly Spending Trends');

    const { monthlyData } = this.data;

    if (!monthlyData || monthlyData.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(FONTS.body);
      this.doc.text('No monthly trend data available', this.margin, this.currentY);
      this.currentY += 15;
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
      head: [['Month', 'Total Spending', 'Transactions', 'Average']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: FONTS.tableHeader,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: FONTS.tableBody,
        cellPadding: 4,
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + SPACING.sectionGap;
  }

  /**
   * Add Key Insights and Recommendations section - LARGE readable text
   */
  addInsightsSection() {
    this.addSectionTitle('Key Insights & Recommendations');

    const insights = generateInsights(this.data);

    if (insights.length === 0) {
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(FONTS.body);
      this.doc.text('Insufficient data to generate insights', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    insights.forEach((insight, index) => {
      if (this.currentY > this.pageHeight - 70) {
        this.doc.addPage();
        this.currentY = this.margin + 10;
      }

      // Insight type indicator - brighter colors for visibility
      let bgColor, accentColor;
      switch (insight.type) {
        case 'warning':
          bgColor = [255, 250, 235];
          accentColor = COLORS.warning;
          break;
        case 'alert':
          bgColor = [255, 240, 240];
          accentColor = COLORS.danger;
          break;
        case 'success':
          bgColor = [235, 255, 245];
          accentColor = COLORS.secondary;
          break;
        default:
          bgColor = [235, 245, 255];
          accentColor = COLORS.primary;
          break;
      }

      // Calculate text lines with LARGER font
      const maxTextWidth = this.pageWidth - 2 * this.margin - 16;
      const descLines = this.doc.splitTextToSize(insight.description, maxTextWidth);
      const recLines = this.doc.splitTextToSize(`ACTION: ${insight.recommendation}`, maxTextWidth);

      // Dynamic box height with larger fonts
      const titleHeight = 14;
      const descHeight = descLines.length * 7;
      const recHeight = recLines.length * 6;
      const boxHeight = Math.max(45, titleHeight + descHeight + recHeight + 20);

      // Box with accent border
      this.doc.setFillColor(...bgColor);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'F');

      // Left accent bar
      this.doc.setFillColor(...accentColor);
      this.doc.rect(this.margin, this.currentY, 5, boxHeight, 'F');

      // Insight title - LARGER
      this.doc.setFontSize(FONTS.heading);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.dark);
      this.doc.text(`${index + 1}. ${insight.title}`, this.margin + 10, this.currentY + 10);

      // Description - LARGER and readable
      this.doc.setFontSize(FONTS.body);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      let yOffset = this.currentY + 20;
      descLines.forEach((line, lineIndex) => {
        this.doc.text(line, this.margin + 10, yOffset + (lineIndex * 7));
      });

      // Recommendation - emphasized
      this.doc.setFontSize(FONTS.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...accentColor);
      const recStartY = yOffset + (descLines.length * 7) + 5;
      recLines.forEach((line, lineIndex) => {
        this.doc.text(line, this.margin + 10, recStartY + (lineIndex * 6));
      });

      this.currentY += boxHeight + 8;
    });

    this.currentY += SPACING.paragraphGap;
  }

  /**
   * Add Year Comparison section if available - LARGE readable cards
   */
  addYearComparison() {
    const { yearComparison } = this.data;

    if (!yearComparison || !yearComparison.summary) return;

    this.addSectionTitle('Year-over-Year Comparison');

    const { summary, baseYear, compareYear } = yearComparison;

    // Summary cards - 2x2 grid for larger text
    const metrics = [
      {
        label: `${baseYear || 'Base Year'} TOTAL`,
        value: formatCurrency(summary.baseYearTotal || 0),
        color: COLORS.primary
      },
      {
        label: `${compareYear || 'Compare Year'} TOTAL`,
        value: formatCurrency(summary.compareYearTotal || 0),
        color: COLORS.secondary
      },
      {
        label: 'DIFFERENCE',
        value: `${summary.total_difference >= 0 ? '+' : ''}${formatCurrency(summary.total_difference || 0)}`,
        color: summary.total_difference >= 0 ? COLORS.danger : COLORS.secondary
      },
      {
        label: 'CHANGE',
        value: `${summary.total_percentage_change >= 0 ? '+' : ''}${(summary.total_percentage_change || 0).toFixed(1)}%`,
        color: summary.total_percentage_change >= 0 ? COLORS.danger : COLORS.secondary
      },
    ];

    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    const cardHeight = 28;

    metrics.forEach((metric, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = this.margin + (cardWidth + 10) * col;
      const y = this.currentY + (cardHeight + 6) * row;

      // Card with color accent
      this.doc.setFillColor(...COLORS.light);
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

      // Top accent bar
      this.doc.setFillColor(...metric.color);
      this.doc.rect(x, y, cardWidth, 4, 'F');

      // Label - LARGER
      this.doc.setTextColor(...COLORS.muted);
      this.doc.setFontSize(FONTS.small);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metric.label, x + 6, y + 14);

      // Value - LARGE and bold
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(FONTS.subtitle);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.value, x + 6, y + 24);
      this.doc.setFont('helvetica', 'normal');
    });

    this.currentY += (cardHeight + 6) * 2 + SPACING.sectionGap;
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
