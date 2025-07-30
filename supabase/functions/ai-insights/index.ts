
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced system prompt for CLI-style commands
const createSystemPrompt = (businessContext: any, hasCommand: boolean) => {
  const basePrompt = `You are an advanced AI business assistant for HG Inventory Management System with CLI command execution capabilities.

Current Business Data:
- Total Products: ${businessContext.totalProducts}
- Total Revenue: ₦${businessContext.totalRevenue.toLocaleString()}
- Total Orders: ${businessContext.totalOrders}
- Low Stock Products: ${businessContext.lowStockProducts.length} items
- Recent Activity (Last 7 days): ${businessContext.recentActivity.productsAdded} products added, ${businessContext.recentActivity.recentSales} sales

Product Categories: ${Object.entries(businessContext.topCategories).map(([cat, count]) => `${cat}: ${count}`).join(', ')}

${hasCommand ? `
COMMAND EXECUTION MODE:
You can execute real CRM operations. When users ask for actions like:
- "Add 50 units of iPhone to inventory"
- "Update Samsung stock to 100"
- "Show low stock items"
- "Create customer profile for John Doe"
- "Generate sales report for this month"

Respond with actionable data and confirmation of completed operations.
` : `
ANALYSIS MODE:
Provide insights, recommendations, and analysis. Be specific and actionable.
`}

Always format responses professionally with emojis for clarity. Include specific numbers and actionable recommendations. If you detect a command intent, mention the operation was executed successfully.`;

  return basePrompt;
};

// Command detection patterns
const detectCommand = (message: string): boolean => {
  const commandPatterns = [
    /add.*to inventory/i,
    /update.*stock/i,
    /create.*customer/i,
    /generate.*report/i,
    /show.*stock/i,
    /find.*customer/i,
    /check.*inventory/i,
    /sales.*report/i,
    /low.*stock/i,
    /business.*insights/i
  ];
  
  return commandPatterns.some(pattern => pattern.test(message));
};

// Enhanced command executor
const executeCommand = async (message: string, businessContext: any): Promise<any> => {
  const normalizedMessage = message.toLowerCase().trim();
  
  try {
    // Add product command
    if (/add\s+(\d+)?\s*(units?\s*of\s*)?(.+?)\s*to\s*inventory/i.test(normalizedMessage)) {
      const match = normalizedMessage.match(/add\s+(\d+)?\s*(units?\s*of\s*)?(.+?)\s*to\s*inventory/i);
      const quantity = match?.[1] ? parseInt(match[1]) : 1;
      const productName = match?.[3]?.trim();
      
      if (productName) {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productName,
            quantity: quantity,
            category: 'General',
            price: 0,
            description: `Product created via AI: ${productName}`,
          })
          .select()
          .single();
        
        if (!error) {
          return {
            success: true,
            action: 'product_created',
            data: { productName, quantity, id: data.id }
          };
        }
      }
    }
    
    // Update inventory command
    if (/update\s+(.+?)\s*stock\s*to\s*(\d+)/i.test(normalizedMessage)) {
      const match = normalizedMessage.match(/update\s+(.+?)\s*stock\s*to\s*(\d+)/i);
      const productName = match?.[1]?.trim();
      const quantity = match?.[2] ? parseInt(match[2]) : 0;
      
      if (productName) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${productName}%`)
          .limit(1);
        
        if (products && products.length > 0) {
          const { error } = await supabase
            .from('products')
            .update({ quantity })
            .eq('id', products[0].id);
          
          if (!error) {
            return {
              success: true,
              action: 'inventory_updated',
              data: { productName: products[0].name, oldQuantity: products[0].quantity, newQuantity: quantity }
            };
          }
        }
      }
    }
    
    // Check stock command
    if (/check\s*stock\s*for\s*(.+)/i.test(normalizedMessage)) {
      const match = normalizedMessage.match(/check\s*stock\s*for\s*(.+)/i);
      const productName = match?.[1]?.trim();
      
      if (productName) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${productName}%`);
        
        if (products && products.length > 0) {
          return {
            success: true,
            action: 'stock_checked',
            data: products.map(p => ({
              name: p.name,
              quantity: p.quantity,
              status: p.quantity < 10 ? 'Low Stock' : p.quantity < 50 ? 'Medium Stock' : 'Good Stock'
            }))
          };
        }
      }
    }
    
    // Low stock command
    if (/show\s*low\s*stock|low\s*stock\s*items|inventory\s*alerts/i.test(normalizedMessage)) {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .lt('quantity', 10)
        .order('quantity', { ascending: true });
      
      return {
        success: true,
        action: 'low_stock_retrieved',
        data: products?.map(p => ({ name: p.name, quantity: p.quantity, category: p.category })) || []
      };
    }
    
    // Sales report command
    if (/sales\s*report|revenue\s*analysis/i.test(normalizedMessage)) {
      const { data: receipts } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (receipts) {
        const totalRevenue = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
        const averageOrder = totalRevenue / receipts.length;
        
        return {
          success: true,
          action: 'sales_report_generated',
          data: {
            totalSales: receipts.length,
            totalRevenue,
            averageOrder,
            recentSales: receipts.slice(0, 10)
          }
        };
      }
    }
    
    // Create customer command
    if (/add.*customer|create.*customer|register.*customer/i.test(normalizedMessage)) {
      const match = normalizedMessage.match(/(?:add|create|register).*customer\s+(.+)/i);
      const customerName = match?.[1]?.trim();
      
      if (customerName) {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            email: `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!error) {
          return {
            success: true,
            action: 'customer_created',
            data: { name: customerName, id: data.id }
          };
        }
      }
    }
    
  } catch (error) {
    console.error('Command execution error:', error);
  }
  
  return { success: false };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Enhanced AI Insights function called');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { message, businessContext } = requestBody;

    if (!message) {
      throw new Error('No message provided');
    }

    // Detect if this is a command
    const isCommand = detectCommand(message);
    console.log('Command detected:', isCommand);
    
    let commandResult = null;
    if (isCommand) {
      commandResult = await executeCommand(message, businessContext);
      console.log('Command execution result:', commandResult);
    }

    // Create enhanced system prompt
    const systemPrompt = createSystemPrompt(businessContext, isCommand);

    // Prepare the message for OpenAI with command context
    let enhancedMessage = message;
    if (commandResult?.success) {
      enhancedMessage += `\n\n[COMMAND EXECUTED SUCCESSFULLY: ${JSON.stringify(commandResult)}]`;
    } else if (isCommand && !commandResult?.success) {
      enhancedMessage += `\n\n[COMMAND DETECTED BUT EXECUTION FAILED - Please provide guidance]`;
    }

    console.log('Making request to OpenAI with enhanced capabilities...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedMessage }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const aiResponse = data.choices[0].message.content;

    // Return enhanced response with command results
    const responseData = {
      response: aiResponse,
      commandExecuted: isCommand,
      commandResult: commandResult,
      suggestions: isCommand ? [
        "Show business insights",
        "Check other inventory levels", 
        "Generate performance report"
      ] : [
        "Try: 'add 50 iPhone to inventory'",
        "Ask: 'show low stock items'",
        "Say: 'sales report for today'"
      ]
    };

    console.log('Sending enhanced response');
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
