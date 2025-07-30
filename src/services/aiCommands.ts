import { supabase } from '@/integrations/supabase/client';

export interface AICommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  action: string;
  parameters: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  message: string;
  data?: any;
  visualizations?: any[];
  followUpSuggestions?: string[];
}

// Intent Recognition Patterns
const INTENT_PATTERNS = {
  // Inventory Management
  ADD_PRODUCT: [
    /add (\d+)?\s*(units?\s*of\s*)?(.+?)\s*to\s*inventory/i,
    /create\s*new\s*product\s*(.+)/i,
    /add\s*(.+?)\s*product/i
  ],
  UPDATE_INVENTORY: [
    /update\s*(.+?)\s*stock\s*to\s*(\d+)/i,
    /set\s*(.+?)\s*quantity\s*to\s*(\d+)/i,
    /change\s*(.+?)\s*inventory\s*to\s*(\d+)/i
  ],
  CHECK_STOCK: [
    /check\s*stock\s*for\s*(.+)/i,
    /inventory\s*level\s*of\s*(.+)/i,
    /how\s*many\s*(.+?)\s*do\s*we\s*have/i
  ],
  LOW_STOCK_ALERT: [
    /show\s*low\s*stock\s*items/i,
    /products\s*running\s*low/i,
    /inventory\s*alerts/i
  ],
  
  // Customer Management
  CREATE_CUSTOMER: [
    /add\s*new\s*customer\s*(.+)/i,
    /register\s*customer\s*(.+)/i,
    /create\s*customer\s*profile\s*for\s*(.+)/i
  ],
  FIND_CUSTOMER: [
    /find\s*customer\s*(.+)/i,
    /search\s*for\s*customer\s*(.+)/i,
    /customer\s*details\s*for\s*(.+)/i
  ],
  CUSTOMER_HISTORY: [
    /customer\s*(.+?)\s*purchase\s*history/i,
    /show\s*orders\s*for\s*(.+)/i,
    /(.+?)\s*buying\s*pattern/i
  ],
  
  // Sales & Orders
  CREATE_ORDER: [
    /create\s*order\s*for\s*(.+)/i,
    /new\s*sale\s*for\s*customer\s*(.+)/i,
    /process\s*order\s*(.+)/i
  ],
  CREATE_INVOICE: [
    /generate\s*invoice\s*for\s*(.+)/i,
    /create\s*invoice\s*(.+)/i,
    /bill\s*customer\s*(.+)/i
  ],
  SALES_REPORT: [
    /sales\s*report\s*for\s*(today|yesterday|this\s*week|last\s*week|this\s*month|last\s*month)/i,
    /revenue\s*analysis\s*(.*)/i,
    /show\s*sales\s*data\s*(.*)/i
  ],
  
  // Analytics & Insights
  BUSINESS_INSIGHTS: [
    /business\s*insights/i,
    /performance\s*analysis/i,
    /show\s*me\s*analytics/i,
    /business\s*summary/i
  ],
  TREND_ANALYSIS: [
    /analyze\s*trends\s*for\s*(.+)/i,
    /sales\s*trend\s*of\s*(.+)/i,
    /product\s*performance\s*(.+)/i
  ],
  PREDICTIONS: [
    /predict\s*sales\s*for\s*(.+)/i,
    /forecast\s*demand\s*for\s*(.+)/i,
    /expected\s*revenue\s*(.+)/i
  ],
  
  // Staff Management
  STAFF_PERFORMANCE: [
    /staff\s*performance\s*report/i,
    /employee\s*analytics/i,
    /team\s*productivity/i
  ],
  
  // General Queries
  HELP: [
    /help/i,
    /what\s*can\s*you\s*do/i,
    /available\s*commands/i
  ]
};

