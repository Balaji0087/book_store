import { useEffect, useState } from "react";
import { useCart } from "../../CartContext/CartContext";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { styles } from "../../assets/dummystyles";
import axios from "axios";

const API_BASE = "http://localhost:4000/api";
const IMG_BASE = API_BASE.replace("/api", "");

const CartPage = () => {
  const { cart, updateCartItem, removeFromCart } = useCart();

  // calculate cart total
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // images[id] = "/uploads/filename.png"
  const [images, setImages] = useState({});

  useEffect(() => {
    axios
      .get(`${API_BASE}/book`)
      .then(({ data }) => {
        const map = {};
        data.forEach((book) => {
          // book._id matches cart item.id
          map[book._id] = book.image;
        });
        console.log("images map keys:", Object.keys(map));
        setImages(map);
      })
      .catch((err) => console.error("Failed to load books for images:", err));
  }, []);

  const getImageSrc = (item) => {
    const relPath = images[item.id];
    if (relPath) {
      return `${IMG_BASE}${relPath}`;
    }
  };

  const inc = (item) =>
    updateCartItem({
      id: item.id,
      source: item.source,
      quantity: item.quantity + 1,
    });

  const dec = (item) => {
    const newQty = item.quantity - 1;
    if (newQty > 0) {
      updateCartItem({
        id: item.id,
        source: item.source,
        quantity: newQty,
      });
    } else {
      removeFromCart({ id: item.id, source: item.source });
    }
  };

  const remove = (item) => removeFromCart({ id: item.id, source: item.source });

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <ShoppingBag className={styles.titleIcon} />
            Shopping Cart
          </h1>
          <p className={styles.subtitle}>
            {cart.items.length} item
            {cart.items.length !== 1 && "s"} in your cart
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <ShoppingBag className={styles.emptyIcon} />
            </div>
            <h2 className={styles.emptyTitle}>Your cart feels lonely</h2>
            <p className={styles.emptyDescription}>
              Discover our collection of premium books and start your reading
              journey.
            </p>
            <Link to="/books" className={styles.browseBtn}>
              <BookOpen className={styles.browseIcon} />
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            <div className={styles.cartItems}>
              {cart.items.map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className={styles.cartItemCard}
                >
                  <div className={styles.cartItemContent}>
                    <img
                      src={getImageSrc(item)}
                      alt={item.title}
                      className={styles.cartItemImage}
                    />
                    <div className="flex-1">
                      <div className={styles.cartItemTop}>
                        <div>
                          <h3 className={styles.itemTitle}>{item.title}</h3>
                          <p className={styles.itemAuthor}>{item.author}</p>
                        </div>
                        <button
                          onClick={() => remove(item)}
                          className={styles.removeBtn}
                        >
                          <Trash2 className={styles.removeIcon} />
                        </button>
                      </div>

                      <div className={styles.quantityPriceWrapper}>
                        <div className={styles.quantityControls}>
                          <div className={styles.quantityBox}>
                            <button
                              onClick={() => dec(item)}
                              className={styles.qBtn}
                            >
                              <Minus className={styles.qIcon} />
                            </button>
                            <span className={styles.quantityValue}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => inc(item)}
                              className={styles.qBtn}
                            >
                              <Plus className={styles.qIcon} />
                            </button>
                          </div>
                          <span className={styles.itemTotal}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <span className={styles.pricePerItem}>
                          ₹{item.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryBreakdown}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    Subtotal ({cart.items.length} items)
                  </span>
                  <span className={styles.summaryValue}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping</span>
                  <span className={styles.summaryShipping}>Free</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Taxes</span>
                  <span className={styles.summaryValue}>
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className={styles.summaryTotalSection}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalAmount}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" className={styles.checkoutBtn}>
                Checkout Now
                <ArrowRight className={styles.checkoutIcon} />
              </Link>

              <Link to="/books" className={styles.continueBtn}>
                <BookOpen className={styles.continueIcon} />
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;