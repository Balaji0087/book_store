import fs from 'fs';
import path from 'path';
import Book from '../models/bookModel.js';

export const createBook = async (req, res, next) => {
  try {
    const filename = req.file?.filename ?? null;
    const imagePath = filename ? `/uploads/${filename}` : null;
    const { title, author, price, rating, category, description, stock } = req.body;

    const book = new Book({
      title,
      author,
      price,
      rating,
      category,
      description,
      image: imagePath,
      stock: stock || 0
    });

    const saved = await book.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

export const getBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    next(err);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Update image if a new file was uploaded
    if (req.file) {
      const newImagePath = `/uploads/${req.file.filename}`;

      // delete old image if present
      if (book.image) {
        const oldRel = book.image.startsWith('/') ? book.image.slice(1) : book.image;
        const oldPath = path.join(process.cwd(), oldRel);
        fs.unlink(oldPath, (err) => {
          if (err) console.warn('Failed to delete old image file:', err);
        });
      }

      book.image = newImagePath;
    }

    // Apply partial updates for other fields
    const { title, author, price, rating, category, description, stock } = req.body;
    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (price !== undefined) book.price = price;
    if (rating !== undefined) book.rating = rating;
    if (category !== undefined) book.category = category;
    if (description !== undefined) book.description = description;
    if (stock !== undefined) book.stock = stock;

    const updated = await book.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Remove image file from uploads folder
    if (book.image) {
      const rel = book.image.startsWith('/') ? book.image.slice(1) : book.image;
      const filePath = path.join(process.cwd(), rel);
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Failed to delete image file:', err);
      });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // We need User model and Order model
    const User = (await import('../models/userModel.js')).default;
    const Order = (await import('../models/orderModel.js')).default;

    const user = await User.findById(userId).populate('viewedBooks.bookId');
    const orders = await Order.find({ user: userId }).populate('books.book');

    const categoryScores = {};
    const authorScores = {};
    const purchasedBookIds = new Set();

    const now = Date.now();
    const viewWeight = (viewedAt) => {
      const ageDays = Math.max(0, (now - new Date(viewedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays < 7) return 2.5;
      if (ageDays < 30) return 1.3;
      return 0.7;
    };

    orders.forEach(order => {
      order.books.forEach(item => {
        const bookDoc = item.book;
        if (!bookDoc) return;

        const bookId = bookDoc._id?.toString?.() || bookDoc.toString();
        if (bookId) purchasedBookIds.add(bookId);

        if (bookDoc.category) {
          categoryScores[bookDoc.category] = (categoryScores[bookDoc.category] || 0) + 5;
        }
        if (bookDoc.author) {
          authorScores[bookDoc.author] = (authorScores[bookDoc.author] || 0) + 3;
        }
      });
    });

    if (user && user.viewedBooks) {
      user.viewedBooks.forEach(item => {
        const bookDoc = item.bookId;
        if (!bookDoc) return;

        const weight = viewWeight(item.viewedAt);
        if (bookDoc.category) {
          categoryScores[bookDoc.category] = (categoryScores[bookDoc.category] || 0) + weight;
        }
        if (bookDoc.author) {
          authorScores[bookDoc.author] = (authorScores[bookDoc.author] || 0) + weight * 0.8;
        }
      });
    }

    const topCategories = Object.keys(categoryScores)
      .sort((a, b) => categoryScores[b] - categoryScores[a])
      .slice(0, 3);
    const topAuthors = Object.keys(authorScores)
      .sort((a, b) => authorScores[b] - authorScores[a])
      .slice(0, 3);

    const query = { $and: [] };

    if (topCategories.length > 0 || topAuthors.length > 0) {
      const orConditions = [];
      if (topCategories.length > 0) orConditions.push({ category: { $in: topCategories } });
      if (topAuthors.length > 0) orConditions.push({ author: { $in: topAuthors } });
      query.$and.push({ $or: orConditions });
    }

    if (purchasedBookIds.size > 0) {
      query.$and.push({ _id: { $nin: Array.from(purchasedBookIds) } });
    }

    if (query.$and.length === 0) {
      delete query.$and;
    }

    let recommendations = await Book.find(query)
      .sort({ rating: -1, createdAt: -1 })
      .limit(10);

    const recommendedIds = new Set(recommendations.map(r => r._id.toString()));
    const excludeIds = new Set([...Array.from(purchasedBookIds), ...Array.from(recommendedIds)]);

    if (recommendations.length < 8) {
      const fallback = await Book.find({ _id: { $nin: Array.from(excludeIds) } })
        .sort({ rating: -1, createdAt: -1 })
        .limit(8 - recommendations.length);
      recommendations = [...recommendations, ...fallback];
    }

    res.json({ success: true, recommendations });
  } catch (err) {
    next(err);
  }
};