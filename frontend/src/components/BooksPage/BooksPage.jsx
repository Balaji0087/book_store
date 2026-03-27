/* BooksPage.jsx */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingBag, Plus, Minus, Star, Search } from "lucide-react";
import { useCart } from "../../CartContext/CartContext";
import { useLocation } from "react-router-dom";
import { booksPageStyles as styles } from "../../assets/dummystyles";

const API_BASE = "http://localhost:4000";
const BooksPage = () => {
  const { cart, addToCart, updateCartItem } = useCart();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchFromURL = queryParams.get("search") || "";

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchFromURL);
  const [sortBy, setSortBy] = useState("title");
  const [filterCategory, setFilterCategory] = useState("all");

  // Fetch books from backend
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/book`);
        const data = res.data;
        const list = Array.isArray(data) ? data : data.books || [];
        setBooks(list);
      } catch (err) {
        console.error("Error loading books:", err);
        setError(err.message || "Failed to load books");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Helpers for cart state
  const isInCart = (id) => cart.items?.some(item => item.id === id);
  const getCartQuantity = (id) => cart.items?.find(item => item.id === id)?.quantity || 0;

  // Use context methods instead of dispatch
  const handleAddToCart = (book) =>
    addToCart({ id: book._id, title: book.title, price: book.price, quantity: 1 });
  const handleIncrement = (id) =>
    updateCartItem({ id, quantity: getCartQuantity(id) + 1 });
  const handleDecrement = (id) =>
    updateCartItem({ id, quantity: getCartQuantity(id) - 1 });

  // Filter and sort on frontend
  const filteredBooks = books.filter((book) => {
    const matchCategory =
      filterCategory === "all" || book.category === filterCategory;
    const lowerSearch = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      book.title.toLowerCase().includes(lowerSearch) ||
      book.author.toLowerCase().includes(lowerSearch);
    return matchCategory && matchSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
          numeric: true,
        });
    }
  });

  const categories = [
    "all",
    ...new Set(books.map((book) => book.category).filter(Boolean)),
  ];

  if (loading) return <div className={styles.loading}>Loading books...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.headerWrapper}>
          <h1 className={styles.headerTitle}>Literary Universe</h1>
          <p className={styles.headerSubtitle}>
            Explore our curated collection spanning genres and perspectives
          </p>
        </div>

        <div className={styles.searchWrapper}>
          <div className={styles.searchInputWrapper}>
            <div className={styles.searchIconWrapper}>
              <Search className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-focus-within:text-[#60A5FA]" />
            </div>
            <input
              type="text"
              placeholder="Search titles, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.selectGroup}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={styles.selectBox}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Genres" : category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.selectBox}
              >
                <option value="title">Sort by Title</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div className={styles.resultText}>
              Showing {sortedBooks.length} results
            </div>
          </div>
        </div>

        <div className={styles.booksGrid}>
          {sortedBooks.map((book) => {
            const inCart = isInCart(book._id);
            const qty = getCartQuantity(book._id);

            return (
              <div key={book._id} className={styles.bookCard}>
                <div className={styles.imageWrapper}>
                  <img
                    src={`${API_BASE}${book.image}`}
                    alt={book.title}
                    className={styles.imageStyle}
                  />
                </div>
                <h3 className={styles.title}>{book.title}</h3>
                <p className={styles.author}>by {book.author}</p>
                <div className={styles.ratingWrapper}>
                  {[
                    ...Array(
                      Number.isFinite(book.rating) ? Math.floor(book.rating) : 0
                    ),
                  ].map((_, index) => (
                    <Star
                      key={index}
                      className="w-4 h-4 fill-yellow-400 stroke-yellow-400"
                    />
                  ))}
                  <span>
                    (
                    {Number.isFinite(book.rating)
                      ? book.rating.toFixed(1)
                      : "N/A"}
                    )
                  </span>
                </div>

                <p className={styles.description}>{book.description}</p>
                <div className={styles.priceCartWrapper}>
                  <span className={styles.price}>₹{book.price.toFixed(2)}</span>
                  <div className={styles.cartButtons}>
                    {!inCart ? (
                      <button onClick={() => handleAddToCart(book)}>
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDecrement(book._id)}>
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span>{qty}</span>
                        <button onClick={() => handleIncrement(book._id)}>
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
