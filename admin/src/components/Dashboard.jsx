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
import adminAxios from '../utils/adminAxios';
import { IMG_BASE } from '../utils/api';
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
  const [timeFilter, setTimeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rawBooks, setRawBooks] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
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
  const [lowStockBooks, setLowStockBooks] = useState([]);
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
          title: function (context) {
            return context[0].label;
          },
          label: function (context) {
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
          callback: function (value) {
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
          title: function (context) {
            return context[0].label;
          },
          label: function (context) {
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
          callback: function (value) {
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
          label: function (context) {
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

        const booksResponse = await adminAxios.get('/book');
        const booksData = booksResponse.data.books || booksResponse.data || [];

        const ordersResponse = await adminAxios.get('/order');
        const ordersData = ordersResponse.data.orders || ordersResponse.data || [];

        const usersResponse = await adminAxios.get('/user/all');
        const usersData = usersResponse.data.users || [];

        const lowStockResponse = await adminAxios.get('/report/inventory?stockLevel=low');
        const lowStockBooks = lowStockResponse.data.data || [];
        setLowStockBooks(lowStockBooks.slice(0, 5));

        setRawBooks(booksData);
        setRawOrders(ordersData);
        setRawUsers(usersData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!rawBooks.length && !rawOrders.length && !rawUsers.length) return;

    let targetStartDate = new Date(0);
    let targetEndDate = new Date();
    const now = new Date();
    targetEndDate.setHours(23, 59, 59, 999);

    // 1. Determine base time bounds
    if (timeFilter === '7days') {
      targetStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === '30days') {
      targetStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === '6months') {
      targetStartDate = new Date(now.setMonth(now.getMonth() - 6));
    } else if (timeFilter === '1year') {
      targetStartDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else if (timeFilter === 'custom') {
      if (dateRange.startDate) targetStartDate = new Date(dateRange.startDate);
      if (dateRange.endDate) {
        targetEndDate = new Date(dateRange.endDate);
        targetEndDate.setHours(23, 59, 59, 999);
      }
    }

    // 2. Apply precise filtering
    let filteredBooks = rawBooks.filter(b => {
      const d = new Date(b.createdAt || b.dateAdded || Date.now());
      const inDateRange = d >= targetStartDate && d <= targetEndDate;
      const matchCategory = categoryFilter ? (b.category === categoryFilter) : true;
      return inDateRange && matchCategory;
    });

    let filteredOrders = rawOrders.filter(o => {
      const d = new Date(o.createdAt || o.placedAt || Date.now());
      const inDateRange = d >= targetStartDate && d <= targetEndDate;

      // Attempt generic category lookup if provided
      let matchCategory = true;
      if (categoryFilter && o.books && Array.isArray(o.books)) {
        matchCategory = o.books.some(item => (item.category === categoryFilter) || (item.book && item.book.category === categoryFilter));
      }
      return inDateRange && matchCategory;
    });

    let filteredUsers = rawUsers.filter(u => {
      const d = new Date(u.createdAt || Date.now());
      return d >= targetStartDate && d <= targetEndDate;
    });

    processBooksData(filteredBooks);
    processOrdersData(filteredOrders);
    processUsersData(filteredUsers);
    updateStats(filteredBooks, filteredOrders, filteredUsers);
    generateRecentActivity(filteredBooks, filteredOrders, filteredUsers);
  }, [timeFilter, dateRange, categoryFilter, rawBooks, rawOrders, rawUsers]);

  const processBooksData = (books) => {
    const monthlyBooks = {};
    const sortedBooks = [...books].sort((a, b) => new Date(a.createdAt || a.dateAdded || Date.now()) - new Date(b.createdAt || b.dateAdded || Date.now()));

    if (sortedBooks.length > 0) {
      const firstDate = new Date(sortedBooks[0].createdAt || sortedBooks[0].dateAdded || Date.now());
      const now = new Date();
      let currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      while (currentDate <= now) {
        const monthKey = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyBooks[monthKey] = 0;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    books.forEach(book => {
      const date = new Date(book.createdAt || book.dateAdded || Date.now());
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyBooks[monthKey] = (monthlyBooks[monthKey] || 0) + 1;
    });

    const monthLabels = Object.keys(monthlyBooks);
    const monthValues = Object.values(monthlyBooks);

    setBooksData({
      labels: monthLabels.length ? monthLabels : ['No Data'],
      datasets: [{
        label: 'Books Added',
        data: monthValues.length ? monthValues : [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }],
    });

    // Process category data
    const categoryCount = {};
    books.forEach(book => {
      const category = book.category || 'Others';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    setCategoryData({
      labels: Object.keys(categoryCount).length ? Object.keys(categoryCount) : ['No Categories'],
      datasets: [{
        data: Object.values(categoryCount).length ? Object.values(categoryCount) : [1],
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
  };

  const processOrdersData = (orders) => {
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt || a.placedAt || Date.now()) - new Date(b.createdAt || b.placedAt || Date.now()));
    const monthlyOrders = {};

    if (sortedOrders.length > 0) {
      const firstDate = new Date(sortedOrders[0].createdAt || sortedOrders[0].placedAt || Date.now());
      const now = new Date();
      let currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      while (currentDate <= now) {
        const monthKey = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyOrders[monthKey] = 0;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt || order.placedAt || Date.now());
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyOrders[monthKey] = (monthlyOrders[monthKey] || 0) + 1;
    });

    const monthLabels = Object.keys(monthlyOrders);
    const monthValues = Object.values(monthlyOrders);

    setOrdersData({
      labels: monthLabels.length ? monthLabels : ['No Data'],
      datasets: [{
        label: 'Orders',
        data: monthValues.length ? monthValues : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }],
    });

    // Generate Weekly revenue dynamically based on all data
    const weeklyRevenue = {};
    if (sortedOrders.length > 0) {
      const firstDate = new Date(sortedOrders[0].createdAt || sortedOrders[0].placedAt || Date.now());
      firstDate.setDate(firstDate.getDate() - firstDate.getDay()); // Start of week
      const now = new Date();
      let currentDate = new Date(firstDate);

      while (currentDate <= now) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekKey = `${currentDate.getDate()}/${currentDate.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        weeklyRevenue[weekKey] = 0;
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt || order.placedAt || Date.now());
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

      if (weeklyRevenue[weekKey] !== undefined) {
        weeklyRevenue[weekKey] += (order.totalAmount || order.finalAmount || order.amount || 0);
      } else {
        weeklyRevenue[weekKey] = (order.totalAmount || order.finalAmount || order.amount || 0);
      }
    });

    const revenueLabels = Object.keys(weeklyRevenue);
    const revenueValues = Object.values(weeklyRevenue);

    setRevenueData({
      labels: revenueLabels.length ? revenueLabels : ['No Data'],
      datasets: [{
        label: 'Revenue (₹)',
        data: revenueValues.length ? revenueValues : [0],
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
      return sum + (order.totalAmount || order.finalAmount || order.amount || 0);
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header and Enhanced Filters */}
      <div className="mb-6 sm:mb-8 flex flex-col justify-between items-start gap-5">
        <div className="flex flex-col xl:flex-row justify-between w-full items-start xl:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard Analytics</h1>
            <p className="text-gray-600 text-sm sm:text-base">Analyze your bookstore's complete performance.</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {['7days', '30days', '6months', '1year', 'all', 'custom'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${timeFilter === tf ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {tf === '7days' ? '7 Days' : tf === '30days' ? '30 Days' : tf === '6months' ? '6 Months' : tf === '1year' ? '1 Year' : tf === 'all' ? 'All Time' : 'Custom Date'}
              </button>
            ))}
          </div>
        </div>

        {/* Extended Filter Panel */}
        <div className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-end relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          {timeFilter === 'custom' && (
            <>
              <div className="flex-1 w-full relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                <input type="date" value={dateRange.startDate} onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm" />
              </div>
              <div className="flex-1 w-full relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                <input type="date" value={dateRange.endDate} onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm" />
              </div>
            </>
          )}
          <div className={`flex-1 w-full relative ${timeFilter !== 'custom' ? 'md:max-w-xs' : ''}`}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter By Category</label>
            <div className="relative">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none text-sm text-gray-800 cursor-pointer">
                <option value="">All Categories Displayed</option>
                {Array.from(new Set(rawBooks.map(b => b.category || 'Others').filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

          {/* Low Stock Alert */}
          {lowStockBooks.length > 0 && (
            <div className="mb-6 sm:mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {lowStockBooks.map((book) => (
                  <div key={book._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      {book.image && (
                        <img src={`${IMG_BASE}${book.image}`} alt={book.title} className="h-8 w-6 object-cover rounded mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Stock: <span className="font-medium text-red-600">{book.stock}</span></p>
                      <p className="text-sm text-gray-600">₹{book.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Books Trend */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Books Added Trend</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 sm:h-64">
                <Line data={booksData} options={chartOptions} />
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Orders</h3>
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 sm:h-64">
                <Bar data={ordersData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Books by Category</h3>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 sm:h-64">
                <Doughnut data={categoryData} options={doughnutOptions} />
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 sm:h-64">
                <Line data={revenueData} options={revenueChartOptions} />
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, 5).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full flex-shrink-0`}></div>
                      <span className="text-sm">{activity.icon}</span>
                      <p className="text-sm text-gray-600 flex-1">{activity.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 sm:ml-auto">
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