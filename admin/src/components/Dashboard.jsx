import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import {
  BookOpen,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Loader
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 245,
    totalOrders: 189,
    totalRevenue: 45230,
    totalUsers: 1234,
    trends: {
      books: '+12% from last month',
      orders: '-5.2% from last month',
      revenue: '+15% from last month',
      users: '-2.1% from last month'
    }
  });
  const [loading, setLoading] = useState(true);
  const [booksData, setBooksData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Books Added',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }],
  });
  const [ordersData, setOrdersData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Orders',
      data: [65, 89, 80, 81, 96, 105],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
    }],
  });
  const [categoryData, setCategoryData] = useState({
    labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Others'],
    datasets: [{
      data: [35, 25, 20, 10, 5, 5],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderWidth: 1,
    }],
  });
  const [revenueData, setRevenueData] = useState({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [1200, 1900, 1500, 2100],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
    }],
  });
  const [users, setUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    return `${Math.floor(diffInSeconds / 86400)} day ago`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
          weight: '400',
        },
        boxPadding: 6,
        usePointStyle: true,
        animation: {
          duration: 200,
          easing: 'easeOutQuart',
        },
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Format revenue in INR, others in regular numbers
              if (label.toLowerCase().includes('revenue')) {
                label += '₹' + context.parsed.y.toLocaleString('en-IN');
              } else {
                label += new Intl.NumberFormat().format(context.parsed.y);
              }
            }
            return label;
          },
        },
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat().format(value);
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    hover: {
      animationDuration: 200,
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 6,
        hoverBorderWidth: 3,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
          weight: '400',
        },
        boxPadding: 6,
        usePointStyle: true,
        animation: {
          duration: 200,
          easing: 'easeOutQuart',
        },
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '₹' + context.parsed.y.toLocaleString('en-IN');
            }
            return label;
          },
        },
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    hover: {
      animationDuration: 200,
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 6,
        hoverBorderWidth: 3,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart',
      animateRotate: true,
      animateScale: true,
    },
    hover: {
      animationDuration: 300,
      mode: 'nearest',
      intersect: true,
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
          weight: '400',
        },
        boxPadding: 6,
        usePointStyle: true,
        animation: {
          duration: 200,
          easing: 'easeOutQuart',
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  };

  // Fetch data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch books data
        const booksResponse = await axios.get('http://localhost:4000/api/book');
        const books = booksResponse.data.books || booksResponse.data || [];

        // Fetch orders data
        const ordersResponse = await axios.get('http://localhost:4000/api/order');
        const orders = ordersResponse.data.orders || ordersResponse.data || [];

        // Fetch users data
        const usersResponse = await axios.get('http://localhost:4000/api/user/all');
        const users = usersResponse.data.users || [];

        // Process books data
        processBooksData(books);

        // Process orders data
        processOrdersData(orders);

        // Process users data
        processUsersData(users);

        // Update stats
        updateStats(books, orders, users);

        // Generate recent activity
        generateRecentActivity(books, orders, users);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data if API fails
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const processBooksData = (books) => {
    // Group books by category
    const categoryCount = {};
    books.forEach(book => {
      const category = book.category || 'Others';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Create category chart data
    const categoryLabels = Object.keys(categoryCount);
    const categoryValues = Object.values(categoryCount);

    setCategoryData({
      labels: categoryLabels,
      datasets: [{
        data: categoryValues,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 1,
      }],
    });

    // Create books trend data (mock for now - could be based on createdAt dates)
    setBooksData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Books Added',
        data: [12, 19, 15, 25, 22, books.length], // Last value is real
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }],
    });
  };

  const processOrdersData = (orders) => {
    // Calculate monthly orders
    const monthlyOrders = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt || order.date);
      const month = date.toLocaleString('default', { month: 'short' });
      monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
    });

    const monthLabels = Object.keys(monthlyOrders);
    const monthValues = Object.values(monthlyOrders);

    setOrdersData({
      labels: monthLabels,
      datasets: [{
        label: 'Orders',
        data: monthValues,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }],
    });

    // Calculate weekly revenue from actual data
    const weeklyRevenue = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt || order.date);
      const weekNum = Math.ceil((date.getDate() - date.getDay() + 1) / 7); // Get week of month
      const weekKey = `Week ${weekNum}`;
      weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + (order.totalAmount || order.amount || 0);
    });

    // If no data, use mock data
    const revenueLabels = Object.keys(weeklyRevenue).length > 0 ? Object.keys(weeklyRevenue) : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const revenueValues = Object.keys(weeklyRevenue).length > 0 ? Object.values(weeklyRevenue) : [1200, 1900, 1500, 2100];

    setRevenueData({
      labels: revenueLabels,
      datasets: [{
        label: 'Revenue (₹)',
        data: revenueValues,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      }],
    });
  };

  const processUsersData = (users) => {
    setUsers(users);
  };

  const generateRecentActivity = (books, orders, users) => {
    const activities = [];

    // Helper function to find user by ID
    const findUserById = (userId) => {
      return users.find(user => user._id === userId);
    };

    // Add recent orders
    const recentOrders = orders.slice(0, 3);
    recentOrders.forEach(order => {
      const user = findUserById(order.user);
      const userName = user ? user.name : (order.shippingAddress?.fullName || 'Unknown');
      const orderId = order.orderId || order._id?.toString().slice(-6) || 'Unknown';

      activities.push({
        id: `order-${order._id}`,
        type: 'order',
        message: `New order received from ${userName} - Order #${orderId}`,
        time: order.createdAt || order.placedAt || order.date,
        icon: '🛒',
        color: 'green'
      });
    });

    // Add recent books
    const recentBooks = books.slice(0, 2);
    recentBooks.forEach(book => {
      activities.push({
        id: `book-${book._id}`,
        type: 'book',
        message: `New book added - "${book.title || book.name}"`,
        time: book.createdAt,
        icon: '📚',
        color: 'blue'
      });
    });

    // Add recent users
    const recentUsers = users.slice(0, 2);
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user',
        message: `User registered - ${user.email}`,
        time: user.createdAt,
        icon: '👤',
        color: 'orange'
      });
    });

    // Sort by time (most recent first) and take top 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    setRecentActivity(sortedActivities);
  };

  const updateStats = (books, orders, users) => {
    // Calculate total revenue from orders
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || order.amount || 0);
    }, 0);

    // Calculate trends
    const trends = calculateTrends(books, orders);

    setStats({
      totalBooks: books.length,
      totalOrders: orders.length,
      totalRevenue: totalRevenue,
      totalUsers: users.length, // Use actual users count
      trends: trends
    });
  };

  const calculateTrends = (books, orders) => {
    // Calculate monthly data for trends
    const monthlyOrders = {};
    const monthlyRevenue = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt || order.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyOrders[monthKey] = (monthlyOrders[monthKey] || 0) + 1;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (order.totalAmount || order.amount || 0);
    });

    // Get sorted months
    const sortedMonths = Object.keys(monthlyOrders).sort();

    if (sortedMonths.length < 2) {
      return {
        books: '+0% from last month',
        orders: '+0% from last month',
        revenue: '+0% from last month',
        users: '+0% from last month'
      };
    }

    // Calculate trends (compare last two months)
    const currentMonth = sortedMonths[sortedMonths.length - 1];
    const previousMonth = sortedMonths[sortedMonths.length - 2];

    const currentOrders = monthlyOrders[currentMonth] || 0;
    const previousOrders = monthlyOrders[previousMonth] || 0;
    const ordersTrend = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders * 100) : 0;

    const currentRevenue = monthlyRevenue[currentMonth] || 0;
    const previousRevenue = monthlyRevenue[previousMonth] || 0;
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

    // For books, compare current total with previous month's additions
    const booksTrend = books.length > 0 ? Math.min(books.length * 2, 25) : 0; // Simple growth estimate

    // For users, estimate based on orders
    const usersTrend = ordersTrend * 0.8; // Assume users grow slightly less than orders

    return {
      books: `${booksTrend >= 0 ? '+' : ''}${booksTrend.toFixed(1)}% from last month`,
      orders: `${ordersTrend >= 0 ? '+' : ''}${ordersTrend.toFixed(1)}% from last month`,
      revenue: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}% from last month`,
      users: `${usersTrend >= 0 ? '+' : ''}${usersTrend.toFixed(1)}% from last month`
    };
  };

  const setMockData = () => {
    // Fallback mock data
    setBooksData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Books Added',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }],
    });

    setOrdersData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Orders',
        data: [65, 89, 80, 81, 96, 105],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }],
    });

    setCategoryData({
      labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Others'],
      datasets: [{
        data: [35, 25, 20, 10, 5, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 1,
      }],
    });

    setRevenueData({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Revenue (₹)',
        data: [1200, 1900, 1500, 2100],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      }],
    });

    // Mock users data
    setUsers([
      { _id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date(Date.now() - 86400000) },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date(Date.now() - 172800000) },
      { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', createdAt: new Date(Date.now() - 259200000) },
    ]);

    // Mock recent activity
    setRecentActivity([
      {
        id: 'order-1',
        type: 'order',
        message: 'New order received from John Doe - Order #ORD-1234',
        time: new Date(Date.now() - 120000),
        icon: '🛒',
        color: 'green'
      },
      {
        id: 'book-1',
        type: 'book',
        message: 'New book added - "The Great Gatsby"',
        time: new Date(Date.now() - 900000),
        icon: '📚',
        color: 'blue'
      },
      {
        id: 'user-1',
        type: 'user',
        message: 'User registered - john@example.com',
        time: new Date(Date.now() - 3600000),
        icon: '👤',
        color: 'orange'
      }
    ]);

    setStats({
      totalBooks: 245,
      totalOrders: 189,
      totalRevenue: 45230,
      totalUsers: 1234,
      trends: {
        books: '+12% from last month',
        orders: '-5.2% from last month',
        revenue: '+15% from last month',
        users: '-2.1% from last month'
      }
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    // Determine if trend is negative
    const isNegativeTrend = trend && trend.startsWith('-');
    const TrendIcon = isNegativeTrend ? TrendingDown : TrendingUp;
    const trendColor = isNegativeTrend ? 'text-red-600' : 'text-green-600';

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className={`text-sm ${trendColor} mt-1 flex items-center`}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your bookstore.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Books"
              value={stats.totalBooks}
              icon={BookOpen}
              color="bg-blue-500"
              trend={stats.trends?.books || '+12% from last month'}
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color="bg-green-500"
              trend={stats.trends?.orders || '+8% from last month'}
            />
            <StatCard
              title="Revenue"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
              icon={DollarSign}
              color="bg-purple-500"
              trend={stats.trends?.revenue || '+15% from last month'}
            />
            <StatCard
              title="Active Users"
              value={stats.totalUsers}
              icon={Users}
              color="bg-orange-500"
              trend={stats.trends?.users || '+5% from last month'}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Books Trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Books Added Trend</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Line data={booksData} options={chartOptions} />
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Orders</h3>
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Bar data={ordersData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Books by Category</h3>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Doughnut data={categoryData} options={doughnutOptions} />
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Line data={revenueData} options={revenueChartOptions} />
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, 5).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-4">No users found</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                    <span className="text-sm">{activity.icon}</span>
                    <p className="text-sm text-gray-600">{activity.message}</p>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getRelativeTime(activity.time)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;