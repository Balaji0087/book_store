import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BookPlus, Star } from "lucide-react";
import { styles } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:4000";

  const initialFormData = {
    title: "",
    author: "",
    price: "",
    image: null,
    rating: 4,
    category: "Fiction",
    description: "",
    preview: "",
  };

  const categories = [
    "Fiction", "Non-Fiction", "Mystery", "Sci-Fi", 
    "Biography", "Self-Help", "Thriller"
  ];

const AddBooks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [formData, setFormData] = useState(initialFormData);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const memoCategories = useMemo(() => categories, []);

  // Prefill when navigated with a book (edit flow)
  useEffect(() => {
    const book = location.state?.book;
    if (book) {
      setIsEditMode(true);
      setEditingId(book._id ?? book.id ?? null);
      setFormData({
        title: book.title ?? "",
        author: book.author ?? "",
        price: book.price != null ? String(book.price) : "",
        image: null,
        rating: book.rating ?? 4,
        category: book.category ?? "Fiction",
        description: book.description ?? "",
        preview: book.image ? `${API_BASE}${book.image}` : "",
      });
      previewUrlRef.current = book.image ? `${API_BASE}${book.image}` : null;
    } else {
      setIsEditMode(false);
      setEditingId(null);
      setFormData(initialFormData);
      previewUrlRef.current = null;
    }

    return () => {
      // revoke any created blob URL
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [location.state]);

  // cleanup on unmount (safety)
  useEffect(() => () => {
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // revoke previous blob if any
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    previewUrlRef.current = preview;
    setFormData(prev => ({ ...prev, image: file, preview }));
  }, []);

  const handleStarClick = useCallback((rating) => {
    setFormData(prev => ({ ...prev, rating }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage({ type: null, text: null });

    const payload = new FormData();
    const normalized = {
      ...formData,
      title: formData.title?.trim(),
      author: formData.author?.trim(),
    };

    Object.entries(normalized).forEach(([key, value]) => {
      if (key === 'preview' || value === null || value === undefined || value === '') return;
      // ensure price is numeric string
      if (key === 'price') payload.append(key, String(Number(value) || 0));
      else payload.append(key, value);
    });

    try {
      if (isEditMode && editingId) {
        await axios.put(`${API_BASE}/api/book/${editingId}`, payload);
        toast.success('Book updated successfully');
        navigate('/list-books');
      } else {
        await axios.post(`${API_BASE}/api/book`, payload);
        toast.success('Book added successfully');
        setFormData(initialFormData);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('AddBooks error response:', err.response?.data, err);
      const errMsg = err.response?.data?.message ?? (isEditMode ? 'Failed to update book.' : 'Failed to add book.');
      setMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, editingId, loading, navigate]);

  return (
    <div className={styles.addBooksPage}>
      <div className={styles.addBooksContainer}>
        <div className={styles.headerContainer}>
          <div>
            <h1 className={styles.headerTitle}>{isEditMode ? 'Edit Book' : 'Add New Book'}</h1>
            <p className={styles.headerSubtitle}>
              {isEditMode ? 'Update the book details and save changes.' : 'Fill in the details to add a new book to your store'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGrid}>
            <div className={styles.formItem}>
              <label htmlFor="title" className={styles.formLabel}>Book Title</label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Enter book title"
                required
              />
            </div>

            <div className={styles.formItem}>
              <label htmlFor="author" className={styles.formLabel}>Author</label>
              <input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className={styles.formItem}>
              <label htmlFor="price" className={styles.formLabel}>Price (₹)</label>
              <input
                id="price"
                type="number"
                name="price"
                min="1"
                value={formData.price}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Enter price"
                required
              />
            </div>

            <div className={styles.formItem}>
              <label className={styles.formLabel}>Rating</label>
              <div className={styles.ratingContainer}>
                <div className={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map(starValue => (
                    <button
                      key={starValue}
                      type="button"
                      className="p-1"
                      onClick={() => handleStarClick(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${starValue} star${starValue !== 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          (hoverRating || formData.rating) >= starValue
                            ? styles.starFilled
                            : styles.starEmpty
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className={styles.ratingText}>
                  {formData.rating} Star{formData.rating !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className={styles.formItem}>
              <label htmlFor="category" className={styles.formLabel}>Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.formInput}
              >
                {memoCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formItem}>
              <label htmlFor="image" className={styles.formLabel}>Cover Image</label>
              <input
                id="image"
                name="image"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.formInput}
              />
            </div>

            <div className={`${styles.formItem} md:col-span-2`}>
              <label htmlFor="description" className={styles.formLabel}>Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={styles.formTextarea}
                placeholder="Enter book description"
              />
            </div>
          </div>

          {formData.preview && (
            <div className={styles.previewContainer}>
              <h3 className={styles.previewTitle}>Cover Preview</h3>
              <img
                src={formData.preview}
                alt="Book cover preview"
                className={styles.previewImg}
              />
            </div>
          )}

          {message.text && (
            <p className={`${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {message.text}
            </p>
          )}

          <div className={styles.submitContainer}>
            {isEditMode && (
              <button
                type="button"
                onClick={() => navigate('/list-books')}
                className={styles.footerButtonClose}
                disabled={loading}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              <BookPlus className="w-5 h-5" />
              <span>{isEditMode ? 'Update Book' : 'Add Book to Collection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBooks;