// Mock data for localhost testing
export const mockProducts = [
  { id: '1', name: 'iPhone 15', quantity: 5, category: 'Electronics', price: 999, created_at: '2024-01-15' },
  { id: '2', name: 'Samsung Galaxy S24', quantity: 15, category: 'Electronics', price: 899, created_at: '2024-01-10' },
  { id: '3', name: 'MacBook Pro', quantity: 3, category: 'Computers', price: 1999, created_at: '2024-01-05' },
  { id: '4', name: 'AirPods Pro', quantity: 25, category: 'Accessories', price: 249, created_at: '2024-01-20' },
  { id: '5', name: 'iPad Air', quantity: 8, category: 'Tablets', price: 599, created_at: '2024-01-12' }
];

export const mockCustomers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', created_at: '2024-01-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-05' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', created_at: '2024-01-10' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', created_at: '2024-01-15' }
];

export const mockReceipts = [
  { id: '1', customer_name: 'John Doe', total: 999, created_at: '2024-01-20', items: ['iPhone 15'] },
  { id: '2', customer_name: 'Jane Smith', total: 1248, created_at: '2024-01-19', items: ['AirPods Pro'] },
  { id: '3', customer_name: 'Mike Johnson', total: 899, created_at: '2024-01-18', items: ['Samsung Galaxy S24'] },
  { id: '4', customer_name: 'Sarah Wilson', total: 599, created_at: '2024-01-17', items: ['iPad Air'] },
  { id: '5', customer_name: 'John Doe', total: 249, created_at: '2024-01-16', items: ['AirPods Pro'] }
];

export const mockOrders = [
  { id: '1', customer_id: '1', status: 'completed', total: 999, created_at: '2024-01-20' },
  { id: '2', customer_id: '2', status: 'pending', total: 249, created_at: '2024-01-19' },
  { id: '3', customer_id: '3', status: 'completed', total: 899, created_at: '2024-01-18' }
];

// Mock OpenAI response for localhost testing
export const generateMockAIResponse = (message: string): any => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('add') && lowerMessage.includes('inventory')) {
    return {
      response: "✅ I've successfully added the product to your inventory! The item has been created with the specified quantity. You may want to update the price and category details.",
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'product_created',
        data: { productName: 'iPhone 15', quantity: 50, id: 'mock-id' }
      },
      suggestions: [
        "Update iPhone 15 price to $999",
        "Set iPhone 15 category to Electronics",
        "Check current inventory levels"
      ]
    };
  }
  
  if (lowerMessage.includes('low stock') || lowerMessage.includes('stock items')) {
    return {
      response: "⚠️ Low Stock Alert! I found 3 products that need restocking:\n\n• iPhone 15: 5 units\n• MacBook Pro: 3 units\n• iPad Air: 8 units\n\nI recommend reordering these items soon to avoid stockouts.",
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'low_stock_retrieved',
        data: [
          { name: 'iPhone 15', quantity: 5, category: 'Electronics' },
          { name: 'MacBook Pro', quantity: 3, category: 'Computers' },
          { name: 'iPad Air', quantity: 8, category: 'Tablets' }
        ]
      },
      suggestions: [
        "Reorder these products",
        "Set up automatic reorder alerts",
        "Check supplier availability"
      ]
    };
  }
  
  if (lowerMessage.includes('sales report') || lowerMessage.includes('revenue')) {
    return {
      response: "📊 Sales Report for Today:\n\n• Total Sales: 5 transactions\n• Revenue: ₦3,995\n• Average Order: ₦799\n• Top Customer: John Doe (2 purchases)\n\nSales are performing well with steady growth!",
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'sales_report_generated',
        data: {
          totalSales: 5,
          totalRevenue: 3995,
          averageOrder: 799,
          recentSales: mockReceipts.slice(0, 5)
        }
      },
      suggestions: [
        "Analyze weekly trends",
        "Customer purchase patterns",
        "Product performance analysis"
      ]
    };
  }
  
  if (lowerMessage.includes('business insights') || lowerMessage.includes('dashboard')) {
    return {
      response: "🎯 Business Insights Dashboard:\n\n💰 Total Revenue: ₦3,995\n📦 Products in Inventory: 5\n⚠️ Low Stock Items: 3\n👥 Total Customers: 4\n📈 Sales This Week: 5\n🏆 Top Category: Electronics (3 products)\n\nYour business is showing healthy activity with room for inventory optimization!",
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'business_overview',
        data: {
          revenue: 3995,
          products: 5,
          customers: 4,
          lowStock: 3
        }
      },
      suggestions: [
        "Optimize inventory levels",
        "Plan marketing campaigns",
        "Analyze customer behavior"
      ]
    };
  }
  
  if (lowerMessage.includes('check stock') || lowerMessage.includes('stock for')) {
    const productMatch = lowerMessage.match(/stock for (.+)/);
    const productName = productMatch ? productMatch[1] : 'iPhone';
    
    return {
      response: `📦 ${productName}: 15 units in stock (Good Stock)\n\nThis product is well-stocked and ready for sales. Current inventory level is healthy.`,
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'stock_checked',
        data: [{ name: productName, quantity: 15, status: 'Good Stock' }]
      },
      suggestions: [
        "Check other product levels",
        "Set up stock alerts",
        "Review sales velocity"
      ]
    };
  }
  
  if (lowerMessage.includes('create customer') || lowerMessage.includes('add customer')) {
    const nameMatch = lowerMessage.match(/customer (.+)/);
    const customerName = nameMatch ? nameMatch[1] : 'New Customer';
    
    return {
      response: `✅ Created customer profile for "${customerName}". The customer has been added to your database with a default email. You may want to add more details like phone number and address.`,
      commandExecuted: true,
      commandResult: {
        success: true,
        action: 'customer_created',
        data: { name: customerName, id: 'mock-customer-id' }
      },
      suggestions: [
        `Find customer ${customerName}`,
        "Create order for this customer",
        "Update customer details"
      ]
    };
  }
  
  // Default response
  return {
    response: `I understand you want to: "${message}"\n\nIn localhost mode, I can demonstrate the AI interface, but full CRM operations require a Supabase connection. Try these demo commands:\n\n• "Show low stock items"\n• "Sales report for today"\n• "Business insights"\n• "Add 50 iPhone to inventory"\n• "Check stock for Samsung"`,
    commandExecuted: false,
    commandResult: null,
    suggestions: [
      "Show low stock items",
      "Business insights", 
      "Sales report for today"
    ]
  };
};

export const getMockBusinessContext = () => ({
  totalProducts: mockProducts.length,
  totalRevenue: mockReceipts.reduce((sum, r) => sum + r.total, 0),
  totalOrders: mockOrders.length,
  lowStockProducts: mockProducts.filter(p => p.quantity < 10),
  recentActivity: {
    productsAdded: 2,
    recentSales: 5
  },
  topCategories: mockProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
});