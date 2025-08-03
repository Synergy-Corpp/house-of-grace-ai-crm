import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, User, Bot, Loader2, History, Plus, Trash2, Menu, X, Mic, MicOff, Zap, Command } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AIVisualization from '@/components/ai/AIVisualization';
import { useLocalTestMode } from '@/hooks/useLocalTestMode';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  commandExecuted?: boolean;
  commandResult?: any;
  visualizations?: any[];
  suggestions?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

// Helper function to serialize messages for database storage
const serializeMessages = (messages: Message[]) => {
  return messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp.toISOString()
  }));
};

// Helper function to deserialize messages from database
const deserializeMessages = (messages: any[]): Message[] => {
  return messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  }));
};

const AIInsights = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Welcome to House of Grace AI Assistant! ✨\n\nI\'m here to help you manage your business with the power of AI. I can:\n\n🎯 **Execute Commands:**\n• "Add 50 iPhone to inventory"\n• "Update Samsung stock to 100"\n• "Show low stock items"\n\n📊 **Provide Insights:**\n• "Sales report for this month"\n• "Show business performance"\n• "Analyze customer trends"\n\n🤝 **Manage Customers:**\n• "Create customer John Doe"\n• "Find customer records"\n\nJust speak naturally - I understand context and can help you grow your business! 🚀',
      timestamp: new Date(),
      suggestions: ["Show my business insights", "Check inventory status", "Add new product"]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isLocalMode, mockAIRequest, getMockContext } = useLocalTestMode();

  // Fetch chat sessions using proper type conversion
  const { data: chatSessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert the data to ChatSession format with proper message deserialization
      return (data || []).map(session => ({
        ...session,
        messages: deserializeMessages(Array.isArray(session.messages) ? session.messages : [])
      })) as ChatSession[];
    },
  });

  // Fetch inventory data for AI context
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Save chat session mutation with proper JSON serialization
  const saveChatMutation = useMutation({
    mutationFn: async (chatData: { title: string; messages: Message[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          title: chatData.title,
          messages: serializeMessages(chatData.messages) as any,
          user_id: userData.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast({
        title: "Success",
        description: "Chat saved successfully!",
      });
    },
  });

  // Delete chat session mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', chatId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast({
        title: "Success",
        description: "Chat deleted successfully!",
      });
    },
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [toast]);

  const logActivity = async (action: string, entityType: string, entityName: string, details?: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          user_email: userData.user.email || '',
          action,
          entity_type: entityType,
          entity_name: entityName,
          details: details || null
        });
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Log the AI interaction
    await logActivity('AI_QUERY', 'ai_chat', 'AI Business Insights', { 
      query: messageContent,
      timestamp: new Date().toISOString()
    });

    try {
      let data, error;
      
      if (isLocalMode) {
        // Use mock data for localhost testing
        console.log('🧪 Using localhost test mode with mock data');
        data = await mockAIRequest(messageContent);
        error = null;
      } else {
        // Try direct OpenAI API call if Edge Function fails
        const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
        
        if (openaiKey && openaiKey.startsWith('sk-')) {
          try {
            console.log('🤖 Calling OpenAI directly...');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { 
                    role: 'system', 
                    content: `You are an AI business assistant for House of Grace CRM. Help with inventory, customers, and business insights. Current context: ${products.length} products, ${receipts.length} sales. Be helpful and professional.`
                  },
                  { role: 'user', content: messageContent }
                ],
                temperature: 0.7,
                max_tokens: 500,
              }),
            });

            if (response.ok) {
              const aiData = await response.json();
              data = {
                response: aiData.choices[0]?.message?.content || 'No response generated',
                commandExecuted: false,
                suggestions: ["Show business insights", "Check inventory", "Add new product"]
              };
              error = null;
              console.log('✅ Direct OpenAI call successful');
            } else {
              throw new Error('OpenAI API call failed');
            }
          } catch (directError) {
            console.log('❌ Direct OpenAI failed, trying Supabase Edge Function...');
            // Fallback to Supabase Edge Function
            await attemptSupabaseCall();
          }
        } else {
          await attemptSupabaseCall();
        }
      }

      async function attemptSupabaseCall() {
        // Prepare business context for AI
        const businessContext = {
          totalProducts: products.length,
          totalRevenue: receipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0),
          totalOrders: orders.length,
          lowStockProducts: products.filter(p => p.quantity < 10),
          topCategories: products.reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recentActivity: {
            productsAdded: products.filter(p => {
              const createdDate = new Date(p.created_at);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return createdDate > oneWeekAgo;
            }).length,
            recentSales: receipts.filter(r => {
              const createdDate = new Date(r.created_at);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return createdDate > oneWeekAgo;
            }).length
          }
        };

        console.log('Sending request to AI function with context:', businessContext);

        const response = await supabase.functions.invoke('ai-insights', {
          body: {
            message: messageContent,
            businessContext
          }
        });
        
        data = response.data;
        error = response.error;
      }

      console.log('AI function response:', { data, error });

      if (error) {
        console.error('AI function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data?.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        commandExecuted: data?.commandExecuted || false,
        commandResult: data?.commandResult,
        visualizations: data?.commandResult?.success ? [{ 
          type: data.commandResult.action,
          data: data.commandResult.data 
        }] : undefined,
        suggestions: data?.suggestions || []
      };

      setMessages(prev => [...prev, aiMessage]);

      // Log successful AI response
      await logActivity('AI_RESPONSE', 'ai_chat', 'AI Business Insights', { 
        response_length: aiMessage.content.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please check if the OpenAI API key is configured correctly.",
        variant: "destructive",
      });

      // Log the error
      await logActivity('AI_ERROR', 'ai_chat', 'AI Business Insights', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Voice recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    // Auto-send quick actions
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const startNewChat = async () => {
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: 'Hello! I\'m your AI business assistant. I can help you analyze your inventory, provide business insights, and answer questions about your store. What would you like to know?',
        timestamp: new Date()
      }
    ]);
    setCurrentChatId(null);
    setMobileMenuOpen(false);
    
    await logActivity('NEW_CHAT', 'ai_chat', 'AI Business Insights');
  };

  const loadChat = async (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentChatId(session.id);
    setShowHistory(false);
    setMobileMenuOpen(false);
    
    await logActivity('LOAD_CHAT', 'ai_chat', session.title, { chat_id: session.id });
  };

  const saveCurrentChat = async () => {
    if (messages.length <= 1) return;
    
    const title = messages.find(m => m.type === 'user')?.content.slice(0, 50) || 'New Chat';
    saveChatMutation.mutate({ title, messages });
    setMobileMenuOpen(false);
    
    await logActivity('SAVE_CHAT', 'ai_chat', title);
  };

  const deleteChat = async (chatId: string) => {
    const session = chatSessions.find(s => s.id === chatId);
    deleteChatMutation.mutate(chatId);
    
    if (session) {
      await logActivity('DELETE_CHAT', 'ai_chat', session.title, { chat_id: chatId });
    }
  };

  // Mobile menu content
  const MenuContent = () => (
    <div className="space-y-4 p-4">
      <Button
        variant="outline"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full justify-start"
      >
        <History className="mr-2 h-4 w-4" />
        {showHistory ? 'Hide History' : 'Show History'}
      </Button>
      <Button
        variant="outline"
        onClick={startNewChat}
        className="w-full justify-start"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <Button
        variant="outline"
        onClick={saveCurrentChat}
        disabled={messages.length <= 1 || saveChatMutation.isPending}
        className="w-full justify-start"
      >
        Save Chat
      </Button>
      
      {showHistory && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Chat History</h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1 min-w-0" onClick={() => loadChat(session)}>
                    <p className="text-sm font-medium truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return (
    <div className="py-4 md:py-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="mr-2 h-6 w-6 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold">AI Business Assistant</h1>
          <Badge variant="secondary" className="ml-2">
            <Command className="h-3 w-3 mr-1" />
            CLI Enabled
          </Badge>
          {isLocalMode && (
            <Badge variant="outline" className="ml-2 border-orange-500 text-orange-600">
              🧪 Test Mode
            </Badge>
          )}
        </div>
        
        {/* Desktop Controls */}
        {!isMobile && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="mr-2 h-4 w-4" />
              Chat History
            </Button>
            <Button
              variant="outline"
              onClick={startNewChat}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="outline"
              onClick={saveCurrentChat}
              disabled={messages.length <= 1 || saveChatMutation.isPending}
            >
              Save Chat
            </Button>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chat Controls</SheetTitle>
                <SheetDescription>
                  Manage your AI chat sessions
                </SheetDescription>
              </SheetHeader>
              <MenuContent />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-100 shadow-sm">
        <h3 className="text-base font-semibold mb-3 flex items-center text-gray-800">
          <Zap className="h-5 w-5 mr-2 text-blue-600" />
          ⚡ Quick Actions - Click any button to get started!
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { text: "📊 Business insights", action: "Show my business performance and key metrics" },
            { text: "📦 Check inventory", action: "Show low stock items and inventory status" },
            { text: "➕ Add product", action: "Add 50 iPhone to inventory" },
            { text: "📈 Sales report", action: "Generate sales report for this month" },
            { text: "👥 Add customer", action: "Create customer profile for John Doe" },
            { text: "🔍 Check stock", action: "Check stock levels for Samsung products" }
          ].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(item.action)}
              className="text-xs h-auto py-3 px-4 flex-col items-center space-y-1 hover:bg-white hover:shadow-md transition-all duration-200 border-blue-200 hover:border-blue-300"
            >
              <span className="font-medium">{item.text}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
        {/* Desktop Chat History Sidebar */}
        {!isMobile && showHistory && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Previous Chats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadChat(session)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className={`${!isMobile && showHistory ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col`}>
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              AI Assistant
              {currentChatId && (
                <span className="ml-2 text-sm text-gray-500">(Loaded Chat)</span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollAreaRef}>
              <div className="space-y-6 py-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] md:max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {/* Command Execution Indicator */}
                      {message.commandExecuted && (
                        <div className="flex items-center mb-2 text-green-600">
                          <Zap className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">Command Executed</span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickAction(suggestion)}
                              className="text-xs h-6 px-2 bg-white/50 hover:bg-white/70"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex-shrink-0 border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="💬 Ask me anything about your business... (e.g., 'Show my sales report' or 'Add new inventory')"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={toggleVoiceRecognition}
                  disabled={isLoading}
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  title={isListening ? "Stop listening" : "Voice command"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isListening && (
                <div className="mt-2 text-center">
                  <span className="text-sm text-blue-600 animate-pulse">🎤 Listening...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;
