import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyPaymentPage = () => {
  const [statusMsg, setStatusMsg] = useState("Verifying payment...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const session_id = searchParams.get("session_id");
  const token = localStorage.getItem("authToken");
  const apiBase = API_BASE;

  const sanitizeWhatsappNumber = (phone) => {
    if (!phone) return '';
    const dialed = phone.replace(/\D/g, '');
    if (dialed.length === 10) return `91${dialed}`;
    if (dialed.length === 11 && dialed.startsWith('0')) return `91${dialed.slice(1)}`;
    if (dialed.length >= 12 && dialed.startsWith('91')) return dialed;
    return dialed;
  };

  const sendOrderDetailsToWhatsapp = (order) => {
    if (!order?.shippingAddress?.phone) return;
    const cleanedPhone = sanitizeWhatsappNumber(order.shippingAddress.phone);

    if (!cleanedPhone) return;

    const itemLines = (order.books || []).map(item => {
      const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
      return `• ${item.title} x${item.quantity} @ ₹${Number(item.price).toFixed(2)} = ₹${itemTotal}`;
    }).join('\n');

    const message = [
      '📦 Your BookSeller Order Confirmation',
      `Order ID: ${order.orderId || 'N/A'}`,
      `Name: ${order.shippingAddress.fullName || ''}`,
      `Email: ${order.shippingAddress.email || ''}`,
      `Phone: ${order.shippingAddress.phone || ''}`,
      `Address: ${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}`,
      '',
      '🛒 Items Ordered:',
      itemLines,
      '',
      `Subtotal: ₹${Number(order.totalAmount - order.taxAmount || 0).toFixed(2)}`,
      `Tax: ₹${Number(order.taxAmount || 0).toFixed(2)}`,
      `Total: ₹${Number(order.totalAmount || 0).toFixed(2)}`,
      `Payment: ${order.paymentMethod || ''}`,
      '',
      'Thank you for shopping with BookSeller!',
    ].join('\n');

    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  useEffect(() => {
    if (!session_id) {
      setStatusMsg("Session ID is missing.");
      return;
    }

    axios
      .get(`${apiBase}/api/order/confirm`, {
        params: { session_id },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then(({ data }) => {
        setStatusMsg("Payment confirmed! Redirecting to your orders…");
        if (data) {
          sendOrderDetailsToWhatsapp(data);
        }
        setTimeout(() => navigate("/orders", { replace: true }), 2000);
      })
      .catch((err) => {
        console.error("Confirmation error:", err);
        setStatusMsg(
          err.response?.data?.message ||
            "Error confirming payment. Please contact support."
        );
      });
  }, [session_id, apiBase, navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0F2FE] text-gray-900">
      <p className="text-lg">{statusMsg}</p>
      <h2>jkhkdfkd</h2>
    </div>
  );
};

export default VerifyPaymentPage;
