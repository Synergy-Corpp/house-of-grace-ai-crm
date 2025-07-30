import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'schedule' | 'condition' | 'event';
  conditions: Record<string, any>;
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface AutomationContext {
  products: any[];
  receipts: any[];
  customers: any[];
  orders: any[];
}

export class AIAutomationEngine {
  private static instance: AIAutomationEngine;
  private automationRules: AutomationRule[] = [];
  private isRunning = false;

  static getInstance(): AIAutomationEngine {
    if (!AIAutomationEngine.instance) {
      AIAutomationEngine.instance = new AIAutomationEngine();
    }
    return AIAutomationEngine.instance;
  }

  // Initialize with default automation rules
  async initialize() {
    this.automationRules = [
      {
        id: 'low-stock-alert',
        name: 'Low Stock Alert System',
        trigger: 'schedule',
        conditions: {
          schedule: 'daily',
          time: '09:00'
        },
        actions: [
          {
            type: 'check_low_stock',
            parameters: { threshold: 10 }
          },
          {
            type: 'send_notification',
            parameters: { 
              type: 'low_stock',
              message: 'Daily low stock check completed'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'daily-sales-report',
        name: 'Daily Sales Summary',
        trigger: 'schedule',
        conditions: {
          schedule: 'daily',
          time: '18:00'
        },
        actions: [
          {
            type: 'generate_sales_report',
            parameters: { period: 'today' }
          },
          {
            type: 'analyze_trends',
            parameters: { days: 7 }
          }
        ],
        enabled: true
      },
      {
        id: 'inventory-reorder',
        name: 'Automatic Reorder Suggestions',
        trigger: 'condition',
        conditions: {
          productStock: { operator: 'lt', value: 5 }
        },
        actions: [
          {
            type: 'suggest_reorder',
            parameters: { multiplier: 2 }
          },
          {
            type: 'log_activity',
            parameters: { 
              action: 'reorder_suggestion',
              priority: 'high'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'customer-engagement',
        name: 'Customer Re-engagement',
        trigger: 'condition',
        conditions: {
          lastPurchase: { operator: 'gt', value: 30, unit: 'days' }
        },
        actions: [
          {
            type: 'identify_inactive_customers',
            parameters: { days: 30 }
          },
          {
            type: 'suggest_promotion',
            parameters: { discount: 10 }
          }
        ],
        enabled: true
      },
      {
        id: 'performance-optimization',
        name: 'Performance Analytics',
        trigger: 'schedule',
        conditions: {
          schedule: 'weekly',
          day: 'monday',
          time: '08:00'
        },
        actions: [
          {
            type: 'analyze_performance',
            parameters: { period: 'week' }
          },
          {
            type: 'generate_insights',
            parameters: { includeRecommendations: true }
          }
        ],
        enabled: true
      }
    ];

    // Start the automation engine
    this.startEngine();
  }

  // Start the automation engine
  startEngine() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 AI Automation Engine started');
    
    // Check automations every minute
    setInterval(() => {
      this.processAutomations();
    }, 60000);

    // Initial check
    this.processAutomations();
  }

  // Process all automation rules
  async processAutomations() {
    const context = await this.getBusinessContext();
    
    for (const rule of this.automationRules) {
      if (!rule.enabled) continue;
      
      try {
        const shouldExecute = await this.evaluateRule(rule, context);
        if (shouldExecute) {
          await this.executeRule(rule, context);
          rule.lastRun = new Date();
          console.log(`✅ Executed automation: ${rule.name}`);
        }
      } catch (error) {
        console.error(`❌ Automation error for ${rule.name}:`, error);
      }
    }
  }

  // Get current business context
  async getBusinessContext(): Promise<AutomationContext> {
    const [productsRes, receiptsRes, customersRes, ordersRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('customers').select('*'),
      supabase.from('orders').select('*')
    ]);

    return {
      products: productsRes.data || [],
      receipts: receiptsRes.data || [],
      customers: customersRes.data || [],
      orders: ordersRes.data || []
    };
  }

  // Evaluate if a rule should be executed
  async evaluateRule(rule: AutomationRule, context: AutomationContext): Promise<boolean> {
    const now = new Date();
    
    switch (rule.trigger) {
      case 'schedule':
        return this.evaluateScheduleTrigger(rule, now);
      case 'condition':
        return this.evaluateConditionTrigger(rule, context);
      case 'event':
        return this.evaluateEventTrigger(rule, context);
      default:
        return false;
    }
  }

  // Evaluate schedule-based triggers
  private evaluateScheduleTrigger(rule: AutomationRule, now: Date): boolean {
    const { schedule, time, day } = rule.conditions;
    const lastRun = rule.lastRun;
    
    // Parse time
    const [hours, minutes] = time.split(':').map(Number);
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);
    
    switch (schedule) {
      case 'daily':
        // Run if it's past the target time and hasn't run today
        if (now >= targetTime) {
          if (!lastRun) return true;
          const lastRunDate = new Date(lastRun).toDateString();
          const todayDate = now.toDateString();
          return lastRunDate !== todayDate;
        }
        return false;
        
      case 'weekly':
        // Run if it's the right day and time, and hasn't run this week
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayDay = dayNames[now.getDay()];
        
        if (todayDay === day && now >= targetTime) {
          if (!lastRun) return true;
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return new Date(lastRun) < weekAgo;
        }
        return false;
        
      default:
        return false;
    }
  }

  // Evaluate condition-based triggers
  private evaluateConditionTrigger(rule: AutomationRule, context: AutomationContext): boolean {
    const conditions = rule.conditions;
    
    // Check product stock conditions
    if (conditions.productStock) {
      const { operator, value } = conditions.productStock;
      const lowStockProducts = context.products.filter(p => {
        switch (operator) {
          case 'lt': return p.quantity < value;
          case 'lte': return p.quantity <= value;
          case 'gt': return p.quantity > value;
          case 'gte': return p.quantity >= value;
          case 'eq': return p.quantity === value;
          default: return false;
        }
      });
      
      return lowStockProducts.length > 0;
    }
    
    // Check customer activity conditions
    if (conditions.lastPurchase) {
      const { operator, value, unit } = conditions.lastPurchase;
      const cutoffDate = new Date();
      
      if (unit === 'days') {
        cutoffDate.setDate(cutoffDate.getDate() - value);
      }
      
      const inactiveCustomers = context.customers.filter(customer => {
        const customerReceipts = context.receipts.filter(r => r.customer_name === customer.name);
        if (customerReceipts.length === 0) return true;
        
        const lastPurchase = new Date(Math.max(...customerReceipts.map(r => new Date(r.created_at).getTime())));
        
        switch (operator) {
          case 'gt': return lastPurchase < cutoffDate;
          case 'lt': return lastPurchase > cutoffDate;
          default: return false;
        }
      });
      
      return inactiveCustomers.length > 0;
    }
    
    return false;
  }

  // Evaluate event-based triggers (placeholder)
  private evaluateEventTrigger(rule: AutomationRule, context: AutomationContext): boolean {
    // This would be implemented based on specific events
    return false;
  }

  // Execute automation rule actions
  async executeRule(rule: AutomationRule, context: AutomationContext) {
    for (const action of rule.actions) {
      await this.executeAction(action, context, rule);
    }
  }

  // Execute individual actions
  async executeAction(
    action: { type: string; parameters: Record<string, any> }, 
    context: AutomationContext, 
    rule: AutomationRule
  ) {
    switch (action.type) {
      case 'check_low_stock':
        await this.checkLowStock(action.parameters, context);
        break;
        
      case 'send_notification':
        await this.sendNotification(action.parameters, context);
        break;
        
      case 'generate_sales_report':
        await this.generateSalesReport(action.parameters, context);
        break;
        
      case 'analyze_trends':
        await this.analyzeTrends(action.parameters, context);
        break;
        
      case 'suggest_reorder':
        await this.suggestReorder(action.parameters, context);
        break;
        
      case 'log_activity':
        await this.logActivity(action.parameters, rule);
        break;
        
      case 'identify_inactive_customers':
        await this.identifyInactiveCustomers(action.parameters, context);
        break;
        
      case 'suggest_promotion':
        await this.suggestPromotion(action.parameters, context);
        break;
        
      case 'analyze_performance':
        await this.analyzePerformance(action.parameters, context);
        break;
        
      case 'generate_insights':
        await this.generateInsights(action.parameters, context);
        break;
        
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Action implementations
  private async checkLowStock(params: any, context: AutomationContext) {
    const threshold = params.threshold || 10;
    const lowStockItems = context.products.filter(p => p.quantity < threshold);
    
    if (lowStockItems.length > 0) {
      console.log(`📦 Found ${lowStockItems.length} low stock items:`, 
        lowStockItems.map(p => `${p.name}: ${p.quantity}`));
      
      // Create activity log
      await this.logActivity({
        action: 'low_stock_detected',
        details: {
          count: lowStockItems.length,
          items: lowStockItems.map(p => ({ name: p.name, quantity: p.quantity }))
        }
      });
    }
  }

  private async sendNotification(params: any, context: AutomationContext) {
    console.log(`📬 Notification: ${params.message}`);
    // In a real implementation, this would send emails, push notifications, etc.
  }

  private async generateSalesReport(params: any, context: AutomationContext) {
    const period = params.period || 'today';
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const relevantReceipts = context.receipts.filter(r => 
      new Date(r.created_at) >= startDate
    );
    
    const totalRevenue = relevantReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
    
    console.log(`📈 Sales Report (${period}): ${relevantReceipts.length} sales, ₦${totalRevenue.toLocaleString()} revenue`);
    
    await this.logActivity({
      action: 'automated_sales_report',
      details: {
        period,
        salesCount: relevantReceipts.length,
        totalRevenue
      }
    });
  }

  private async analyzeTrends(params: any, context: AutomationContext) {
    const days = params.days || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSales = context.receipts.filter(r => 
      new Date(r.created_at) >= cutoffDate
    );
    
    const dailyAverages = this.calculateDailyAverages(recentSales);
    const trend = dailyAverages.length > 1 ? 
      (dailyAverages[dailyAverages.length - 1] > dailyAverages[0] ? 'growing' : 'declining') : 'stable';
    
    console.log(`📊 Trend Analysis: Sales are ${trend} over the last ${days} days`);
    
    await this.logActivity({
      action: 'automated_trend_analysis',
      details: {
        period: `${days} days`,
        trend,
        averageDailySales: dailyAverages.reduce((sum, avg) => sum + avg, 0) / dailyAverages.length
      }
    });
  }

  private async suggestReorder(params: any, context: AutomationContext) {
    const multiplier = params.multiplier || 2;
    const lowStockItems = context.products.filter(p => p.quantity < 5);
    
    const suggestions = lowStockItems.map(product => ({
      product: product.name,
      currentStock: product.quantity,
      suggestedOrder: Math.max(10, product.quantity * multiplier),
      priority: product.quantity === 0 ? 'urgent' : 'high'
    }));
    
    if (suggestions.length > 0) {
      console.log(`🔄 Reorder Suggestions:`, suggestions);
      
      await this.logActivity({
        action: 'automated_reorder_suggestions',
        details: { suggestions }
      });
    }
  }

  private async identifyInactiveCustomers(params: any, context: AutomationContext) {
    const days = params.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const inactiveCustomers = context.customers.filter(customer => {
      const customerReceipts = context.receipts.filter(r => r.customer_name === customer.name);
      if (customerReceipts.length === 0) return true;
      
      const lastPurchase = new Date(Math.max(...customerReceipts.map(r => new Date(r.created_at).getTime())));
      return lastPurchase < cutoffDate;
    });
    
    console.log(`👥 Identified ${inactiveCustomers.length} inactive customers (${days}+ days)`);
    
    await this.logActivity({
      action: 'inactive_customers_identified',
      details: {
        count: inactiveCustomers.length,
        threshold: `${days} days`
      }
    });
  }

  private async suggestPromotion(params: any, context: AutomationContext) {
    const discount = params.discount || 10;
    console.log(`🎯 Suggested promotion: ${discount}% discount for inactive customers`);
    
    await this.logActivity({
      action: 'promotion_suggested',
      details: { discount, target: 'inactive_customers' }
    });
  }

  private async analyzePerformance(params: any, context: AutomationContext) {
    const period = params.period || 'week';
    
    // Calculate key performance metrics
    const totalRevenue = context.receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalProducts = context.products.length;
    const totalCustomers = context.customers.length;
    const lowStockCount = context.products.filter(p => p.quantity < 10).length;
    
    console.log(`⚡ Performance Analysis (${period}):`, {
      revenue: totalRevenue,
      products: totalProducts,
      customers: totalCustomers,
      lowStockItems: lowStockCount
    });
    
    await this.logActivity({
      action: 'automated_performance_analysis',
      details: {
        period,
        metrics: { totalRevenue, totalProducts, totalCustomers, lowStockCount }
      }
    });
  }

  private async generateInsights(params: any, context: AutomationContext) {
    const includeRecommendations = params.includeRecommendations || false;
    
    const insights = [
      `📊 Business has ${context.products.length} products across ${this.getUniqueCategories(context.products)} categories`,
      `💰 Total revenue from recent transactions: ₦${context.receipts.reduce((sum, r) => sum + (r.total || 0), 0).toLocaleString()}`,
      `👥 Customer base: ${context.customers.length} registered customers`,
      `⚠️ ${context.products.filter(p => p.quantity < 10).length} products need restocking`
    ];
    
    if (includeRecommendations) {
      insights.push(
        `🎯 Focus on restocking low inventory items`,
        `📈 Consider promotional campaigns for inactive customers`,
        `🔍 Monitor sales trends for seasonal patterns`
      );
    }
    
    console.log(`💡 Business Insights Generated:`, insights);
    
    await this.logActivity({
      action: 'automated_insights_generated',
      details: { insights, includeRecommendations }
    });
  }

  private async logActivity(params: any, rule?: AutomationRule) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          user_email: userData.user.email || 'system@ai-automation',
          action: params.action || 'automated_task',
          entity_type: 'ai_automation',
          entity_name: rule?.name || 'AI Automation System',
          details: params.details || params
        });
      }
    } catch (error) {
      console.error('Failed to log automation activity:', error);
    }
  }

  // Helper methods
  private calculateDailyAverages(receipts: any[]): number[] {
    const dailyCounts: Record<string, number> = {};
    
    receipts.forEach(r => {
      const date = new Date(r.created_at).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    return Object.values(dailyCounts);
  }

  private getUniqueCategories(products: any[]): number {
    const categories = new Set(products.map(p => p.category || 'Uncategorized'));
    return categories.size;
  }

  // Management methods
  getAutomationRules(): AutomationRule[] {
    return this.automationRules;
  }

  enableRule(ruleId: string) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
      console.log(`✅ Enabled automation: ${rule.name}`);
    }
  }

  disableRule(ruleId: string) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
      console.log(`❌ Disabled automation: ${rule.name}`);
    }
  }

  addCustomRule(rule: Omit<AutomationRule, 'id'>) {
    const newRule: AutomationRule = {
      ...rule,
      id: `custom-${Date.now()}`
    };
    this.automationRules.push(newRule);
    console.log(`➕ Added custom automation: ${rule.name}`);
  }
}

// Export singleton instance
export const aiAutomation = AIAutomationEngine.getInstance();