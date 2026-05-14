// controllers/orderController.js
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import Order from '../models/orderModel.js';
import { v4 as uuidv4 } from 'uuid';
import Book from '../models/bookModel.js';


const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const hasMailConfig = Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);
let mailTransporter = null;
if (hasMailConfig) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
} else {
  console.warn('Mail transporter disabled: MAIL_USER or MAIL_PASS is not set. No emails will be sent.');
}

const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.shippingAddress || !order.shippingAddress.email) return;
  if (!hasMailConfig || !mailTransporter) {
    console.info('Skipping email send because SMTP credentials are not configured.');
    return;
  }

  const to = order.shippingAddress.email;
  const subject = `Your BookSeller Order ${order.orderId} Confirmation`;
  const itemLines = order.books.map((book, idx) => {
    const itemTotal = Number(book.price) * Number(book.quantity);
    return `<tr style="background:${idx % 2 === 0 ? '#f8fafc' : '#eff6ff'};"><td style="padding:8px;border:1px solid #cbd5e1">${idx + 1}</td><td style="padding:8px;border:1px solid #cbd5e1">${book.title}</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:right">${book.quantity}</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:right">₹${Number(book.price).toFixed(2)}</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:right">₹${itemTotal.toFixed(2)}</td></tr>`;
  }).join('');

  const textBody = `Hello ${order.shippingAddress.fullName},\n\n` +
    `Thank you for your order. Your order has been confirmed with the following details:\n\n` +
    `Order ID: ${order.orderId}\n` +
    `Order Date: ${new Date(order.placedAt).toLocaleString()}\n` +
    `Payment Method: ${order.paymentMethod}\n` +
    `Payment Status: ${order.paymentStatus}\n\n` +
    `Shipping Address:\n` +
    `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}\n\n` +
    `Items:\n${order.books.map((book) => `${book.title} - ${book.quantity} x ₹${Number(book.price).toFixed(2)} = ₹${(Number(book.price) * Number(book.quantity)).toFixed(2)}`).join('\n')}\n\n` +
    `Subtotal: ₹${Number(order.totalAmount - order.taxAmount - order.shippingCharge).toFixed(2)}\n` +
    `Shipping: ₹${Number(order.shippingCharge).toFixed(2)}\n` +
    `Tax: ₹${Number(order.taxAmount).toFixed(2)}\n` +
    `Total: ₹${Number(order.totalAmount).toFixed(2)}\n\n` +
    `Thank you for shopping with BookSeller!\n`;

  const htmlBody = `
    <div style="font-family:Arial, sans-serif; color:#111827;">
      <div style="background:#1d4ed8; color:#fff; padding:16px; border-radius:8px 8px 0 0;">
        <h1 style="margin:0; font-size:24px;">📚 BOOkstore</h1>
        <p style="margin:4px 0 0; font-size:14px;">Order Receipt - ${order.orderId}</p>
      </div>
      <div style="padding:16px; border:1px solid #e2e8f0; border-top:0; border-radius:0 0 8px 8px;">
        <p style="margin:0 0 8px; font-weight:600;">Order Details</p>
        <p style="margin:2px 0;">Order Date: ${new Date(order.placedAt).toLocaleString()}</p>
        <p style="margin:2px 0;">Payment: ${order.paymentMethod}</p>
        <p style="margin:2px 0 10px;">Status: ${order.paymentStatus}</p>
        <p style="margin:0 0 6px; font-weight:600;">Shipping</p>
        <p style="margin:2px 0;">${order.shippingAddress.fullName} (${order.shippingAddress.email})</p>
        <p style="margin:2px 0;">${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
        <hr style="margin:16px 0; border-color:#cbd5e1;" />
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr style="background:#1e40af; color:#fff; text-align:left;">
              <th style="padding:10px; border:1px solid #1e3a8a;">#</th>
              <th style="padding:10px; border:1px solid #1e3a8a;">Title</th>
              <th style="padding:10px; border:1px solid #1e3a8a; text-align:right;">Qty</th>
              <th style="padding:10px; border:1px solid #1e3a8a; text-align:right;">Price</th>
              <th style="padding:10px; border:1px solid #1e3a8a; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemLines}</tbody>
        </table>
        <div style="margin-top:16px; text-align:right; font-size:14px;">
          <p style="margin:2px 0;"><strong>Subtotal:</strong> ₹${Number(order.totalAmount - order.taxAmount - order.shippingCharge).toFixed(2)}</p>
          <p style="margin:2px 0;"><strong>Shipping:</strong> ₹${Number(order.shippingCharge).toFixed(2)}</p>
          <p style="margin:2px 0;"><strong>Tax:</strong> ₹${Number(order.taxAmount).toFixed(2)}</p>
          <p style="margin:5px 0 0; font-size:16px; font-weight:700;">Total: ₹${Number(order.totalAmount).toFixed(2)}</p>
        </div>
      </div>
      <p style="font-size:13px; margin-top:12px; color:#6b7280;">Thank you for shopping with BookSeller!</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
};

// Function to deduct stock
const deductStock = async (orderItems) => {
  for (const item of orderItems) {
    await Book.findByIdAndUpdate(item.book, {
      $inc: { stock: -item.quantity }
    });
  }
};

// Function to restore stock
const restoreStock = async (orderItems) => {
  for (const item of orderItems) {
    await Book.findByIdAndUpdate(item.book, {
      $inc: { stock: item.quantity }
    });
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { customer, items, paymentMethod, notes, deliveryDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty items array' });
    }

    // 1. Normalize only the allowed labels
    const normalizedPM = ['Cash on Delivery', 'Online Payment'].includes(paymentMethod)
      ? paymentMethod
      : 'Online Payment';

    // 2. Build a unique orderId
    const orderId = `ORD-${uuidv4()}`;

    // Calculate amounts
    const totalAmount    = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    const taxAmount      = +((totalAmount * 0.05).toFixed(2));
    const shippingCharge = 0;

    // 4. Map customer → shippingAddress
   const shippingAddress = {
      fullName:    customer.name,
      email:       customer.email,
      phoneNumber: customer.phone,
      street:      customer.address.street,
      city:        customer.address.city,
      state:       customer.address.state,
      zipCode:     customer.address.zip,
    };

        // Hydrate each item from Book collection
    const orderItems = await Promise.all(items.map(async (i) => {
      const bookDoc = await Book.findById(i.id);
      if (!bookDoc) {
        const err = new Error(`Book not found: ${i.id}`);
        err.status = 400;
        throw err;
      }
      
      // Check stock availability
      if (bookDoc.stock < i.quantity) {
        const err = new Error(`Insufficient stock for ${bookDoc.title}. Available: ${bookDoc.stock}, Requested: ${i.quantity}`);
        err.status = 400;
        throw err;
      }
      
      return {
        book:     bookDoc._id,
        title:    bookDoc.title,
        author:   bookDoc.author,
        image:    bookDoc.image,
        price:    Number(i.price),
        quantity: Number(i.quantity),
      };
    }));

    // Base payload
    const baseOrderData = {
      orderId,
      user:            req.user._id,
      shippingAddress,
books:           orderItems, 
      shippingCharge,
      totalAmount,
      taxAmount,
      paymentMethod:   normalizedPM,
      notes,
      deliveryDate,
      statusTimeline: [{ status: 'Pending' }],
    };

    // 5. Online-payment path (Stripe)
    if (normalizedPM === 'Online Payment') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: items.map(o => ({
          price_data: {
            currency:     'inr',
            product_data: { name: o.name },
            unit_amount:  Math.round(o.price * 100),
          },
          quantity: o.quantity,
        })),
        customer_email: customer.email,
        success_url: `${process.env.FRONTEND_URL}/orders/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout?payment_status=cancel`,
        metadata: { orderId },
      });

      const newOrder = new Order({
        ...baseOrderData,
        paymentStatus:  'Unpaid',          // still unpaid until webhook/confirm
        sessionId:      session.id,
        paymentIntentId: session.payment_intent,
      });

      await newOrder.save();
      await sendOrderConfirmationEmail(newOrder);
      return res.status(201).json({ order: newOrder, checkoutUrl: session.url });
    }

    // 6. Cash on Delivery path
    //    leave paymentStatus as 'Unpaid' (schema default)
    const newOrder = new Order({
      ...baseOrderData,
      // paymentStatus omitted → defaults to 'Unpaid'
    });

    await newOrder.save();
    await sendOrderConfirmationEmail(newOrder);
    
    // Deduct stock for COD orders
    await deductStock(orderItems);
    
    res.status(201).json({ order: newOrder, checkoutUrl: null });

  } catch (err) {
    next(err);
  }
};

// Confirm Stripe payment
export const confirmPayment = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: 'session_id required' });
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    const order = await Order.findOneAndUpdate({ sessionId: session_id }, { paymentStatus: 'Paid' }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Deduct stock for online payment orders when payment is confirmed
    await deductStock(order.books);
    await sendOrderConfirmationEmail(order);
    
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// Get all orders
export const getOrders = async (req, res, next) => {
  try {
    const { search = '', status } = req.query;
    const filter = {};

    // 1) Status filter
    if (status) filter.orderStatus = status;

    // 2) Text search
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { orderId: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.email': regex },
        { 'books.title': regex }
      ];
    }

    // Fetch matching orders, newest first
    const orders = await Order.find(filter)
      .sort({ placedAt: -1 })
      .lean();

    // Compute aggregate counts
    const counts = orders.reduce((acc, o) => {
      acc.totalOrders = (acc.totalOrders || 0) + 1;
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
      if (o.paymentStatus === 'Unpaid') {
        acc.pendingPayment = (acc.pendingPayment || 0) + 1;
      }
      return acc;
    }, { totalOrders: 0, pendingPayment: 0 });

    res.json({
      
      counts: {
        totalOrders: counts.totalOrders,
        pending: counts.Pending || 0,
        processing: counts.Processing || 0,
        shipped: counts.Shipped || 0,
        delivered: counts.Delivered || 0,
        cancelled: counts.Cancelled || 0,
        pendingPayment: counts.pendingPayment
      },
      orders
    });
  } catch (err) {
    next(err);
  }
};

// Get order by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// Send order confirmation email on demand
export const sendOrderEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await sendOrderConfirmationEmail(order);
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    next(err);
  }
};

// Get userOrder
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order
      .find({ user: req.user._id })
      .populate("books.book") // optional: populate book details
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
};

// Update order
export const updateOrder = async (req, res, next) => {
  try {
    const allowed = ['orderStatus', 'paymentStatus', 'deliveryDate', 'notes'];
    const updateData = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If order is being cancelled, restore stock
    if (updateData.orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      await restoreStock(order.books);
    }
    
    // Update timeline if orderStatus is being changed
    if (updateData.orderStatus && updateData.orderStatus !== order.orderStatus) {
      await Order.findByIdAndUpdate(req.params.id, { 
        $push: { statusTimeline: { status: updateData.orderStatus, timestamp: new Date() } } 
      });
    }
    
    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).lean();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete order
export const deleteOrder = async (req, res, next) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    next(err);
  }
};