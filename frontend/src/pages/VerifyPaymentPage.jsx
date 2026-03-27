import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyPaymentPage = () => {
  const [statusMsg, setStatusMsg] = useState("Verifying payment...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const session_id = searchParams.get("session_id");
  const token = localStorage.getItem("authToken");
  const apiBase = "http://localhost:4000";

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
      .then(() => {
        setStatusMsg("Payment confirmed! Redirecting to your orders…");
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
