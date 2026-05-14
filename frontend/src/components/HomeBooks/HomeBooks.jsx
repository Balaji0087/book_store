import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, ArrowRight, Plus, Minus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../CartContext/CartContext";
import { homeBooksStyles as styles } from "../../assets/dummystyles";
import { API_BASE, IMG_BASE } from "../../utils/api";

const HomeBooks = () => {
  const { cart, addToCart, updateCartItem } = useCart();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helpers now ignore source, unified by id
  const inCart = (id) => cart.items.some((item) => item.id === id);
  const getQty = (id) => cart.items.find((item) => item.id === id)?.quantity || 0;

  // Fetch books once
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/book`);
        const list = Array.isArray(res.data) ? res.data : res.data.books || [];
        setBooks(list);
      } catch (err) {
        setError(err.message || "Failed to load books");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleAdd = (book) => {
    addToCart({ id: book._id, title: book.title, price: book.price, quantity: 1 });
  };

  const handleInc = (id) => updateCartItem({ id, quantity: getQty(id) + 1 });
  const handleDec = (id) => updateCartItem({ id, quantity: getQty(id) - 1 });

  if (loading) return <div className={styles.loading}>Loading favorites...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="text-center mb-12">
            <h2 className={styles.heading}>Bookseller Favorites</h2>
            <div className={styles.headingLine}></div>
          </div>

          <div className={styles.grid}>
            {books.map((book) => {
              const itemInCart = inCart(book._id);
              return (
                <div key={book._id} className={styles.bookCard}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={
                        book.image.startsWith('http')
                          ? book.image
                          : `${IMG_BASE}${book.image}`
                      }
                      alt={book.title}
                      className={styles.image}
                    />
                    <div className={styles.rating}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(book.rating || 0)
                              ? "text-[#60A5FA] fill-[#60A5FA]"
                              : "text-gray-300"
                          }`} />
                      ))}
                    </div>
                  </div>

                  <h3 className={styles.title}>{book.title}</h3>
                  <p className={styles.author}>{book.author}</p>
                  <span className={styles.actualPrice}>₹{book.price.toFixed(2)}</span>

                  {itemInCart ? (
                    <div className={styles.qtyBox}>
                      <button onClick={() => handleDec(book._id)} className={styles.qtyBtn}>
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-gray-700">{getQty(book._id)}</span>
                      <button onClick={() => handleInc(book._id)} className={styles.qtyBtn}>
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleAdd(book)} className={styles.addBtn}>
                      <ShoppingCart className="h-5 w-5" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.viewBtnWrapper}>
            <Link to="/books" className={styles.viewBtn}>
              <span>View All Books</span>
              <ArrowRight className={styles.viewIcon} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBooks;
