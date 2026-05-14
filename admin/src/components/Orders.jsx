// File: src/pages/Orders.jsx
import React, { useState, useEffect, useMemo } from "react";
import adminAxios from "../utils/adminAxios";
import {
  Search, ChevronDown, ChevronUp, Truck, CreditCard, DollarSign,
  CheckCircle, Clock, AlertCircle, BookOpen, User, MapPin,
  Mail, Phone, Edit, X, Package, RefreshCw, Calendar, Check
} from "lucide-react";
import { styles } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const statusOptions = [
  {
    value: "Pending",
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    iconColor: "text-yellow-500",
  },
  {
    value: "Processing",
    label: "Processing",
    icon: RefreshCw,
    color: "bg-blue-100 text-blue-800",
    iconColor: "text-blue-500",
  },
  {
    value: "Shipped",
    label: "Shipped",
    icon: Truck,
    color: "bg-indigo-100 text-indigo-800",
    iconColor: "text-indigo-500",
  },
  {
    value: "Delivered",
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    iconColor: "text-green-500",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800",
    iconColor: "text-red-500",
  },
];

const paymentStatusOptions = [
  {
    value: "Unpaid",
    label: "Unpaid",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    iconColor: "text-yellow-500",
  },
  {
    value: "Paid",
    label: "Paid",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    iconColor: "text-green-500",
  },
  {
    value: "Failed",
    label: "Failed",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800",
    iconColor: "text-red-500",
  },
  {
    value: "Refunded",
    label: "Refunded",
    icon: DollarSign,
    color: "bg-blue-100 text-blue-800",
    iconColor: "text-blue-500",
  },
];

