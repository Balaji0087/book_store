import 'dotenv/config';
import { connectDB } from './config/db.js';
import Order from './models/orderModel.js';
import User from './models/userModel.js';
import Book from './models/bookModel.js';
import mongoose from 'mongoose';

const seedData = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Connected.");

    const user = await User.findOne({});
    const books = await Book.find({}).limit(5);

    if (!user) {
      console.log("No users found. Please create a user first.");
      process.exit(1);
    }

    if (books.length === 0) {
      console.log("No books found. Please create some books first.");
      process.exit(1);
    }

    console.log(`Using user: ${user.email} and ${books.length} books.`);

    // Generate orders for the last 6 months
    const currentDate = new Date();
    
    let totalGenerated = 0;

    for (let i = 6; i >= 0; i--) {
      // Determine the month and year
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 15);
      
      // Random number of orders for this month (e.g., between 5 and 20)
      // We can make an increasing trend! 
      const baseOrders = 5 + (6 - i) * 3; // Growing trend
      const randomVariability = Math.floor(Math.random() * 5);
      const ordersToCreate = baseOrders + randomVariability;
      
      for (let j = 0; j < ordersToCreate; j++) {
        // Pick 1-3 random books
        const numBooks = Math.floor(Math.random() * 3) + 1;
        const selectedBooks = [];
        let orderTotal = 0;

        for (let k = 0; k < numBooks; k++) {
           const randomBook = books[Math.floor(Math.random() * books.length)];
           const qty = Math.floor(Math.random() * 2) + 1;
           selectedBooks.push({
             book: randomBook._id,
             title: randomBook.title,
             author: randomBook.author,
             price: randomBook.price,
             quantity: qty
           });
           orderTotal += (randomBook.price * qty);
        }

        const tax = orderTotal * 0.05;
        const final = orderTotal + tax;

        // Random day in the month
        const day = Math.floor(Math.random() * 28) + 1;
        const placedAt = new Date(targetDate.getFullYear(), targetDate.getMonth(), day, 12, 0, 0);

        const newOrder = new Order({
          orderId: `ORD-SEED-${new Date().getTime()}-${j}-${i}`,
          user: user._id,
          shippingAddress: {
             fullName: user.name,
             email: user.email,
             phoneNumber: '1234567890',
             street: '123 Seed St',
             city: 'Seed City',
             state: 'Seed State',
             zipCode: '12345'
          },
          books: selectedBooks,
          totalAmount: orderTotal,
          taxAmount: tax,
          finalAmount: final,
          paymentMethod: 'Online Payment',
          paymentStatus: 'Paid',
          orderStatus: 'Delivered',
          placedAt: placedAt,
          statusTimeline: [
             { status: 'Pending', timestamp: new Date(placedAt.getTime() - 86400000) },
             { status: 'Delivered', timestamp: placedAt }
          ]
        });

        await newOrder.save();
        totalGenerated++;
      }
      console.log(`Generated ${ordersToCreate} orders for ${targetDate.getFullYear()}-${targetDate.getMonth() + 1}`);
    }

    console.log(`\nSuccessfully seeded ${totalGenerated} orders!`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
};

seedData();
