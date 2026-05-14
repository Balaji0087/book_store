import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName:    { type: String, required: true },
  email:       { type: String, required: true },
  phoneNumber: { type: String, required: true },
  street:      { type: String, required: true },
  city:        { type: String, required: true },
  state:       { type: String, required: true },
  zipCode:     { type: String, required: true },
}, { _id: false });

const itemSchema = new mongoose.Schema({
  book:     { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  title:    { type: String, required: true },
  author:   { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  shippingAddress: { type: addressSchema, required: true },
  books: [itemSchema],

  shippingCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ["Online Payment", "Cash on Delivery"],
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Paid", "Failed","Refunded"],
    default: "Unpaid",
  },

  sessionId: { type: String },
  paymentIntentId: { type: String },

  notes: { type: String },
  deliveryDate: { type: Date },

  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },

  deliveredAt: { type: Date },
  placedAt: { type: Date, default: Date.now },
  statusTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-calculate finalAmount before validation
orderSchema.pre('validate', function (next) {
  if (this.totalAmount != null && this.taxAmount != null) {
    this.finalAmount = this.totalAmount + this.taxAmount + (this.shippingCharge || 0);
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
