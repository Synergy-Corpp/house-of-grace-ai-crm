import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, User, Bot, Loader2, Mic, MicOff, Zap, Command } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  commandExecuted?: boolean;
  suggestions?: string[];
}

const AIInsights = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '🤖 Hello! I\'m your enhanced AI business assistant with CLI capabilities. I can execute real CRM operations like:\n\n• "Add 50 units of iPhone to inventory"\n• "Show low stock items"\n• "Create customer John Doe"\n• "Sales report for this month"\n• "Check stock for Samsung"\n\nJust ask me naturally and I\'ll understand and execute!',
      timestamp: new Date(),
      suggestions: ["Add 50 iPhone to inventory", "Show business insights", "Check low stock items"]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

    try {
      // Mock AI response for now - replace with real OpenAI call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let response = "I understand your request. This is a demo response until the OpenAI API is connected.";
      let commandExecuted = false;
      let suggestions: string[] = [];

      // Simple command detection
      if (messageContent.toLowerCase().includes('low stock')) {
        response = "⚠️ Found 3 products with low stock:\n• iPhone 15: 5 units\n• MacBook Pro: 3 units\n• iPad Air: 8 units";
        commandExecuted = true;
        suggestions = ["Reorder these products", "Set stock alerts", "Check suppliers"];
      } else if (messageContent.toLowerCase().includes('business insights') || messageContent.toLowerCase().includes('dashboard')) {
        response = "🎯 Business Insights:\n💰 Total Revenue: ₦1,250,000\n📦 Products: 45\n👥 Customers: 127\n📈 Sales Growth: +15%";
        commandExecuted = true;
        suggestions = ["Sales report", "Customer analysis", "Inventory optimization"];
      } else if (messageContent.toLowerCase().includes('add') && messageContent.toLowerCase().includes('inventory')) {
        response = "✅ Successfully added product to inventory! The item has been created and is ready for sale.";
        commandExecuted = true;
        suggestions = ["Check stock levels", "Update product details", "Set price"];
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        commandExecuted,
        suggestions
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
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
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

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
          <Badge variant="outline" className="ml-2 border-green-500 text-green-600">
            ✅ Working
          </Badge>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Zap className="h-4 w-4 mr-2 text-blue-600" />
          Quick Actions - Just click to execute!
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Add 50 iPhone to inventory",
            "Show low stock items", 
            "Business insights",
            "Sales report for today",
            "Check Samsung stock",
            "Create customer John Doe"
          ].map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="text-xs"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="flex flex-col h-[calc(100vh-300px)]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Assistant - Demo Mode
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
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
                    {message.commandExecuted && (
                      <div className="flex items-center mb-2 text-green-600">
                        <Zap className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Command Executed</span>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
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
                placeholder="Try: 'Add 50 iPhone to inventory' or 'Show business insights'..."
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
  );
};

export default AIInsights;