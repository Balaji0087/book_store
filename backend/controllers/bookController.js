import fs from 'fs';
import path from 'path';
import Book from '../models/bookModel.js';

export const createBook = async (req, res, next) => {
  try {
    const filename = req.file?.filename ?? null;
    const imagePath = filename ? `/uploads/${filename}` : null;
    const { title, author, price, rating, category, description } = req.body;

    const book = new Book({
      title,
      author,
      price,
      rating,
      category,
      description,
      image: imagePath
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
    const { title, author, price, rating, category, description } = req.body;
    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (price !== undefined) book.price = price;
    if (rating !== undefined) book.rating = rating;
    if (category !== undefined) book.category = category;
    if (description !== undefined) book.description = description;

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