// Entity Extraction Helpers
export class AICommandProcessor {
  static parseCommand(input: string): AICommand | null {
    const normalizedInput = input.trim().toLowerCase();
    
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          return {
            intent,
            entities: this.extractEntities(match, intent),
            confidence: this.calculateConfidence(match, pattern),
            action: this.mapIntentToAction(intent),
            parameters: this.extractParameters(match, intent)
          };
        }
      }
    }
    
    return null;
  }
  
  private static extractEntities(match: RegExpMatchArray, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    switch (intent) {
      case 'ADD_PRODUCT':
        if (match[1]) entities.quantity = parseInt(match[1]);
        if (match[3]) entities.productName = match[3].trim();
        break;
      case 'UPDATE_INVENTORY':
        if (match[1]) entities.productName = match[1].trim();
        if (match[2]) entities.quantity = parseInt(match[2]);
        break;
      case 'CHECK_STOCK':
      case 'FIND_CUSTOMER':
      case 'CUSTOMER_HISTORY':
        if (match[1]) entities.searchTerm = match[1].trim();
        break;
      case 'SALES_REPORT':
        if (match[1]) entities.period = match[1].trim();
        break;
    }
    
    return entities;
  }
  
  private static calculateConfidence(match: RegExpMatchArray, pattern: RegExp): number {
    const matchLength = match[0].length;
    const inputLength = match.input?.length || 1;
    return Math.min(0.95, (matchLength / inputLength) + 0.3);
  }
  
  private static mapIntentToAction(intent: string): string {
    const actionMap: Record<string, string> = {
      ADD_PRODUCT: 'createProduct',
      UPDATE_INVENTORY: 'updateInventory',
      CHECK_STOCK: 'checkStock',
      LOW_STOCK_ALERT: 'getLowStockItems',
      CREATE_CUSTOMER: 'createCustomer',
      FIND_CUSTOMER: 'findCustomer',
      CUSTOMER_HISTORY: 'getCustomerHistory',
      CREATE_ORDER: 'createOrder',
      CREATE_INVOICE: 'createInvoice',
      SALES_REPORT: 'generateSalesReport',
      BUSINESS_INSIGHTS: 'getBusinessInsights',
      TREND_ANALYSIS: 'analyzeTrends',
      PREDICTIONS: 'generatePredictions',
      STAFF_PERFORMANCE: 'getStaffPerformance',
      HELP: 'showHelp'
    };
    
    return actionMap[intent] || 'unknown';
  }
  
  private static extractParameters(match: RegExpMatchArray, intent: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract time periods
    if (intent === 'SALES_REPORT' && match[1]) {
      const period = match[1].toLowerCase();
      params.dateRange = this.parseDateRange(period);
    }
    
    return params;
  }
  
  private static parseDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case 'this week':
        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date() };
      case 'last week':
        const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(lastWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'this month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: new Date() };
      case 'last month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      default:
        return { start: today, end: new Date() };
    }
  }
}

// Command Executors
export class AICommandExecutor {
  static async executeCommand(command: AICommand): Promise<AIResponse> {
    try {
      switch (command.action) {
        case 'createProduct':
          return await this.createProduct(command);
        case 'updateInventory':
          return await this.updateInventory(command);
        case 'checkStock':
          return await this.checkStock(command);
        case 'getLowStockItems':
          return await this.getLowStockItems();
        case 'createCustomer':
          return await this.createCustomer(command);
        case 'findCustomer':
          return await this.findCustomer(command);
        case 'getCustomerHistory':
          return await this.getCustomerHistory(command);
        case 'generateSalesReport':
          return await this.generateSalesReport(command);
        case 'getBusinessInsights':
          return await this.getBusinessInsights();
        case 'analyzeTrends':
          return await this.analyzeTrends(command);
        case 'generatePredictions':
          return await this.generatePredictions(command);
        case 'showHelp':
          return this.showHelp();
        default:
          return {
            success: false,
            message: "I'm not sure how to handle that command. Try asking for help to see available commands.",
            followUpSuggestions: ["help", "what can you do", "show business insights"]
          };
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        followUpSuggestions: ["try again", "help"]
      };
    }
  }
  
