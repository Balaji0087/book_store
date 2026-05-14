import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import adminAxios from "../utils/adminAxios";
import { Trash2, Filter, BookOpen, Edit3 } from "lucide-react";
import { styles } from "../assets/dummyStyles";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";
import { IMG_BASE } from "../utils/api";

const ListBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all books once
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await adminAxios.get('/book');
        setBooks(data);
      } catch (err) {
        const errMsg = err.response?.data?.message || "Failed to fetch books.";
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Derive categories from fetched books
  const categories = useMemo(
    () => ["All", ...new Set(books.map((book) => book.category))],
    [books]
  );

  // Compute filtered and sorted list
  const displayedBooks = useMemo(() => {
    let filtered = books;
    if (filterCategory !== "All") {
      filtered = filtered.filter((book) => book.category === filterCategory);
    }

    if (sortConfig === "priceLowToHigh") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortConfig === "topRated") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [books, filterCategory, sortConfig]);

  const tableHeaders = [
    { key: null, label: "Book" },
    { key: "author", label: "Author" },
    { key: null, label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "rating", label: "Rating" },
    { key: null, label: "Actions" },
  ];

  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');

  // selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete (modal-driven)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleStockEdit = (bookId, currentStock) => {
    setEditingStock(bookId);
    setStockValue(currentStock.toString());
  };

  const handleStockSave = async (bookId) => {
    try {
      await adminAxios.put(`/book/${bookId}`, { stock: parseInt(stockValue) });
      setBooks(books.map(book => 
        book._id === bookId ? { ...book, stock: parseInt(stockValue) } : book
      ));
      setEditingStock(null);
      toast.success('Stock updated successfully');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleStockCancel = () => {
    setEditingStock(null);
    setStockValue('');
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedBooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedBooks.map((b) => b._id));
    }
  };

  const openBulkDeleteModal = () => {
    if (!selectedIds.length) return;
    setDeletingId(null);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await adminAxios.delete(`/book/${deletingId}`);
      setBooks((prev) => prev.filter((book) => book._id !== deletingId));
      setIsConfirmOpen(false);
      setDeletingId(null);
      toast.success("Book deleted successfully");
    } catch (err) {
      console.error("Failed to delete book:", err);
      const errMsg = err.response?.data?.message || "Failed to delete book.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (bookId) => {
    setDeletingId(bookId);
    setIsConfirmOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (!selectedIds.length) return;
    setDeleteLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => adminAxios.delete(`/book/${id}`)));
      setBooks((prev) => prev.filter((book) => !selectedIds.includes(book._id)));
      toast.success(`${selectedIds.length} books deleted successfully`);
      setSelectedIds([]);
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete selected books:", err);
      const errMsg = err.response?.data?.message || "Failed to delete selected books.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const RatingStars = ({ rating }) => (
    <div className={styles.ratingContainer}>
      <div className={styles.starContainer}>
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? styles.starFilled : styles.starEmpty}`}>★</span>
        ))}
      </div>
      <span className={styles.ratingText}>{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <div className={styles.listBooksPage}>
      <div className={styles.listBooksHeader}>
          <div className="w-full flex items-start justify-between">
            <div>
              <h1 className={styles.listBooksTitle}>Manage Books Inventory</h1>
              <p className={styles.listBooksSubtitle}>View, edit, and manage your book collection</p>
            </div>
          </div>
        </div>

      {/* Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.controlsInner}>
          <div className="flex gap-3 items-center">
            <div className={styles.filterGroup}>
              <div className={styles.filterGlow} />
              <div className={styles.filterContainer}>
                <Filter className={styles.filterIcon} />
                <select id="filterCategory" name="filterCategory" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={styles.filterSelect}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="ml-auto">
              <button
                onClick={openBulkDeleteModal}
                disabled={selectedIds.length === 0}
                className={`${styles.deleteButton} inline-flex items-center gap-2`}
                title="Delete selected books"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-">({selectedIds.length})</span>
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {loading && <p>Loading books...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table */}
      <div className={styles.booksTableContainer}>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeader}>
                  <input type="checkbox" aria-label="Select all books" checked={displayedBooks.length > 0 && selectedIds.length === displayedBooks.length} onChange={toggleSelectAll} />
                </th>
                {tableHeaders.map((header) => (
                  <th key={header.label} className={styles.tableHeader} onClick={() => header.key && setSortConfig(sortConfig === header.key ? "" : header.key)}>
                    <div className={styles.tableHeaderContent}>
                      {header.label}
                      {header.key && sortConfig === header.key && <span className="ml-1">↑</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedBooks.map((book) => (
                <tr key={book._id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <input id={`select-${book._id}`} name={`select-${book._id}`} type="checkbox" checked={selectedIds.includes(book._id)} onChange={() => toggleSelect(book._id)} aria-label={`Select ${book.title}`} />
                  </td>

                  <td className={styles.tableCell}>
                    <div className="flex items-center">
                      {book.image && <img src={`${IMG_BASE}${book.image}`} alt={book.title} className="h-10 w-8 object-cover rounded" />}
                      <div className="ml-4">
                        <div className={styles.bookTitle}>{book.title}</div>
                      </div>
                    </div>
                  </td>

                  <td className={styles.tableCell}>{book.author}</td>
                  <td className={styles.tableCell}>
                    <span className={styles.categoryBadge}>{book.category}</span>
                  </td>
                  <td className={styles.tableCell}>₹{book.price}</td>
                  <td className={styles.tableCell}>
                    {editingStock === book._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={stockValue}
                          onChange={(e) => setStockValue(e.target.value)}
                          className="w-16 px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleStockSave(book._id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleStockCancel}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span 
                        className={`${book.stock === 0 ? 'text-red-600' : book.stock < 10 ? 'text-yellow-600' : 'text-green-600'} font-medium cursor-pointer hover:underline`}
                        onClick={() => handleStockEdit(book._id, book.stock)}
                      >
                        {book.stock}
                      </span>
                    )}
                  </td>
                  <td className={styles.tableCell}>
                    <RatingStars rating={book.rating} />
                  </td>
                  <td className={`${styles.tableCell} flex gap-3`}>
                    <button onClick={() => navigate('/add-books', { state: { book } })} className={styles.actionButton} title="Edit book">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                    </button>

                    <button onClick={() => openDeleteModal(book._id)} className={styles.deleteButton} title="Delete book">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!displayedBooks.length && !loading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconContainer}>
              <BookOpen className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>No books found</h3>
            <p className={styles.emptyMessage}>Try adjusting your filter or sort options</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={deletingId ? "Delete book" : `Delete ${selectedIds.length} books`}
        description={deletingId ? "Are you sure you want to delete this book?" : `Are you sure you want to delete ${selectedIds.length} selected books?`}
        onConfirm={deletingId ? handleDeleteConfirm : handleBulkDeleteConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        loading={deleteLoading}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default ListBooks;
