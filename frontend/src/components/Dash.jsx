// Dash.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaUserShield,
  FaDollarSign,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaExclamationTriangle
} from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Dash = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalGuarantors: 0,
    totalBalance: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [realChartData, setRealChartData] = useState({
    monthlyProfits: [],
    clientGrowth: [],
    transactionTypes: [],
    balanceDistribution: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Fetch main dashboard stats
      const statsResponse = await fetch("http://localhost:5001/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          setError('Session expired. Please log in again.');
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      setStats(statsData);
      
      // Fetch additional data for charts
      await fetchChartData(statsData, token);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChartData = async (statsData, token) => {
    try {
      // Fetch all data in parallel for better performance
      const [clientsResponse, transactionsResponse, taxLogsResponse] = await Promise.all([
        fetch("http://localhost:5001/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5001/api/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5001/api/taxlogs", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!clientsResponse.ok || !transactionsResponse.ok || !taxLogsResponse.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const [clientsData, transactionsData, taxLogsData] = await Promise.all([
        clientsResponse.json(),
        transactionsResponse.json(),
        taxLogsResponse.json()
      ]);

      // Generate charts with proper error handling
      generateRealCharts(statsData, clientsData, transactionsData, taxLogsData);
    } catch (err) {
      console.error("Chart data error:", err);
      setError('Partial data loaded. Some charts may not display correctly.');
    }
  };

  const generateRealCharts = (statsData, clientsData, transactionsData, taxLogsData) => {
    // Ensure we have arrays to work with
    const safeClients = Array.isArray(clientsData) ? clientsData : [];
    const safeTransactions = Array.isArray(transactionsData) ? transactionsData : [];
    const safeTaxLogs = Array.isArray(taxLogsData) ? taxLogsData : [];

    // 1. Monthly Profits from Tax Logs (last 6 months)
    const monthlyProfits = generateMonthlyProfitData(safeTaxLogs);
    
    // 2. Client Growth Timeline (last 12 months)
    const clientGrowth = generateClientGrowthData(safeClients);
    
    // 3. Transaction Types Distribution
    const transactionTypes = generateTransactionTypeData(safeTransactions);
    
    // 4. Client Balance Distribution
    const balanceDistribution = generateBalanceDistributionData(safeClients);

    setRealChartData({
      monthlyProfits,
      clientGrowth,
      transactionTypes,
      balanceDistribution
    });
  };

  const generateMonthlyProfitData = (taxLogs) => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthlyProfit = taxLogs.reduce((total, log) => {
        if (!log || !log.date) return total;
        
        try {
          const logDate = new Date(log.date);
          if (logDate.getMonth() === date.getMonth() && logDate.getFullYear() === date.getFullYear()) {
            return total + (Number(log.profit) || 0);
          }
        } catch (e) {
          console.warn('Invalid date format in tax log:', log.date);
        }
        return total;
      }, 0);

      last6Months.push({
        month: monthName,
        profit: Math.round(monthlyProfit * 100) / 100, // Round to 2 decimal places
        tax: Math.round(monthlyProfit * 0.2 * 100) / 100 // 20% tax rate
      });
    }
    
    return last6Months.length > 0 ? last6Months : [
      { month: 'Jan', profit: 0, tax: 0 },
      { month: 'Feb', profit: 0, tax: 0 },
      { month: 'Mar', profit: 0, tax: 0 },
      { month: 'Apr', profit: 0, tax: 0 },
      { month: 'May', profit: 0, tax: 0 },
      { month: 'Jun', profit: 0, tax: 0 }
    ];
  };

  const generateClientGrowthData = (clients) => {
    const last12Months = [];
    const now = new Date();
    let cumulativeTotal = 0;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthlyClients = clients.filter(client => {
        if (!client) return false;
        
        try {
          const clientDate = new Date(client.createdAt || client.date || Date.now());
          return clientDate.getMonth() === date.getMonth() && 
                 clientDate.getFullYear() === date.getFullYear();
        } catch (e) {
          console.warn('Invalid client date format:', client.createdAt || client.date);
          return false;
        }
      }).length;

      cumulativeTotal += monthlyClients;

      last12Months.push({
        month: monthName,
        clients: monthlyClients,
        cumulative: cumulativeTotal
      });
    }
    
    return last12Months.length > 0 ? last12Months : Array(12).fill(0).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        clients: 0,
        cumulative: 0
      };
    });
  };

  const generateTransactionTypeData = (transactions) => {
    const typeCount = transactions.reduce((acc, transaction) => {
      if (!transaction) return acc;
      
      const type = (transaction.type || 'unknown').toLowerCase();
      const amount = Number(transaction.amount) || 0;
      
      if (!acc[type]) {
        acc[type] = { count: 0, totalAmount: 0 };
      }
      acc[type].count += 1;
      acc[type].totalAmount += amount;
      
      return acc;
    }, {});

    const data = Object.entries(typeCount).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.count,
      totalAmount: Math.round(data.totalAmount * 100) / 100
    }));

    return data.length > 0 ? data : [
      { name: 'Deposit', count: 0, totalAmount: 0 },
      { name: 'Withdrawal', count: 0, totalAmount: 0 },
      { name: 'Transfer', count: 0, totalAmount: 0 }
    ];
  };

  const generateBalanceDistributionData = (clients) => {
    const balanceRanges = [
      { range: '0-1K', min: 0, max: 1000, color: '#0088FE' },
      { range: '1K-5K', min: 1000, max: 5000, color: '#00C49F' },
      { range: '5K-10K', min: 5000, max: 10000, color: '#FFBB28' },
      { range: '10K+', min: 10000, max: Infinity, color: '#FF8042' }
    ];

    const data = balanceRanges.map(range => {
      const clientsInRange = clients.filter(client => {
        const balance = Number(client.balance) || 0;
        return balance >= range.min && balance < range.max;
      });

      const totalBalance = clientsInRange.reduce((sum, client) => {
        return sum + (Number(client.balance) || 0);
      }, 0);

      return {
        range: range.range,
        clients: clientsInRange.length,
        totalBalance: Math.round(totalBalance * 100) / 100,
        color: range.color
      };
    });

    return data.length > 0 ? data : balanceRanges.map(range => ({
      ...range,
      clients: 0,
      totalBalance: 0
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const cards = [
    {
      title: "Total Clients",
      value: stats.totalClients?.toLocaleString() || '0',
      change: "+12%",
      icon: <FaUsers className="text-2xl" />,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br"
    },
    {
      title: "Total Guarantors",
      value: stats.totalGuarantors?.toLocaleString() || '0',
      change: "+8%",
      icon: <FaUserShield className="text-2xl" />,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-br"
    },
    {
      title: "Total Balance",
      value: `$${(stats.totalBalance || 0).toLocaleString()}`,
      change: "+15%",
      icon: <FaMoneyBillWave className="text-2xl" />,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-gradient-to-br"
    },
    {
      title: "Total Profit",
      value: `$${(stats.totalProfit || 0).toLocaleString()}`,
      change: "+22%",
      icon: <FaChartLine className="text-2xl" />,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br"
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[150px]">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: {entry.name.includes('$') ? '$' : ''}{entry.value.toLocaleString()}
              {entry.dataKey === 'count' && ' transactions'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart container with proper dimensions
  const ChartContainer = ({ children, title, description, className = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 lg:p-6 border border-white/20 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      <div className="h-64 lg:h-80 w-full min-w-0">
        {children}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading dashboard data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              📊 Dashboard Overview
            </h1>
            <p className="text-gray-600 text-lg">
              Real-time insights from your actual business data
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <FaSync className={`${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02, 
                y: -5,
                transition: { type: "spring", stiffness: 400 }
              }}
              className={`${card.bgColor} ${card.color} text-white p-4 lg:p-6 rounded-2xl shadow-xl relative overflow-hidden group`}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-blue-100 text-sm lg:text-base">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold mt-2">{card.value}</p>
                  </div>
                  <div className="text-white/80 transform group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {card.change}
                  </span>
                  <span className="text-xs text-blue-100">vs last period</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Real Charts Section */}
        <div className="space-y-6 lg:space-y-8">
          {/* First Row: Monthly Profits and Client Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Monthly Profits Chart */}
            <ChartContainer
              title="Monthly Profits & Tax"
              description="Profit and tax amounts over the last 6 months"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={realChartData.monthlyProfits} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="taxGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10B981" 
                    fill="url(#profitGradient)"
                    strokeWidth={2}
                    name="Profit ($)"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tax" 
                    stroke="#EF4444" 
                    fill="url(#taxGradient)"
                    strokeWidth={2}
                    name="Tax ($)"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#EF4444' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Client Growth Chart */}
            <ChartContainer
              title="Client Growth Timeline"
              description="New client acquisitions and cumulative growth"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={realChartData.clientGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="clients" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3B82F6' }}
                    name="New Clients"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                    name="Total Clients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Second Row: Transaction Types and Balance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Transaction Types Distribution */}
            <ChartContainer
              title="Transaction Types Distribution"
              description="Breakdown of transactions by type and volume"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={realChartData.transactionTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                  >
                    {realChartData.transactionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200">
                            <p className="font-semibold text-gray-800">{data.name}</p>
                            <p className="text-sm" style={{ color: payload[0].color }}>
                              Count: {data.count}
                            </p>
                            <p className="text-sm" style={{ color: payload[0].color }}>
                              Amount: ${data.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Balance Distribution */}
            <ChartContainer
              title="Client Balance Distribution"
              description="Clients categorized by their account balance ranges"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart 
                  data={realChartData.balanceDistribution} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="range" 
                    stroke="#666" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12}
                    yAxisId="left"
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12}
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="clients" 
                    fill="#F59E0B" 
                    radius={[4, 4, 0, 0]}
                    name="Number of Clients"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="totalBalance" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                    name="Total Balance ($)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Data Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              label: "Avg. Client Balance",
              value: `$${stats.totalClients > 0 ? (stats.totalBalance / stats.totalClients).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}`,
              icon: FaArrowUp,
              color: "green"
            },
            {
              label: "Clients per Guarantor",
              value: stats.totalGuarantors > 0 ? (stats.totalClients / stats.totalGuarantors).toFixed(1) : '0',
              icon: FaUsers,
              color: "blue"
            },
            {
              label: "Profit per Client",
              value: `$${stats.totalClients > 0 ? (stats.totalProfit / stats.totalClients).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}`,
              icon: FaDollarSign,
              color: "purple"
            },
            {
              label: "Data Status",
              value: error ? "Partial" : "Live",
              icon: error ? FaExclamationTriangle : FaChartBar,
              color: error ? "red" : "orange"
            }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                  <item.icon className={`text-${item.color}-600 text-xl`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 lg:w-80 lg:h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 lg:w-80 lg:h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default Dash;