  private static async createProduct(command: AICommand): Promise<AIResponse> {
    const { productName, quantity = 1 } = command.entities;
    
    if (!productName) {
      return {
        success: false,
        message: "I need a product name to create a new product. Try: 'Add iPhone 15 to inventory'",
        followUpSuggestions: ["add iPhone 15 to inventory", "create new product Samsung Galaxy"]
      };
    }
    
    // Create product in database
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productName,
        quantity: quantity,
        category: 'General', // Default category
        price: 0, // Will need to be updated
        description: `Product created via AI: ${productName}`,
      })
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Failed to create product: ${error.message}`,
        followUpSuggestions: ["try again", "check existing products"]
      };
    }
    
    return {
      success: true,
      message: `✅ Successfully created product "${productName}" with quantity ${quantity}. You may want to update the price and category.`,
      data: data,
      followUpSuggestions: [
        `update ${productName} price to $100`,
        `set ${productName} category to Electronics`,
        "show low stock items"
      ]
    };
  }
  
  private static async updateInventory(command: AICommand): Promise<AIResponse> {
    const { productName, quantity } = command.entities;
    
    if (!productName || quantity === undefined) {
      return {
        success: false,
        message: "I need both product name and quantity. Try: 'Update iPhone stock to 50'",
        followUpSuggestions: ["update iPhone stock to 50", "set Samsung quantity to 25"]
      };
    }
    
    // Find and update product
    const { data: products, error: findError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${productName}%`)
      .limit(1);
    
    if (findError || !products || products.length === 0) {
      return {
        success: false,
        message: `Product "${productName}" not found. Would you like to create it instead?`,
        followUpSuggestions: [`add ${productName} to inventory`, "show all products"]
      };
    }
    
    const product = products[0];
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity })
      .eq('id', product.id);
    
    if (updateError) {
      return {
        success: false,
        message: `Failed to update inventory: ${updateError.message}`,
        followUpSuggestions: ["try again", "check product details"]
      };
    }
    
    const previousQty = product.quantity;
    const change = quantity - previousQty;
    const changeText = change > 0 ? `increased by ${change}` : `decreased by ${Math.abs(change)}`;
    
    return {
      success: true,
      message: `✅ Updated "${product.name}" inventory from ${previousQty} to ${quantity} units (${changeText}).`,
      data: { product, previousQuantity: previousQty, newQuantity: quantity },
      followUpSuggestions: [
        "show low stock items",
        "check stock for other products",
        "generate inventory report"
      ]
    };
  }
  
  private static async checkStock(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    if (!searchTerm) {
      return {
        success: false,
        message: "What product would you like to check stock for?",
        followUpSuggestions: ["check stock for iPhone", "inventory level of Samsung"]
      };
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchTerm}%`);
    
    if (error) {
      return {
        success: false,
        message: `Error checking stock: ${error.message}`,
        followUpSuggestions: ["try again", "show all products"]
      };
    }
    
    if (!products || products.length === 0) {
      return {
        success: false,
        message: `No products found matching "${searchTerm}". Would you like to see all products?`,
        followUpSuggestions: ["show all products", `add ${searchTerm} to inventory`]
      };
    }
    
    const stockInfo = products.map(p => ({
      name: p.name,
      quantity: p.quantity,
      status: p.quantity < 10 ? 'Low Stock' : p.quantity < 50 ? 'Medium Stock' : 'Good Stock',
      category: p.category
    }));
    
    const message = products.length === 1 
      ? `📦 ${products[0].name}: ${products[0].quantity} units in stock (${stockInfo[0].status})`
      : `📦 Found ${products.length} products matching "${searchTerm}":\n${stockInfo.map(s => `• ${s.name}: ${s.quantity} units (${s.status})`).join('\n')}`;
    
    return {
      success: true,
      message,
      data: stockInfo,
      followUpSuggestions: [
        "show low stock items",
        "update inventory levels",
        "generate inventory report"
      ]
    };
  }
  
  private static async getLowStockItems(): Promise<AIResponse> {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .lt('quantity', 10)
      .order('quantity', { ascending: true });
    
    if (error) {
      return {
        success: false,
        message: `Error fetching low stock items: ${error.message}`,
        followUpSuggestions: ["try again", "show all products"]
      };
    }
    
    if (!products || products.length === 0) {
      return {
        success: true,
        message: "🎉 Great news! No products are currently low in stock (below 10 units).",
        followUpSuggestions: ["check all inventory", "generate inventory report"]
      };
    }
    
    const lowStockList = products.map(p => `• ${p.name}: ${p.quantity} units`).join('\n');
    
    return {
      success: true,
      message: `⚠️ Low Stock Alert! ${products.length} products need restocking:\n${lowStockList}`,
      data: products,
      visualizations: [{
        type: 'lowStock',
        data: products.map(p => ({ name: p.name, quantity: p.quantity, category: p.category }))
      }],
      followUpSuggestions: [
        "reorder these products",
        "update inventory levels",
        "set reorder alerts"
      ]
    };
  }
  
  private static async generateSalesReport(command: AICommand): Promise<AIResponse> {
    const { period = 'today', dateRange } = command.parameters;
    
    let query = supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lt('created_at', dateRange.end.toISOString());
    }
    
    const { data: receipts, error } = await query;
    
    if (error) {
      return {
        success: false,
        message: `Error generating sales report: ${error.message}`,
        followUpSuggestions: ["try again", "show business insights"]
      };
    }
    
    if (!receipts || receipts.length === 0) {
      return {
        success: true,
        message: `No sales found for ${period}. Time to boost those numbers! 📈`,
        followUpSuggestions: ["create new order", "check customer activity"]
      };
    }
    
    const totalRevenue = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const averageOrderValue = totalRevenue / receipts.length;
    const topCustomers = this.getTopCustomers(receipts);
    
    return {
      success: true,
      message: `📊 Sales Report for ${period}:\n• Total Sales: ${receipts.length} transactions\n• Revenue: ₦${totalRevenue.toLocaleString()}\n• Average Order: ₦${averageOrderValue.toFixed(2)}\n• Top Customer: ${topCustomers[0] || 'N/A'}`,
      data: {
        totalSales: receipts.length,
        totalRevenue,
        averageOrderValue,
        receipts,
        topCustomers
      },
      visualizations: [{
        type: 'salesChart',
        data: receipts.map(r => ({
          date: r.created_at,
          amount: r.total,
          customer: r.customer_name
        }))
      }],
      followUpSuggestions: [
        "analyze sales trends",
        "customer purchase patterns",
        "predict next month revenue"
      ]
    };
  }
  
  private static async getBusinessInsights(): Promise<AIResponse> {
    // Fetch comprehensive business data
    const [productsRes, receiptsRes, ordersRes, customersRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('orders').select('*'),
      supabase.from('customers').select('*')
    ]);
    
    const products = productsRes.data || [];
    const receipts = receiptsRes.data || [];
    const orders = ordersRes.data || [];
    const customers = customersRes.data || [];
    
    // Calculate key metrics
    const totalRevenue = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const lowStockCount = products.filter(p => p.quantity < 10).length;
    const topCategories = this.getTopCategories(products);
    const recentSales = receipts.filter(r => {
      const receiptDate = new Date(r.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return receiptDate > weekAgo;
    }).length;
    
    const insights = [
      `💰 Total Revenue: ₦${totalRevenue.toLocaleString()}`,
      `📦 Products in Inventory: ${products.length}`,
      `⚠️ Low Stock Items: ${lowStockCount}`,
      `👥 Total Customers: ${customers.length}`,
      `📈 Sales This Week: ${recentSales}`,
      `🏆 Top Category: ${topCategories[0]?.category || 'N/A'} (${topCategories[0]?.count || 0} products)`
    ];
    
    return {
      success: true,
      message: `🎯 Business Insights Dashboard:\n${insights.join('\n')}`,
      data: {
        totalRevenue,
        productCount: products.length,
        lowStockCount,
        customerCount: customers.length,
        recentSales,
        topCategories
      },
      visualizations: [
        {
          type: 'businessOverview',
          data: {
            revenue: totalRevenue,
            products: products.length,
            customers: customers.length,
            lowStock: lowStockCount
          }
        },
        {
          type: 'categoryDistribution',
          data: topCategories
        }
      ],
      followUpSuggestions: [
        "analyze sales trends",
        "show low stock items",
        "predict revenue growth",
        "customer behavior analysis"
      ]
    };
  }
  
  private static showHelp(): AIResponse {
    const commands = [
      "📦 Inventory: 'add 50 units of iPhone to inventory', 'check stock for Samsung', 'show low stock items'",
      "👥 Customers: 'find customer John Doe', 'customer purchase history for Jane'",
      "💰 Sales: 'sales report for this month', 'create invoice for customer ABC'",
      "📊 Analytics: 'business insights', 'analyze trends for iPhone', 'predict revenue'",
      "🔍 General: 'help', 'what can you do'"
    ];
    
    return {
      success: true,
      message: `🤖 AI Assistant Commands:\n\n${commands.join('\n\n')}\n\nJust ask me naturally and I'll understand!`,
      followUpSuggestions: [
        "show business insights",
        "check low stock items",
        "sales report for today"
      ]
    };
  }
  
  // Helper methods
  private static getTopCustomers(receipts: any[]): string[] {
    const customerCounts: Record<string, number> = {};
    receipts.forEach(r => {
      if (r.customer_name) {
        customerCounts[r.customer_name] = (customerCounts[r.customer_name] || 0) + 1;
      }
    });
    
    return Object.entries(customerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  }
  
  private static getTopCategories(products: any[]): Array<{category: string, count: number}> {
    const categoryCounts: Record<string, number> = {};
    products.forEach(p => {
      const category = p.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({category, count}))
      .sort((a, b) => b.count - a.count);
  }
  
  private static async createCustomer(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    if (!searchTerm) {
      return {
        success: false,
        message: "I need customer details to create a new customer profile.",
        followUpSuggestions: ["add customer John Doe", "register customer Jane Smith"]
      };
    }
    
    // Basic customer creation (would need more details in real implementation)
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: searchTerm,
        email: `${searchTerm.toLowerCase().replace(/\s+/g, '')}@example.com`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Failed to create customer: ${error.message}`,
        followUpSuggestions: ["try again", "check existing customers"]
      };
    }
    
    return {
      success: true,
      message: `✅ Created customer profile for "${searchTerm}". You may want to add more details like phone and address.`,
      data: data,
      followUpSuggestions: [
        `find customer ${searchTerm}`,
        "create order for this customer",
        "show all customers"
      ]
    };
  }
  
  private static async findCustomer(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    if (!searchTerm) {
      return {
        success: false,
        message: "Who are you looking for?",
        followUpSuggestions: ["find customer John", "search for customer Jane"]
      };
    }
    
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    
    if (error) {
      return {
        success: false,
        message: `Error finding customer: ${error.message}`,
        followUpSuggestions: ["try again", "show all customers"]
      };
    }
    
    if (!customers || customers.length === 0) {
      return {
        success: false,
        message: `No customers found matching "${searchTerm}". Would you like to create a new customer?`,
        followUpSuggestions: [`add customer ${searchTerm}`, "show all customers"]
      };
    }
    
    const customer = customers[0];
    return {
      success: true,
      message: `👤 Found: ${customer.name}\n📧 Email: ${customer.email}\n📅 Joined: ${new Date(customer.created_at).toLocaleDateString()}`,
      data: customer,
      followUpSuggestions: [
        `${customer.name} purchase history`,
        `create order for ${customer.name}`,
        `generate invoice for ${customer.name}`
      ]
    };
  }
  
  private static async getCustomerHistory(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    if (!searchTerm) {
      return {
        success: false,
        message: "Which customer's history would you like to see?",
        followUpSuggestions: ["John purchase history", "customer history for Jane"]
      };
    }
    
    // Find customer first
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(1);
    
    if (!customers || customers.length === 0) {
      return {
        success: false,
        message: `Customer "${searchTerm}" not found.`,
        followUpSuggestions: [`find customer ${searchTerm}`, "show all customers"]
      };
    }
    
    const customer = customers[0];
    
    // Get purchase history
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('customer_name', customer.name)
      .order('created_at', { ascending: false });
    
    if (error) {
      return {
        success: false,
        message: `Error fetching purchase history: ${error.message}`,
        followUpSuggestions: ["try again"]
      };
    }
    
    if (!receipts || receipts.length === 0) {
      return {
        success: true,
        message: `${customer.name} hasn't made any purchases yet. Time for their first order! 🎯`,
        followUpSuggestions: [
          `create order for ${customer.name}`,
          "show popular products",
          "business insights"
        ]
      };
    }
    
    const totalSpent = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const lastPurchase = receipts[0];
    
    return {
      success: true,
      message: `📊 ${customer.name}'s Purchase History:\n• Total Orders: ${receipts.length}\n• Total Spent: ₦${totalSpent.toLocaleString()}\n• Last Purchase: ${new Date(lastPurchase.created_at).toLocaleDateString()} (₦${lastPurchase.total})`,
      data: {
        customer,
        receipts,
        totalSpent,
        totalOrders: receipts.length
      },
      visualizations: [{
        type: 'customerHistory',
        data: receipts.map(r => ({
          date: r.created_at,
          amount: r.total,
          items: r.items
        }))
      }],
      followUpSuggestions: [
        `create new order for ${customer.name}`,
        "analyze customer trends",
        "show top customers"
      ]
    };
  }
  
  private static async analyzeTrends(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    // Get recent sales data
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      return {
        success: false,
        message: `Error analyzing trends: ${error.message}`,
        followUpSuggestions: ["try again", "business insights"]
      };
    }
    
    if (!receipts || receipts.length === 0) {
      return {
        success: true,
        message: "Not enough sales data to analyze trends yet. Let's focus on making more sales! 📈",
        followUpSuggestions: ["create new order", "business insights"]
      };
    }
    
    // Analyze trends by time periods
    const last7Days = this.getRecentSales(receipts, 7);
    const previous7Days = this.getRecentSales(receipts, 14, 7);
    
    const weeklyGrowth = last7Days.length > 0 && previous7Days.length > 0
      ? ((last7Days.length - previous7Days.length) / previous7Days.length * 100)
      : 0;
    
    const trendDirection = weeklyGrowth > 0 ? '📈 Growing' : weeklyGrowth < 0 ? '📉 Declining' : '➡️ Stable';
    
    return {
      success: true,
      message: `📊 Sales Trend Analysis:\n• Last 7 days: ${last7Days.length} sales\n• Previous 7 days: ${previous7Days.length} sales\n• Trend: ${trendDirection} (${weeklyGrowth.toFixed(1)}%)`,
      data: {
        last7Days: last7Days.length,
        previous7Days: previous7Days.length,
        weeklyGrowth,
        trendDirection
      },
      visualizations: [{
        type: 'trendChart',
        data: receipts.slice(0, 30).map(r => ({
          date: r.created_at,
          amount: r.total
        }))
      }],
      followUpSuggestions: [
        "predict next month sales",
        "analyze customer behavior",
        "optimize inventory levels"
      ]
    };
  }
  
  private static async generatePredictions(command: AICommand): Promise<AIResponse> {
    const { searchTerm } = command.entities;
    
    // Get historical data for predictions
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(90); // Last 90 days
    
    if (error || !receipts || receipts.length < 10) {
      return {
        success: false,
        message: "Need more historical data (at least 10 sales) for accurate predictions.",
        followUpSuggestions: ["business insights", "sales report for this month"]
      };
    }
    
    // Simple trend-based prediction
    const dailyAverages = this.calculateDailyAverages(receipts);
    const weeklyAverage = dailyAverages.reduce((sum, avg) => sum + avg, 0) / dailyAverages.length;
    
    const predictedDailySales = Math.round(weeklyAverage);
    const predictedMonthlySales = predictedDailySales * 30;
    const predictedMonthlyRevenue = receipts.slice(0, 30).reduce((sum, r) => sum + (r.total || 0), 0) / 30 * 30;
    
    return {
      success: true,
      message: `🔮 Sales Predictions:\n• Expected daily sales: ${predictedDailySales} transactions\n• Predicted monthly sales: ${predictedMonthlySales} transactions\n• Estimated monthly revenue: ₦${predictedMonthlyRevenue.toLocaleString()}`,
      data: {
        predictedDailySales,
        predictedMonthlySales,
        predictedMonthlyRevenue,
        confidence: receipts.length > 30 ? 'High' : 'Medium'
      },
      visualizations: [{
        type: 'predictionChart',
        data: {
          historical: dailyAverages,
          predictions: Array(7).fill(predictedDailySales)
        }
      }],
      followUpSuggestions: [
        "optimize inventory for predicted demand",
        "plan marketing campaigns",
        "analyze seasonal trends"
      ]
    };
  }
  
  private static async getStaffPerformance(): Promise<AIResponse> {
    // This would integrate with staff management data
    return {
      success: true,
      message: "🏆 Staff Performance Dashboard:\n• Feature coming soon!\n• Will show sales by staff member, productivity metrics, and performance insights.",
      followUpSuggestions: [
        "business insights",
        "sales report for today",
        "manage staff roles"
      ]
    };
  }
  
  // Helper methods for trend analysis
  private static getRecentSales(receipts: any[], days: number, offset: number = 0): any[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days + offset) * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    
    return receipts.filter(r => {
      const receiptDate = new Date(r.created_at);
      return receiptDate >= startDate && receiptDate < endDate;
    });
  }
  
  private static calculateDailyAverages(receipts: any[]): number[] {
    const dailyCounts: Record<string, number> = {};
    
    receipts.forEach(r => {
      const date = new Date(r.created_at).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    return Object.values(dailyCounts);
  }
}