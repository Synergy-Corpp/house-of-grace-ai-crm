
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, FileText, Clock, TrendingUp, Download } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountStatementModal = ({ isOpen, onClose }: AccountStatementModalProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const periods = [
    { id: 'today', label: 'Today', icon: Clock, description: 'Current day statement' },
    { id: 'yesterday', label: 'Yesterday', icon: Clock, description: 'Previous day statement' },
    { id: 'this_week', label: 'This Week', icon: CalendarIcon, description: 'Current week statement' },
    { id: 'previous_week', label: 'Previous Week', icon: CalendarIcon, description: 'Last week statement' },
    { id: 'this_month', label: 'This Month', icon: TrendingUp, description: 'Current month statement' },
    { id: 'previous_month', label: 'Previous Month', icon: TrendingUp, description: 'Last month statement' },
    { id: 'this_year', label: 'This Year', icon: FileText, description: 'Current year statement' },
    { id: 'previous_year', label: 'Previous Year', icon: FileText, description: 'Last year statement' },
    { id: 'custom', label: 'Custom Range', icon: CalendarIcon, description: 'Select custom date range' },
  ];

  const getDateRange = (periodId: string) => {
    const now = new Date();
    
    switch (periodId) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'this_week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'previous_week':
        return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'previous_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'previous_year':
        return { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: startOfDay(customStartDate), end: endOfDay(customEndDate) };
        }
        return null;
      default:
        return null;
    }
  };

  const generateStatementNumber = () => {
    const now = new Date();
    return `STMT-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const fetchStatementData = async (startDate: Date, endDate: Date) => {
    try {
      // Fetch invoices data
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (invoicesError) throw invoicesError;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (paymentsError) throw paymentsError;

      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (productsError) throw productsError;

      // Fetch customers data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (customersError) throw customersError;

      // Fetch staff data
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (staffError) throw staffError;

      // Calculate totals
      const totalRevenue = invoices?.reduce((sum, invoice) => sum + (parseFloat(invoice.total.toString()) || 0), 0) || 0;
      const paymentsReceived = payments?.reduce((sum, payment) => sum + (parseFloat(payment.amount.toString()) || 0), 0) || 0;
      const productsAdded = products?.length || 0;
      const customersRegistered = customers?.length || 0;
      const staffAdded = staff?.length || 0;
      const invoicesCreated = invoices?.length || 0;

      return {
        totalRevenue,
        paymentsReceived,
        netProfit: totalRevenue, // Simplified calculation
        productsAdded,
        customersRegistered,
        staffAdded,
        invoicesCreated,
        rawData: {
          invoices,
          payments,
          products,
          customers,
          staff
        }
      };
    } catch (error) {
      console.error('Error fetching statement data:', error);
      throw error;
    }
  };

  const handleGenerateStatement = async () => {
    if (!selectedPeriod || !user) return;

    const dateRange = getDateRange(selectedPeriod);
    if (!dateRange) {
      toast.error("Please select valid dates for custom range");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch data for the selected period
      const statementData = await fetchStatementData(dateRange.start, dateRange.end);
      
      // Generate statement number
      const statementNumber = generateStatementNumber();

      // Save the statement to the database
      const { error } = await supabase
        .from('account_statements')
        .insert({
          statement_number: statementNumber,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
          generated_by: user.email || '',
          total_revenue: statementData.totalRevenue,
          total_expenses: 0, // Could be calculated from product costs
          net_profit: statementData.netProfit,
          products_sold: 0, // Would need to calculate from invoice items
          products_added: statementData.productsAdded,
          invoices_created: statementData.invoicesCreated,
          payments_received: statementData.paymentsReceived,
          customers_registered: statementData.customersRegistered,
          staff_added: statementData.staffAdded,
          statement_data: statementData.rawData
        });

      if (error) throw error;

      toast.success(`Account statement ${statementNumber} generated successfully!`);
      
      // Show a summary of the statement
      console.log('Statement Summary:', {
        period: `${format(dateRange.start, 'PPP')} - ${format(dateRange.end, 'PPP')}`,
        totalRevenue: statementData.totalRevenue,
        paymentsReceived: statementData.paymentsReceived,
        invoicesCreated: statementData.invoicesCreated,
        productsAdded: statementData.productsAdded,
        customersRegistered: statementData.customersRegistered,
        staffAdded: statementData.staffAdded
      });

      onClose();
      setSelectedPeriod(null);
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error("Failed to generate account statement");
    } finally {
      setIsGenerating(false);
    }
  };

  const isCustomRangeValid = selectedPeriod === 'custom' && customStartDate && customEndDate && customStartDate <= customEndDate;
  const canGenerate = selectedPeriod && (selectedPeriod !== 'custom' || isCustomRangeValid);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="mr-2 h-5 w-5" />
            Generate Account Statement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Select the time period for which you want to generate the account statement:
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {periods.map((period) => {
              const Icon = period.icon;
              const isSelected = selectedPeriod === period.id;
              return (
                <Card 
                  key={period.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-brand-gold bg-brand-gold/10' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`rounded-full p-2 ${
                        isSelected 
                          ? 'bg-brand-gold/20' 
                          : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          isSelected 
                            ? 'text-brand-gold' 
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{period.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {period.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPeriod === 'custom' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-4">Select Custom Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateStatement}
              disabled={!canGenerate || isGenerating}
              className="bg-brand-gold hover:bg-brand-darkGold text-black"
            >
              {isGenerating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Statement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountStatementModal;
