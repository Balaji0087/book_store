// File: src/pages/Orders.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search, ChevronDown, ChevronUp, Truck, CreditCard, DollarSign,
  CheckCircle, Clock, AlertCircle, BookOpen, User, MapPin,
  Mail, Phone, Edit, X, Package, RefreshCw, Calendar
} from "lucide-react";
import { styles } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:4000";

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
        const { data } = await axios.get(`${API_BASE}/api/order`, { params });
        setOrders(data.orders);
        setCounts(data.counts);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        toast.error(err.response?.data?.message || 'Failed to fetch orders.');
      }
    };
    fetchOrders();
  }, [searchTerm, activeTab]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      const aVal = sortConfig.key === "date" ? new Date(a[sortConfig.key]) : a[sortConfig.key];
      const bVal = sortConfig.key === "date" ? new Date(b[sortConfig.key]) : b[sortConfig.key];
      return sortConfig.direction === "asc" ? aVal > bVal ? 1 : -1 : aVal > bVal ? -1 : 1;
    });
  }, [orders, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const viewOrder = async (orderId) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/order/${orderId}`);
      setSelectedOrder(data);
    } catch (err) {
      console.error("Failed to load order details:", err);
      toast.error(err.response?.data?.message || 'Failed to load order details.');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/order/${id}`, { orderStatus: newStatus });
      const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
      const { data } = await axios.get(`${API_BASE}/api/order`, { params });
      setOrders(data.orders);
      setCounts(data.counts);
      if (selectedOrder?._id === id) {
        const { data: fresh } = await axios.get(`${API_BASE}/api/order/${id}`);
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
      await axios.put(`${API_BASE}/api/order/${id}`, { paymentStatus: newPaymentStatus });
      const params = { ...(searchTerm && { search: searchTerm }), ...(activeTab !== "all" && { status: activeTab }) };
      const { data } = await axios.get(`${API_BASE}/api/order`, { params });
      setOrders(data.orders);
      setCounts(data.counts);
      if (selectedOrder?._id === id) {
        const { data: fresh } = await axios.get(`${API_BASE}/api/order/${id}`);
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
          <div className={styles.controlsInner}>
            <div className={styles.tabsContainer}>
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

            <div className={styles.searchContainer}>
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
                className={styles.searchInput}
                aria-label="Search orders"
              />
            </div>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Order Details: {selectedOrder.orderId}</h2>
                <p className={styles.modalSubtitle}>
                  Ordered on {new Date(selectedOrder.placedAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeButton}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}><User className={styles.sectionIcon} /> Customer Details</h3>
                <div className={styles.sectionContent}>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { icon: User, label: "Full Name", value: selectedOrder.shippingAddress.fullName },
                        { icon: Mail, label: "Email Address", value: selectedOrder.shippingAddress.email },
                        { icon: Phone, label: "Phone Number", value: selectedOrder.shippingAddress.phoneNumber },
                        {
                          icon: MapPin,
                          label: "Delivery Address",
                          value: `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zipCode}`
                        }
                      ].map((item, idx) => (
                        <div key={idx} className={styles.infoItem}>
                          <item.icon className={styles.infoIcon} />
                          <div className="flex-1">
                            <p className={styles.infoLabel}>{item.label}</p>
                            <p className={styles.infoValue}>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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

              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}><BookOpen className={styles.sectionIcon} /> Order Items</h3>
                <div className={styles.sectionContent}>
                  <div className="space-y-4">
                    {selectedOrder.books.map((bk, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <img
                            src={`${API_BASE}${bk.image}`}
                            alt={bk.title}
                            className="w-16 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base">{bk.title}</h4>
                            <p className="text-sm text-gray-600">by {bk.author}</p>
                            <p className="text-xs text-gray-500">Book ID: {bk.book}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Quantity: <span className="font-medium">{bk.quantity}</span></p>
                            <p className="text-sm text-gray-600">Price: <span className="font-medium">₹{bk.price.toFixed(2)}</span></p>
                            <p className="text-base font-semibold text-[#43C6AC]">₹{(bk.price * bk.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      {[
                        { label: "Subtotal", value: selectedOrder.totalAmount, detail: `${selectedOrder.books.length} item(s)` },
                        { label: "Shipping", value: selectedOrder.shippingCharge, detail: "Standard delivery" },
                        { label: "Tax (5%)", value: selectedOrder.taxAmount, detail: "GST included" },
                        { label: "Total", value: selectedOrder.finalAmount, isTotal: true, detail: "Amount payable" }
                      ].map((item, i) => (
                        <div key={i} className={`flex justify-between items-center ${item.isTotal ? 'pt-2 border-t border-gray-300' : ''}`}>
                          <div>
                            <span className={`font-medium ${item.isTotal ? 'text-lg text-gray-900' : 'text-gray-700'}`}>
                              {item.label}
                            </span>
                            {item.detail && (
                              <span className="text-xs text-gray-500 ml-2">({item.detail})</span>
                            )}
                          </div>
                          <span className={`font-semibold ${item.isTotal ? 'text-xl text-[#43C6AC]' : 'text-gray-900'}`}>
                            ₹{item.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}><CreditCard className={styles.sectionIcon} /> Payment Information</h3>
                <div className={styles.sectionContent}>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Payment Method</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedOrder.paymentMethod === "Online Payment"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-orange-100 text-orange-800"
                          }`}>
                          {selectedOrder.paymentMethod === "Online Payment" ? "💳 Online" : "₹ Cash on Delivery"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Current Payment Status:</span>
                          <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                        </div>
                        <div>
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
                            className={styles.statusSelect}
                          >
                            {paymentStatusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            💳 Payment status changes will be saved automatically
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#43C6AC]">₹{selectedOrder.finalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Total Amount</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.statusUpdateSection}>
                <h3 className={styles.statusUpdateTitle}>
                  <Edit className={styles.statusUpdateIcon} />
                  Order Status Management
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    <StatusBadge status={selectedOrder.orderStatus} />
                  </div>

                  <div>
                    <label htmlFor="orderStatus" className={styles.statusLabel}>Update Order Status</label>
                    <select
                      id="orderStatus"
                      name="orderStatus"
                      value={selectedOrder.orderStatus}
                      onChange={e => {
                        const newStatus = e.target.value;
                        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
                        updateStatus(selectedOrder._id, newStatus);
                      }}
                      className={styles.statusSelect}
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

            <div className={styles.modalFooter}>
              <button onClick={() => setSelectedOrder(null)} className={styles.footerButtonClose}>
                Close
              </button>
              <button onClick={() => setSelectedOrder(null)} className={styles.footerButtonSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;