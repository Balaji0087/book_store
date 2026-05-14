import Order from '../models/orderModel.js';
import Book from '../models/bookModel.js';
import User from '../models/userModel.js';

// Get sales report with filters
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, category, status, customerId } = req.query;

    let matchConditions = {};

    // Date range filter
    if (startDate && endDate) {
      matchConditions.placedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Order status filter
    if (status) {
      matchConditions.orderStatus = status;
    }

    // Customer filter
    if (customerId) {
      matchConditions.user = customerId;
    }

    // Category filter - need to join with books
    let pipeline = [
      {
        $match: matchConditions
      },
      {
        $unwind: '$books'
      }
    ];

    if (category) {
      pipeline.push({
        $lookup: {
          from: 'books',
          localField: 'books.book',
          foreignField: '_id',
          as: 'bookDetails'
        }
      });
      pipeline.push({
        $unwind: '$bookDetails'
      });
      pipeline.push({
        $match: {
          'bookDetails.category': category
        }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt' } },
            status: '$orderStatus'
          },
          totalRevenue: { $sum: { $multiply: ['$books.price', '$books.quantity'] } },
          totalOrders: { $sum: 1 },
          totalBooks: { $sum: '$books.quantity' }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    );

    const salesData = await Order.aggregate(pipeline);

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report'
    });
  }
};

// Get inventory report
export const getInventoryReport = async (req, res) => {
  try {
    const { category, stockLevel } = req.query;

    let matchConditions = {};

    if (category) {
      matchConditions.category = category;
    }

    const books = await Book.find(matchConditions).sort({ createdAt: -1 });

    let inventoryData = books.map(book => ({
      ...book.toObject(),
      status: book.stock === 0 ? 'Out of Stock' : book.stock < 10 ? 'Low Stock' : 'In Stock'
    }));

    if (stockLevel === 'low') {
      inventoryData = inventoryData.filter(item => item.stock < 10);
    } else if (stockLevel === 'out') {
      inventoryData = inventoryData.filter(item => item.stock === 0);
    }

    res.json({
      success: true,
      data: inventoryData
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report'
    });
  }
};

// Get customer report
export const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchConditions = {};

    if (startDate && endDate) {
      matchConditions.placedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const customerData = await Order.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$finalAmount' },
          lastOrderDate: { $max: '$placedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          customerId: '$_id',
          name: '$userDetails.name',
          email: '$userDetails.email',
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
          _id: 0
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    res.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating customer report'
    });
  }
};

// Get order status report
export const getOrderStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchConditions = {};

    if (startDate && endDate) {
      matchConditions.placedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const statusData = await Order.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('Error generating order status report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating order status report'
    });
  }
};

// Get sales forecasting
export const getForecast = async (req, res) => {
  try {
    // 1. Fetch orders from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Group by Year and Month
    const historicalData = await Order.aggregate([
      {
        $match: {
          placedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$placedAt" },
            month: { $month: "$placedAt" }
          },
          totalSales: { $sum: "$finalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // If not enough data, just return the data
    if (historicalData.length < 2) {
      return res.json({
        success: true,
        data: {
          historical: historicalData.map((d, i) => ({ monthIndex: i + 1, label: `${d._id.year}-${d._id.month}`, totalSales: d.totalSales })),
          forecast: null,
          message: "Not enough historical data for a precise forecast."
        }
      });
    }

    // Prepare data for Linear Regression (y = mx + b)
    // x = month index (1, 2, 3...)
    // y = total sales
    let n = historicalData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    const formattedHistory = historicalData.map((d, i) => {
      let x = i + 1;
      let y = d.totalSales;
      sumX += x;
      sumY += y;
      sumXY += (x * y);
      sumXX += (x * x);
      return {
        monthIndex: x,
        label: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
        totalSales: y
      };
    });

    // Calculate slope (m) and intercept (b)
    let m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let b = (sumY - m * sumX) / n;

    // Forecast for the next month (x = n + 1)
    let nextMonthIndex = n + 1;
    let nextMonthSales = Math.max(0, m * nextMonthIndex + b); // Keep it above 0

    // Next month label
    let lastRecord = historicalData[historicalData.length - 1]._id;
    let nextMonth = lastRecord.month + 1;
    let nextYear = lastRecord.year;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }

    const forecastInfo = {
        monthIndex: nextMonthIndex,
        label: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
        predictedSales: Number(nextMonthSales.toFixed(2))
    };

    res.json({
      success: true,
      data: {
        historical: formattedHistory,
        forecast: forecastInfo
      }
    });

  } catch (error) {
    console.error('Error generating sales forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales forecast'
    });
  }
};