const tabs = [
  { id: "all", label: "All Orders" },
  ...statusOptions.map(o => ({ id: o.value, label: o.label })),
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({ totalOrders: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, pendingPayment: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
        const { data } = await adminAxios.get('/order', { params });
        setOrders(data.orders);
        setCounts(data.counts);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        toast.error(err.response?.data?.message || 'Failed to fetch orders.');
      }
    };
    fetchOrders();
  }, [searchTerm, activeTab]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab !== "all" && order.orderStatus !== activeTab) return false;
      if (paymentMethodFilter !== "all" && order.paymentMethod !== paymentMethodFilter) return false;
      if (paymentStatusFilter !== "all" && order.paymentStatus !== paymentStatusFilter) return false;
      return true;
    });
  }, [orders, activeTab, paymentMethodFilter, paymentStatusFilter]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      const aVal = sortConfig.key === "date" ? new Date(a[sortConfig.key]) : a[sortConfig.key];
      const bVal = sortConfig.key === "date" ? new Date(b[sortConfig.key]) : b[sortConfig.key];
      return sortConfig.direction === "asc" ? aVal > bVal ? 1 : -1 : aVal > bVal ? -1 : 1;
    });
  }, [filteredOrders, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const viewOrder = async (orderId) => {
    try {
      const { data } = await adminAxios.get(`/order/${orderId}`);
      setSelectedOrder(data);
    } catch (err) {
      console.error("Failed to load order details:", err);
      toast.error(err.response?.data?.message || 'Failed to load order details.');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await adminAxios.put(`/order/${id}`, { orderStatus: newStatus });
      const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
      const { data } = await adminAxios.get('/order', { params });
      setOrders(data.orders);
      setCounts(data.counts);
      if (selectedOrder?._id === id) {
        const { data: fresh } = await adminAxios.get(`/order/${id}`);
        setSelectedOrder(fresh);
      }
      toast.success('Order status updated');
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const updatePaymentStatus = async (id, newPaymentStatus) => {
    try {
      await adminAxios.put(`/order/${id}`, { paymentStatus: newPaymentStatus });
      const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
      const { data } = await adminAxios.get('/order', { params });
      setOrders(data.orders);
      setCounts(data.counts);
      if (selectedOrder?._id === id) {
        const { data: fresh } = await adminAxios.get(`/order/${id}`);
        setSelectedOrder(fresh);
      }
      toast.success('Payment status updated');
    } catch (err) {
      console.error("Failed to update payment status:", err);
      toast.error(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  const StatusBadge = ({ status }) => {
    const opt = statusOptions.find(o => o.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${opt.color}`}>
        <Icon className={`w-4 h-4 ${opt.iconColor}`} />
        <span>{opt.label}</span>
      </div>
    );
  };

  const PaymentStatusBadge = ({ status }) => {
    const opt = paymentStatusOptions.find(o => o.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${opt.color}`}>
        <Icon className={`w-4 h-4 ${opt.iconColor}`} />
        <span>{opt.label}</span>
      </div>
    );
  };

  const stats = [
    { label: "Total Orders", value: counts.totalOrders, icon: Package, color: "bg-indigo-100", iconColor: "text-[#43C6AC]" },
    { label: "Processing", value: counts.processing, icon: RefreshCw, color: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Delivered", value: counts.delivered, icon: CheckCircle, color: "bg-green-100", iconColor: "text-green-600" },
    { label: "Paid Orders", value: counts.totalOrders - counts.pendingPayment, icon: CreditCard, color: "bg-green-100", iconColor: "text-green-600" }
  ];

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        <div className="mb-8">
          <h1 className={styles.headerTitle}>Order Management</h1>
          <p className={styles.headerSubtitle}>Track and manage all customer orders</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className={styles.statsCard}>
              <div className={styles.statsCardContent}>
                <div>
                  <p className={styles.statsCardLabel}>{stat.label}</p>
                  <p className={styles.statsCardValue}>{stat.value}</p>
                </div>
                <div className={styles.statsIconContainer(stat.color)}>
                  <stat.icon className={styles.statsIcon(stat.iconColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.controlsContainer}>
          <div className="rounded-xl p-4 bg-white shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-[360px]">
                  <div className={styles.searchIcon}>
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="Search orders, customers, or books..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    aria-label="Search orders"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="Online Payment">Online Payment</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>

                  <select
                    value={paymentStatusFilter}
                    onChange={e => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Payment Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveTab("all");
                    setPaymentMethodFilter("all");
                    setPaymentStatusFilter("all");
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Tab: {activeTab === "all" ? "All" : activeTab}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Payment: {paymentMethodFilter}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Status: {paymentStatusFilter}</span>
            </div>
          </div>

          <div className={styles.tabsContainer + " mt-4"}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={styles.tabButton(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.ordersTableContainer}>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  {["id", "customer", "date", "amount"].map(key => (
                    <th key={key} className={styles.tableHeader} onClick={() => handleSort(key)}>
                      <div className={styles.tableHeaderContent}>
                        {key === "id" ? "Order ID" : key.charAt(0).toUpperCase() + key.slice(1)}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig.key === key ?
                            (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) :
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className={styles.tableHeader}>Payment</th>
                  <th className={styles.tableHeader}>Payment Status</th>
                  <th className={styles.tableHeader}>Order Status</th>
                  <th className={`${styles.tableHeader} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedOrders.map(order => (
                  <tr key={order._id} className={styles.tableRow}>
                    <td className={`${styles.tableCell} ${styles.idCell}`}>{order.orderId}</td>
                    <td className={`${styles.tableCell} ${styles.customerCell}`}>{order.shippingAddress.fullName}</td>
                    <td className={`${styles.tableCell} ${styles.dateCell}`}>
                      {new Date(order.placedAt).toLocaleDateString()}
                    </td>
                    <td className={`${styles.tableCell} ${styles.amountCell}`}>₹{order.finalAmount.toFixed(2)}</td>
                    <td className={styles.tableCell}>
                      <div className={styles.paymentBadge(order.paymentMethod === "Online Payment")}>
                        {order.paymentMethod === "Online Payment" ?
                          <CreditCard className="w-4 h-4" /> :
                          <Package className="w-4 h-4" />
                        }
                        <span>{order.paymentMethod === "Online Payment" ? "Online" : "₹ COD"}</span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className={styles.tableCell}>
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className={`${styles.tableCell} text-right`}>
                      <button onClick={() => viewOrder(order._id)} className={styles.viewButton}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!sortedOrders.length && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconContainer}>
                  <BookOpen className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>No orders found</h3>
                <p className={styles.emptyMessage}>Try adjusting your search or filter</p>
              </div>
            )}

            <div className={styles.tableFooter}>
              <div className={styles.footerText}>
                Showing <span className="font-medium">{sortedOrders.length}</span> of{" "}
                <span className="font-medium">{counts.totalOrders}</span> orders
              </div>
              <div className={styles.footerLegend}>
                {[
                  { label: "Online Payment", color: "bg-purple-500" },
                  { label: "₹ Cash on Delivery", color: "bg-orange-500" }
                ].map((i, idx) => (
                  <div key={idx} className={styles.legendItem}>
                    <div className={styles.legendDot(i.color)}></div>
                    <span className={styles.legendLabel}>{i.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden border-opacity-60">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    Order #{selectedOrder.orderId}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Ordered on {new Date(selectedOrder.placedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-3 text-blue-600" />
                  Customer Details
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="font-medium text-gray-800">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-gray-600 text-sm">{selectedOrder.shippingAddress.email}</p>
                    <p className="text-gray-600 text-sm">{selectedOrder.shippingAddress.phoneNumber}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-gray-700">
                      {selectedOrder.shippingAddress.street}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Order Timeline</p>
                        <p className="text-sm text-blue-700">
                          Ordered on {new Date(selectedOrder.placedAt).toLocaleDateString()} at {new Date(selectedOrder.placedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-3 text-green-600" />
                  Order Items
                </h3>
                <div className="space-y-4">
                  {selectedOrder.books.map((bk, i) => (
                    <div key={i} className="flex items-start space-x-4 bg-white/60 rounded-lg p-4 shadow-sm">
                      <img
                        src={`${API_BASE}${bk.image}`}
                        alt={bk.title}
                        className="w-16 h-20 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{bk.title}</p>
                        <p className="text-sm text-gray-600">by {bk.author || 'Unknown Author'}</p>
                        <p className="text-xs text-gray-500">Book ID: {bk.book}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">Qty: {bk.quantity}</p>
                        <p className="text-gray-500 text-sm">₹{bk.price.toFixed(2)} each</p>
                        <p className="text-green-600 font-semibold">₹{(bk.price * bk.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  <div className="bg-white/80 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Order Summary</h4>
                    {[
                      { label: "Subtotal", value: selectedOrder.totalAmount || 0, detail: `${selectedOrder.books.length} item(s)` },
                      { label: "Shipping", value: selectedOrder.shippingCharge || 0, detail: "Standard delivery" },
                      { label: "Tax (5%)", value: selectedOrder.taxAmount || 0, detail: "GST included" },
                      { label: "Total", value: selectedOrder.finalAmount || 0, isTotal: true, detail: "Amount payable" }
                    ].map((item, i) => (
                      <div key={i} className={`flex justify-between items-center ${item.isTotal ? 'pt-2 border-t border-green-200' : ''}`}>
                        <div>
                          <span className={`font-medium ${item.isTotal ? 'text-lg text-gray-900' : 'text-gray-700'}`}>
                            {item.label}
                          </span>
                          {item.detail && (
                            <span className="text-xs text-gray-500 ml-2">({item.detail})</span>
                          )}
                        </div>
                        <span className={`font-semibold ${item.isTotal ? 'text-xl text-green-700' : 'text-gray-900'}`}>
                          ₹{item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-3 text-purple-600" />
                  Payment Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/60 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Payment Method:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.paymentMethod === "Online Payment"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-orange-100 text-orange-800"
                      }`}>
                      {selectedOrder.paymentMethod === "Online Payment" ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Online Payment
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cash on Delivery
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Payment Status:</span>
                    <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <label htmlFor="paymentStatus" className="block text-sm font-semibold text-gray-900 mb-2">
                      Update Payment Status
                    </label>
                    <select
                      id="paymentStatus"
                      name="paymentStatus"
                      value={selectedOrder.paymentStatus}
                      onChange={e => {
                        const newStatus = e.target.value;
                        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
                        updatePaymentStatus(selectedOrder._id, newStatus);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {paymentStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      💳 Payment status changes will be saved automatically
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 text-center border border-purple-200">
                    <p className="text-2xl font-bold text-purple-700">₹{selectedOrder.finalAmount.toFixed(2)}</p>
                    <p className="text-sm text-purple-600">Total Amount</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-3 text-orange-600" />
                  Order Status Management
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/60 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Current Status:</span>
                    <StatusBadge status={selectedOrder.orderStatus} />
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <label htmlFor="orderStatus" className="block text-sm font-semibold text-gray-900 mb-2">
                      Update Order Status
                    </label>
                    <select
                      id="orderStatus"
                      name="orderStatus"
                      value={selectedOrder.orderStatus}
                      onChange={e => {
                        const newStatus = e.target.value;
                        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
                        updateStatus(selectedOrder._id, newStatus);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Status changes will be saved automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/80 border-t border-gray-200 p-6 flex flex-wrap gap-3 justify-end">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Close
                </div>
              </button>
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Save Changes
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;