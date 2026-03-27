// controllers/orderController.js
import Stripe from 'stripe';
import Order from '../models/orderModel.js';
import { v4 as uuidv4 } from 'uuid';
import Book from '../models/bookModel.js';


const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
      const bookDoc = await Book.findById(i.id).lean();
      if (!bookDoc) {
        const err = new Error(`Book not found: ${i.id}`);
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
      return res.status(201).json({ order: newOrder, checkoutUrl: session.url });
    }

    // 6. Cash on Delivery path
    //    leave paymentStatus as 'Unpaid' (schema default)
    const newOrder = new Order({
      ...baseOrderData,
      // paymentStatus omitted → defaults to 'Unpaid'
    });

    await newOrder.save();
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
    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }
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