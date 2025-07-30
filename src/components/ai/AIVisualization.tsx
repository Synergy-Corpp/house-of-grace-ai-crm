import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  Users, 
  DollarSign,
  ShoppingCart,
  Calendar
} from 'lucide-react';

interface VisualizationData {
  type: string;
  data: any;
  title?: string;
  description?: string;
}

interface AIVisualizationProps {
  visualizations: VisualizationData[];
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const AIVisualization: React.FC<AIVisualizationProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return null;
  }

  const renderVisualization = (viz: VisualizationData, index: number) => {
    switch (viz.type) {
      case 'lowStock':
        return <LowStockChart key={index} data={viz.data} />;
      case 'salesChart':
        return <SalesChart key={index} data={viz.data} />;
      case 'businessOverview':
        return <BusinessOverviewCards key={index} data={viz.data} />;
      case 'categoryDistribution':
        return <CategoryPieChart key={index} data={viz.data} />;
      case 'customerHistory':
        return <CustomerHistoryChart key={index} data={viz.data} />;
      case 'trendChart':
        return <TrendAnalysisChart key={index} data={viz.data} />;
      case 'predictionChart':
        return <PredictionChart key={index} data={viz.data} />;
      case 'inventoryMatrix':
        return <InventoryMatrix key={index} data={viz.data} />;
      default:
        return <GenericDataDisplay key={index} data={viz.data} title={viz.title} />;
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI Data Insights</h3>
      </div>
      <div className="grid gap-4">
        {visualizations.map((viz, index) => renderVisualization(viz, index))}
      </div>
    </div>
  );
};

// Low Stock Visualization
const LowStockChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-green-600" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-green-600 font-medium">
            ✅ All products are well stocked!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
          Low Stock Alert ({data.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="font-medium">{item.name}</span>
              <Badge variant="destructive">{item.quantity} units</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Sales Chart
const SalesChart: React.FC<{ data: any[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    amount: item.amount,
    customer: item.customer
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Sales Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₦${value}`, 'Amount']} />
            <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Business Overview Cards
const BusinessOverviewCards: React.FC<{ data: any }> = ({ data }) => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: `₦${data.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Products',
      value: data.products || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Customers',
      value: data.customers || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Low Stock Items',
      value: data.lowStock || 0,
      icon: AlertTriangle,
      color: data.lowStock > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: data.lowStock > 0 ? 'bg-red-100' : 'bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{metric.title}</p>
                <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Category Distribution
const CategoryPieChart: React.FC<{ data: any[] }> = ({ data }) => {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
          Product Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 md:mt-0 md:ml-4 space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm">{item.category}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Customer History Chart
const CustomerHistoryChart: React.FC<{ data: any[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    amount: item.amount,
    items: item.items
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
          Customer Purchase Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₦${value}`, 'Amount']} />
            <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Trend Analysis Chart
const TrendAnalysisChart: React.FC<{ data: any[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    amount: item.amount
  }));

  const trend = chartData.length > 1 ? 
    (chartData[chartData.length - 1].amount > chartData[0].amount ? 'up' : 'down') : 'stable';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {trend === 'up' ? (
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
          )}
          Sales Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₦${value}`, 'Sales']} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke={trend === 'up' ? '#10B981' : '#EF4444'} 
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm">
            <strong>Trend Direction:</strong> {' '}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend === 'up' ? '📈 Growing' : '📉 Declining'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Prediction Chart
const PredictionChart: React.FC<{ data: any }> = ({ data }) => {
  const combinedData = [
    ...data.historical.map((value: number, index: number) => ({
      day: `Day ${index + 1}`,
      actual: value,
      predicted: null,
      type: 'historical'
    })),
    ...data.predictions.map((value: number, index: number) => ({
      day: `Day ${data.historical.length + index + 1}`,
      actual: null,
      predicted: value,
      type: 'predicted'
    }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Sales Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Historical"
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#10B981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm">Historical Data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded border-dashed border-2"></div>
            <span className="text-sm">Predictions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Inventory Matrix
const InventoryMatrix: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Inventory Status Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate">{item.name}</h4>
                <Badge 
                  variant={item.quantity < 10 ? "destructive" : item.quantity < 50 ? "secondary" : "default"}
                >
                  {item.quantity}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Stock Level</span>
                  <span>{item.quantity < 10 ? 'Low' : item.quantity < 50 ? 'Medium' : 'Good'}</span>
                </div>
                <Progress 
                  value={Math.min((item.quantity / 100) * 100, 100)} 
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Generic Data Display
const GenericDataDisplay: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Data Insights'}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default AIVisualization;