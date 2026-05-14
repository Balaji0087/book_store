// File: src/pages/UserOrdersPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import logoIcon from "../../assets/logoicon.png";
import {
  ChevronDown,
  ChevronUp,
  Truck,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  ArrowLeft,
  X,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { contactPageStyles as toastStyles } from "../../assets/dummystyles";
import { API_BASE } from "../../utils/api";

const UserOrdersPage = () => {
  // Replace your static array with fetched data:
  const [orders, setOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Status badge definitions (unchanged)
  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      iconColor: "text-yellow-500",
    },
    {
      value: "processing",
      label: "Processing",
      icon: Package,
      color: "bg-blue-100 text-blue-800",
      iconColor: "text-blue-500",
    },
    {
      value: "shipped",
      label: "Shipped",
      icon: Truck,
      color: "bg-indigo-100 text-indigo-800",
      iconColor: "text-indigo-500",
    },
    {
      value: "delivered",
      label: "Delivered",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
      iconColor: "text-green-500",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      color: "bg-red-100 text-red-800",
      iconColor: "text-red-500",
    },
  ];

  // Fetch all orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.get(`${API_BASE}/order/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(data);
      } catch (err) {
        console.error("Failed to load user orders:", err);
      }
    };

    fetchOrders();
  }, []);

  // Sorting handler (unchanged)
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Apply sorting
  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      let aVal = a[sortConfig.key],
        bVal = b[sortConfig.key];
      if (sortConfig.key === "placedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      return 0;
    });
  }, [orders, sortConfig]);


  const StatusBadge = ({ status }) => {
    // case-insensitive match:
    const opt = statusOptions.find(
      (o) => o.value.toLowerCase() === status.toLowerCase()
    );
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${opt.color}`}
      >
        <Icon className={`w-4 h-4 ${opt.iconColor}`} />
        <span>{opt.label}</span>
      </div>
    );
  };

  // Fetch one order’s full details when “View Details” is clicked
  const viewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(`${API_BASE}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` } });
      setSelectedOrder(data);
    } catch (err) {
      console.error("Failed to load order details:", err);
      setToast({ visible: true, message: "Failed to load order details", type: "error" });
    }
  };

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const generateOrderPdf = async () => {
    if (!selectedOrder) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 920px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      box-sizing: border-box;
      border: 2px solid #3b82f6;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
      color: #ffffff;
      padding: 24px 28px;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    `;
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px;">
        <img src="${logoIcon}" alt="Logo" style="width:44px; height:44px; object-fit:contain; filter: brightness(1.2);" />
        <span style="font-size:36px; font-weight:900; letter-spacing:0.06em; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">BOOkSTORE</span>
      </div>
      <div style="text-align:right; font-size:14px; line-height:1.5;">
        <div style="font-size:22px; font-weight:800; letter-spacing:0.02em; color:#e0f2fe;">Order Receipt</div>
        <div style="font-size:12px; color:#bfdbfe; margin-top:4px;">Generated: ${new Date().toLocaleString()}</div>
      </div>
    `;
    wrapper.appendChild(header);

    const info = document.createElement('div');
    info.style.cssText = `
      padding: 24px 28px;
      font-size: 13px;
      line-height: 1.8;
      color: #0f172a;
      border-bottom: 1px solid #e0e7ff;
      background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%);
    `;

    const address = selectedOrder.shippingAddress || {};
    info.innerHTML = `
      <div style="font-weight:900; font-size:22px; margin-bottom:12px; color:#1e40af; letter-spacing:0.01em;">Order ID: ${selectedOrder.orderId}</div>
      <div style="font-weight:600; margin-top:10px; color:#1e40af;">📅 Date: ${new Date(selectedOrder.placedAt).toLocaleString()}</div>
      <div style="font-weight:600; margin-top:4px; color:#1e40af;">💳 Payment: ${selectedOrder.paymentMethod} | Status: <span style="color:#2563eb; font-weight:700;">${selectedOrder.orderStatus}</span></div>
      <div style="font-weight:600; margin-top:4px; color:#1e40af;">👤 Customer: ${address.fullName || 'N/A'} (${address.email || 'N/A'})</div>
      <div style="font-weight:600; margin-top:4px; color:#1e40af;">📍 Ship to: ${address.phone || 'N/A'} · ${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}</div>
    `;
    wrapper.appendChild(info);

    const table = document.createElement('table');
    table.style.cssText = `
      width: calc(100% - 56px);
      margin: 18px 28px;
      border-collapse: collapse;
      font-size: 13px;
      font-weight: 500;
    `;

    table.innerHTML = `
      <thead>
        <tr style="background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%); color:#ffffff; font-weight:900; font-size:14px; letter-spacing:0.02em;">
          <th style="padding:14px; border:2px solid #1e40af; width:40px; text-align:left;">#</th>
          <th style="padding:14px; border:2px solid #1e40af; text-align:left;">Title</th>
          <th style="padding:14px; border:2px solid #1e40af; width:68px; text-align:right;">Qty</th>
          <th style="padding:14px; border:2px solid #1e40af; width:100px; text-align:right;">Price</th>
          <th style="padding:14px; border:2px solid #1e40af; width:110px; text-align:right;">Total</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');

    selectedOrder.books.forEach((book, index) => {
      const itemTotal = Number(book.price) * Number(book.quantity);
      const row = document.createElement('tr');
      row.style.background = index % 2 === 0 ? '#f0f9ff' : '#ffffff';
      row.style.borderBottom = '1px solid #cbd5e1';
      row.innerHTML = `
        <td style="padding:12px 14px; border:1px solid #cbd5e1; font-weight:700; color:#1e40af;">${index + 1}</td>
        <td style="padding:12px 14px; border:1px solid #cbd5e1; color:#0f172a; font-weight:600;">${book.title}</td>
        <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:700; color:#2563eb;">${book.quantity}</td>
        <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:600; color:#0f172a;">Rs.${Number(book.price).toFixed(2)}</td>
        <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:800; color:#1e40af;">Rs.${itemTotal.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    const totals = document.createElement('div');
    totals.style.cssText = `
      padding: 16px 28px;
      text-align: right;
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
      background: linear-gradient(to right, #eff6ff 0%, #e0f2fe 50%, #faf9f6 100%);
      border-top: 2px solid #3b82f6;
    `;

    const subtotal = Number((selectedOrder.finalAmount || selectedOrder.totalAmount || 0) - (selectedOrder.taxAmount || 0) - (selectedOrder.shippingCharge || 0)).toFixed(2);
    const shipping = Number(selectedOrder.shippingCharge || 0).toFixed(2);
    const tax = Number(selectedOrder.taxAmount || 0).toFixed(2);
    const total = Number(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toFixed(2);

    totals.innerHTML = `
      <div style="margin-bottom:6px; color:#0f172a;">Subtotal: <span style="color:#2563eb; font-weight:900;">Rs.${subtotal}</span></div>
      <div style="margin-bottom:6px; color:#0f172a;">Shipping: <span style="color:#2563eb; font-weight:900;">Rs.${shipping}</span></div>
      <div style="margin-bottom:8px; color:#0f172a;">Tax: <span style="color:#2563eb; font-weight:900;">Rs.${tax}</span></div>
      <div style="font-size:18px; font-weight:900; color:#0f172a; padding:10px 0; border-top:2px solid #bfdbfe; border-bottom:2px solid #bfdbfe; margin-top:8px;">Total: <span style="color:#1e40af;">Rs.${total}</span></div>
    `;

    wrapper.appendChild(totals);

    const footer = document.createElement('div');
    footer.style.cssText = `
      border-top: 2px solid #3b82f6;
      padding: 14px 28px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      font-weight: 600;
      background: linear-gradient(to right, #f0f9ff 0%, #ffffff 100%);
      font-style: italic;
    `;
    footer.innerText = '✓ Thank you for choosing BOOkstore!';
    wrapper.appendChild(footer);

    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '-9999px';
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: wrapper.offsetWidth,
      height: wrapper.offsetHeight,
      scrollX: 0,
      scrollY: 0,
    });

    document.body.removeChild(wrapper);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let positionY = 10;
    pdf.addImage(imgData, 'PNG', 10, positionY, imgWidth, imgHeight);

    if (imgHeight > pdfHeight - 20) {
      let remaining = imgHeight - (pdfHeight - 20);
      while (remaining > 0) {
        pdf.addPage();
        positionY = 10 - (pdfHeight - 20 - remaining);
        pdf.addImage(imgData, 'PNG', 10, positionY, imgWidth, imgHeight);
        remaining -= (pdfHeight - 20);
      }
    }

    pdf.save(`bookseller-order-${selectedOrder.orderId}.pdf`);
  };

  const sendOrderDetailsByEmail = async () => {
    if (!selectedOrder || !selectedOrder.shippingAddress?.email) {
      setToast({ visible: true, message: "Order email is missing.", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${API_BASE}/order/${selectedOrder._id}/send-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ visible: true, message: "Order details were sent to your email successfully.", type: "success" });
    } catch (error) {
      console.error("Failed to send email:", error);
      setToast({ visible: true, message: "Unable to send email automatically. Please check your mail settings.", type: "error" });
    }
  };

  const shareOrderToWhatsApp = async () => {
    if (!selectedOrder) return;

    try {
      setToast({ visible: true, message: "Generating PDF for sharing...", type: "success" });

      // Generate PDF using the existing logic
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        width: 920px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #0f172a;
        background-color: #ffffff;
        box-sizing: border-box;
        border: 2px solid #3b82f6;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
        color: #ffffff;
        padding: 24px 28px;
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      `;
      header.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px;">
          <img src="${logoIcon}" alt="Logo" style="width:44px; height:44px; object-fit:contain; filter: brightness(1.2);" />
          <span style="font-size:36px; font-weight:900; letter-spacing:0.06em; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">BOOkSTORE</span>
        </div>
        <div style="text-align:right; font-size:14px; line-height:1.5;">
          <div style="font-size:22px; font-weight:800; letter-spacing:0.02em; color:#e0f2fe;">Order Receipt</div>
          <div style="font-size:12px; color:#bfdbfe; margin-top:4px;">Generated: ${new Date().toLocaleString()}</div>
        </div>
      `;
      wrapper.appendChild(header);

      const info = document.createElement('div');
      info.style.cssText = `
        padding: 24px 28px;
        font-size: 13px;
        line-height: 1.8;
        color: #0f172a;
        border-bottom: 1px solid #e0e7ff;
        background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%);
      `;

      const address = selectedOrder.shippingAddress || {};
      info.innerHTML = `
        <div style="font-weight:900; font-size:22px; margin-bottom:12px; color:#1e40af; letter-spacing:0.01em;">Order ID: ${selectedOrder.orderId}</div>
        <div style="font-weight:600; margin-top:10px; color:#1e40af;">📅 Date: ${new Date(selectedOrder.placedAt).toLocaleString()}</div>
        <div style="font-weight:600; margin-top:4px; color:#1e40af;">💳 Payment: ${selectedOrder.paymentMethod} | Status: <span style="color:#2563eb; font-weight:700;">${selectedOrder.orderStatus}</span></div>
        <div style="font-weight:600; margin-top:4px; color:#1e40af;">👤 Customer: ${address.fullName || 'N/A'} (${address.email || 'N/A'})</div>
        <div style="font-weight:600; margin-top:4px; color:#1e40af;">📍 Ship to: ${address.phone || 'N/A'} · ${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}</div>
      `;
      wrapper.appendChild(info);

      const table = document.createElement('table');
      table.style.cssText = `
        width: calc(100% - 56px);
        margin: 18px 28px;
        border-collapse: collapse;
        font-size: 13px;
        font-weight: 500;
      `;

      table.innerHTML = `
        <thead>
          <tr style="background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%); color:#ffffff; font-weight:900; font-size:14px; letter-spacing:0.02em;">
            <th style="padding:14px; border:2px solid #1e40af; width:40px; text-align:left;">#</th>
            <th style="padding:14px; border:2px solid #1e40af; text-align:left;">Title</th>
            <th style="padding:14px; border:2px solid #1e40af; width:68px; text-align:right;">Qty</th>
            <th style="padding:14px; border:2px solid #1e40af; width:100px; text-align:right;">Price</th>
            <th style="padding:14px; border:2px solid #1e40af; width:110px; text-align:right;">Total</th>
          </tr>
        </thead>
      `;

      const tbody = document.createElement('tbody');

      selectedOrder.books.forEach((book, index) => {
        const itemTotal = Number(book.price) * Number(book.quantity);
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f0f9ff' : '#ffffff';
        row.style.borderBottom = '1px solid #cbd5e1';
        row.innerHTML = `
          <td style="padding:12px 14px; border:1px solid #cbd5e1; font-weight:700; color:#1e40af;">${index + 1}</td>
          <td style="padding:12px 14px; border:1px solid #cbd5e1; color:#0f172a; font-weight:600;">${book.title}</td>
          <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:700; color:#2563eb;">${book.quantity}</td>
          <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:600; color:#0f172a;">Rs.${Number(book.price).toFixed(2)}</td>
          <td style="padding:12px 14px; border:1px solid #cbd5e1; text-align:right; font-weight:800; color:#1e40af;">Rs.${itemTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      wrapper.appendChild(table);

      const totals = document.createElement('div');
      totals.style.cssText = `
        padding: 16px 28px;
        text-align: right;
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
        background: linear-gradient(to right, #eff6ff 0%, #e0f2fe 50%, #faf9f6 100%);
        border-top: 2px solid #3b82f6;
      `;

      const subtotal = Number((selectedOrder.finalAmount || selectedOrder.totalAmount || 0) - (selectedOrder.taxAmount || 0) - (selectedOrder.shippingCharge || 0)).toFixed(2);
      const shipping = Number(selectedOrder.shippingCharge || 0).toFixed(2);
      const tax = Number(selectedOrder.taxAmount || 0).toFixed(2);
      const total = Number(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toFixed(2);

      totals.innerHTML = `
        <div style="margin-bottom:6px; color:#0f172a;">Subtotal: <span style="color:#2563eb; font-weight:900;">Rs.${subtotal}</span></div>
        <div style="margin-bottom:6px; color:#0f172a;">Shipping: <span style="color:#2563eb; font-weight:900;">Rs.${shipping}</span></div>
        <div style="margin-bottom:8px; color:#0f172a;">Tax: <span style="color:#2563eb; font-weight:900;">Rs.${tax}</span></div>
        <div style="font-size:18px; font-weight:900; color:#0f172a; padding:10px 0; border-top:2px solid #bfdbfe; border-bottom:2px solid #bfdbfe; margin-top:8px;">Total: <span style="color:#1e40af;">Rs.${total}</span></div>
      `;

      wrapper.appendChild(totals);

      const footer = document.createElement('div');
      footer.style.cssText = `
        border-top: 2px solid #3b82f6;
        padding: 14px 28px;
        font-size: 12px;
        color: #64748b;
        text-align: center;
        font-weight: 600;
        background: linear-gradient(to right, #f0f9ff 0%, #ffffff 100%);
        font-style: italic;
      `;
      footer.innerText = '✓ Thank you for choosing BOOkstore!';
      wrapper.appendChild(footer);

      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '-9999px';
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let positionY = 10;
      pdf.addImage(imgData, 'PNG', 10, positionY, imgWidth, imgHeight);

      if (imgHeight > pdfHeight - 20) {
        let remaining = imgHeight - (pdfHeight - 20);
        while (remaining > 0) {
          pdf.addPage();
          positionY = 10 - (pdfHeight - 20 - remaining);
          pdf.addImage(imgData, 'PNG', 10, positionY, imgWidth, imgHeight);
          remaining -= (pdfHeight - 20);
        }
      }

      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      const fileName = `bookseller-order-${selectedOrder.orderId}.pdf`;

      // Check if Web Share API is available
      if (navigator.share) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await navigator.share({
          files: [file],
          title: 'BOOkstore Order Receipt',
          text: `Order Receipt - ${selectedOrder.orderId}`,
        });
        setToast({ visible: true, message: "Order receipt shared successfully!", type: "success" });
      } else {
        // Fallback: auto-download if Web Share API not available
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ visible: true, message: "PDF downloaded. Share it manually via WhatsApp.", type: "success" });
      }
    } catch (error) {
      console.error("Failed to share PDF to WhatsApp:", error);
      setToast({ visible: true, message: "Unable to share PDF. Please try again.", type: "error" });
    }
  };

  return (
    <>
      <Navbar />
      {toast.visible && (
        <div className={toastStyles.toastStyle(toast.type)}>{toast.message}</div>
      )}
      <div className="min-h-screen bg-[#E0F2FE] pt-28 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-[#1E3A8A] hover:text-[#60A5FA] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
            <h1 className="text-3xl font-bold text-center flex-1 text-gray-900">
              My Orders
            </h1>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] text-white">
                  <tr>
                    {[
                      { key: "orderId", label: "Order ID" },
                      { key: "date", label: "Date" },
                      { key: "finalAmount", label: "Amount" },
                      { key: null, label: "Payment" },
                      { key: null, label: "Status" },
                      { key: null, label: "Actions" },
                    ].map((col) => (
                      <th
                        key={col.key || col.label}
                        className="px-6 py-4 text-left cursor-pointer"
                        onClick={() => col.key && handleSort(col.key)}
                      >
                        <div className="flex items-center">
                          {col.label}
                          {col.key &&
                            sortConfig.key === col.key &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1" />
                            ) : (
                              <ChevronDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {o.orderId}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(o.placedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹{o.finalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${o.paymentMethod === "Online Payment"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                            }`}
                        >
                          {o.paymentMethod === "Online Payment" ? (
                            <CreditCard className="w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                          <span>
                            {o.paymentMethod === "Online Payment"
                              ? "Online"
                              : "COD"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={o.orderStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewDetails(o._id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] text-white rounded-lg text-xs hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {!sortedOrders.length && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Package className="text-gray-400 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No orders found
                  </h3>
                  <p className="text-gray-500 text-sm">
                    You haven't placed any orders yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden border-opacity-60">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
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
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto max-h-[60vh]">
                {/* Shipping Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    Shipping Information
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="font-medium text-gray-800">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-gray-600 text-sm">{selectedOrder.shippingAddress.email}</p>
                      <p className="text-gray-600 text-sm">{selectedOrder.shippingAddress.phone}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-gray-700">
                        {selectedOrder.shippingAddress.street}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      </p>
                    </div>
                    <div className="flex items-center bg-white/60 rounded-lg p-4">
                      <Truck className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Standard Shipping</p>
                        <p className="text-gray-600 text-sm">
                          Estimated 3-5 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Order Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-3 text-green-600" />
                    Order Summary
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.books.map((book, i) => (
                      <div key={i} className="flex items-start space-x-4 bg-white/60 rounded-lg p-4 shadow-sm">
                        {/* Book image */}
                        <img
                          src={`${API_BASE}${book.image}`}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded-lg shadow-sm"
                        />

                        {/* Book metadata */}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author || 'Unknown Author'}</p>
                          <p className="text-sm text-gray-500">₹{book.price.toFixed(2)} each</p>
                        </div>

                        {/* Quantity & price */}
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Qty: {book.quantity}</p>
                          <p className="text-green-600 font-semibold">
                            ₹{(book.price * book.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="bg-white/80 rounded-lg p-4 space-y-3">
                      {[
                        {
                          label: "Subtotal:",
                          value: `₹${((selectedOrder.finalAmount || 0) - (selectedOrder.shippingCharge || 0) - (selectedOrder.taxAmount || 0)).toFixed(2)}`,
                        },
                        {
                          label: "Shipping:",
                          value: `₹${(selectedOrder.shippingCharge || 0).toFixed(2)}`,
                        },
                        {
                          label: "Tax (5%):",
                          value: `₹${(selectedOrder.taxAmount || 0).toFixed(2)}`,
                        },
                        {
                          label: "Total:",
                          value: `₹${(selectedOrder.finalAmount || 0).toFixed(2)}`,
                          className: "font-bold text-lg text-green-700 pt-2 border-t border-green-200",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex justify-between ${item.className || "text-gray-700"}`}
                        >
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                {/* Payment Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-3 text-purple-600" />
                    Payment Information
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/60 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Method:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.paymentMethod === "Online Payment"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                          }`}
                      >
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
                      <span className="text-gray-700 font-medium">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status & Tracking Timeline */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-3 text-orange-600" />
                    Tracking Timeline
                  </h3>
                  <div className="bg-white/60 rounded-lg p-6">
                    {selectedOrder.statusTimeline && selectedOrder.statusTimeline.length > 0 ? (
                      <div className="relative border-l-2 border-orange-300 ml-3 space-y-6">
                        {selectedOrder.statusTimeline.map((tl, index) => (
                          <div key={index} className="relative pl-6">
                            <span className="absolute -left-[11px] bg-orange-500 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center"></span>
                            <div className="font-semibold text-gray-800 text-sm md:text-base">{tl.status}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(tl.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-sm text-gray-500 mb-3">Current Status</div>
                        <StatusBadge status={selectedOrder.orderStatus} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/80 border-t border-gray-200 p-6 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={generateOrderPdf}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Download PDF
                  </div>
                </button>
                <button
                  onClick={sendOrderDetailsByEmail}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Send Email
                  </div>
                </button>
                <button
                  onClick={shareOrderToWhatsApp}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Share WhatsApp
                  </div>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Close
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default UserOrdersPage;
