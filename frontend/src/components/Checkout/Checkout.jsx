import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, MapPin, ShoppingCart, CheckCircle } from 'lucide-react';
import { useCart } from '../../CartContext/CartContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import axios from 'axios';

// Base URLs for API and image serving
const API_BASE = "http://localhost:4000/api";
const IMG_BASE = API_BASE.replace("/api", "");

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', zip: '', paymentMethod: 'cod'
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  // capture total before clearing
  const [orderTotal, setOrderTotal] = useState(0);

  // State to hold map of book IDs to image paths
  const [images, setImages] = useState({});

  // Fetch book images on mount
  useEffect(() => {
    axios.get(`${API_BASE}/book`)
      .then(({ data }) => {
        const books = Array.isArray(data) ? data : data.books || [];
        const map = {};
        books.forEach(b => {
          if (b._id && b.image) map[b._id] = b.image;
        });
        setImages(map);
      })
      .catch(err => console.error("Could not load book images:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const subtotal = calculateTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

// After (pick whichever property holds the book ID):
const items = cart.items.map(item => ({
  id:       item.id || item._id,    // <-- make sure this is the Mongo _id of the Book
  name:     item.title,
  price:    item.price,
  quantity: item.quantity || 1,
}));


      const paymentMethodLabel = formData.paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : 'Online Payment';
      const paymentStatus = formData.paymentMethod === 'online'
        ? 'Paid'
        : 'Pending';

      const payload = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        },
        items,
        paymentMethod: paymentMethodLabel,
        paymentStatus,
        notes: formData.notes || '',
        deliveryDate: formData.deliveryDate || '',
      };

      const { data } = await axios.post(`${API_BASE}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // capture total before clearing
      setOrderTotal(total);

      // 🔥 CLEAR SERVER CART
      await axios.delete(`${API_BASE}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔥 CLEAR LOCAL CART
      clearCart();

      if (formData.paymentMethod === 'online' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setOrderId(data.order?.orderId || null);
      setOrderPlaced(true);

    } catch (err) {
      console.error('Order submission error:', err);
    }
  };


  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#60A5FA] to-[#E0F2FE] py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] bg-clip-text text-transparent mb-4">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Thank you for your purchase. Your order has been placed successfully.
            </p>

            <div className="bg-gradient-to-r from-[#60A5FA]/10 to-[#E0F2FE]/10 rounded-xl p-6 mb-8 max-w-lg mx-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700">Order ID:</span>
                <span className="font-bold text-gray-900">{orderId}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700">Payment Method:</span>
                <span className="font-bold text-gray-900">
                  {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Amount:</span>
                <span className="text-xl font-bold text-[#1E3A8A]">
                  ₹{orderTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-8">
              We've sent a confirmation email to <span className="font-medium">{formData.email}</span>. 
              Your order will be shipped to:
            </p>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 max-w-lg mx-auto">
              <p className="text-gray-800">{formData.name}</p>
              <p className="text-gray-600">{formData.address}</p>
              <p className="text-gray-600">{formData.city}, {formData.state} {formData.zip}</p>
            </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/books" className="px-6 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] text-white rounded-lg font-medium hover:opacity-90">
                Continue Shopping
              </Link>
              <Link to="/orders" className="px-6 py-3 bg-white border border-[#60A5FA] text-[#60A5FA] rounded-lg font-medium hover:bg-[#60A5FA]/10">
                View Order Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { 
      id: 'cod', 
      label: 'Cash on Delivery', 
      description: 'Pay when you receive the order',
      icon: DollarSign,
      iconColor: 'text-orange-500'
    },
    { 
      id: 'online', 
      label: 'Online Payment', 
      description: 'Pay with credit/debit card',
      icon: CreditCard,
      iconColor: 'text-purple-500'
    }
  ];

  const formFields = [
    [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true }
    ],
    [
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'city', label: 'City', type: 'text', required: true }
    ],
    [
      { name: 'address', label: 'Street Address', type: 'text', required: true, fullWidth: true }
    ],
    [
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'zip', label: 'ZIP Code', type: 'text', required: true }
    ]
  ];

  return (
    <>
      <Navbar/> 
      <div className="min-h-screen bg-gradient-to-br pt-28 from-[#60A5FA] to-[#E0F2FE] py-12">
        <div className="container mx-auto px-4">
          <Link to="/cart" className="inline-flex items-center text-[#1E3A8A] font-medium mb-6 hover:underline">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column - Checkout Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Checkout Details</h2>
              <p className="text-gray-600 mb-6">Please enter your information to complete the order</p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-[#60A5FA]" />
                    Shipping Address
                  </h3>
                  
                  {formFields.map((row, rowIndex) => (
                    <div key={rowIndex} className={`grid grid-cols-1 ${row.some(field => field.fullWidth) ? '' : 'md:grid-cols-2'} gap-4 ${rowIndex > 0 ? 'mt-4' : ''}`}>
                      {row.map(field => (
                        <div key={field.name} className={field.fullWidth ? 'col-span-full' : ''}>
                          <label className="block text-gray-700 mb-2">{field.label}</label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent"
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-[#60A5FA]" />
                    Payment Method
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map(method => (
                      <div key={method.id}>
                        <input
                          type="radio"
                          id={method.id}
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor={method.id} 
                          className={`block p-4 border-2 rounded-lg cursor-pointer ${
                            formData.paymentMethod === method.id
                              ? 'border-[#60A5FA] bg-[#60A5FA]/10'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <method.icon className={`w-6 h-6 mr-3 ${method.iconColor}`} />
                            <div>
                              <span className="block font-medium text-gray-900">{method.label}</span>
                              <span className="block text-sm text-gray-600">{method.description}</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Place Order
                </button>
              </form>
            </div>
            
            {/* Right Column - Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-fit">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-2 text-[#60A5FA]" />
                Order Summary
              </h2>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Items</h3>
                <div className="space-y-4">
                  {cart.items.length > 0 ? (
                    cart.items.map(item => (
                      <div key={item.id} className="flex items-center">
                          <img
                          src={
                            images[item.id]
                              ? `${IMG_BASE}${images[item.id]}`
                              : "/placeholder.png"
                          }
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-xl mr-4"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-gray-600 text-sm">by {item.author}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium text-gray-900">₹{item.price.toFixed(2)}</p>
                          <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Your cart is empty</p>
                  )}
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
                    { label: 'Shipping', value: 'FREE' },
                    { label: 'Tax', value: `₹${tax.toFixed(2)}` }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-[#1E3A8A]">₹{total.toFixed(2)}</span>
              </div>
              
              <div className="bg-gradient-to-r from-[#60A5FA]/10 to-[#E0F2FE]/10 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-2">Delivery Estimate</h3>
                <p className="text-gray-600">
                  Your order will be delivered within 3-5 business days after processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default Checkout;