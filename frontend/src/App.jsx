// Updated App.js
import React from "react";
import { Route, Routes } from "react-router-dom";
import { CartProvider } from "./CartContext/CartContext";
import Home from "./pages/Home/Home";
import CartPage from "./pages/CartPage/CartPage";
import AboutPage from "./pages/AboutPage/AboutPage";
import ContactUs from "./pages/ContactUs/ContactUs";
import Login from "./components/Login/Login";
import SignUp from "./components/SignUp/SignUp";
import BookPage from "./pages/BookPage/BookPage";
import MyOrders from "./components/MyOrders/MyOrders";
import Checkout from "./components/Checkout/Checkout";
import VerifyPaymentPage from "./pages/VerifyPaymentPage";
import ProtectedRoute from "./pages/ProtectedRoute";

const App = () => {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/books" element={<BookPage />} />
        <Route path="/orders/verify" element={<VerifyPaymentPage />} />
        <Route path="/orders" element={<MyOrders />} />
  <Route
         path="/checkout"
         element={
           <ProtectedRoute>
             <Checkout />
           </ProtectedRoute>
        }
       />

        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
