// src/assets/dummyStyles.js
export const styles = {
  // Layout
  pageBackground: "min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6",
  container: "max-w-7xl pb-24 mx-auto",
  
  // Header
  headerTitle: "text-2xl font-bold text-gray-900",
  headerSubtitle: "text-gray-600 mt-1",
  
  // Stats Cards
  statsCard: "bg-white rounded-xl p-5 shadow-sm border border-gray-100",
  statsCardContent: "flex justify-between items-center",
  statsCardLabel: "text-sm text-gray-500",
  statsCardValue: "text-2xl font-bold mt-1 text-gray-900",
  statsIconContainer: (color) => `p-3 rounded-lg ${color}`,
  statsIcon: (color) => `w-6 h-6 ${color}`,
  
  // Controls
  controlsContainer: "bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6",
  controlsInner: "flex flex-col md:flex-row gap-4 justify-between",
  tabsContainer: "flex flex-wrap gap-2",
  tabButton: (active) => 
    `px-4 py-2 rounded-lg text-sm font-medium capitalize ${
      active 
        ? "bg-[#43C6AC] text-white shadow-sm" 
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`,
  searchContainer: "relative flex-1 min-w-[300px]",
  searchIcon: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
  searchInput: "w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
  
  // Table
  ordersTableContainer: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
  table: "min-w-full",
  tableHead: "bg-gray-50 border-b border-gray-200",
  tableHeader: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group",
  tableHeaderContent: "flex items-center",
  tableRow: "hover:bg-gray-50",
  tableCell: "px-6 py-4 whitespace-nowrap",
  idCell: "text-sm font-medium text-[#43C6AC]",
  customerCell: "text-sm text-gray-900",
  dateCell: "text-sm text-gray-500",
  amountCell: "text-sm font-medium text-gray-900",
  paymentBadge: (isOnline) => 
    `flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
      isOnline 
        ? "bg-purple-100 text-purple-800" 
        : "bg-orange-100 text-orange-800"
    }`,
  viewButton: "px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs hover:bg-indigo-200 transition-colors",
  
  // Empty State
  emptyState: "text-center py-12",
  emptyIconContainer: "inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4",
  emptyIcon: "text-gray-400 w-8 h-8",
  emptyTitle: "text-lg font-medium text-gray-900 mb-1",
  emptyMessage: "text-gray-500 text-sm",
  
  // Footer
  tableFooter: "px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center",
  footerText: "text-sm text-gray-600",
  footerLegend: "flex gap-4",
  legendItem: "flex items-center gap-2",
  legendDot: (color) => `w-3 h-3 ${color} rounded-full`,
  legendLabel: "text-xs text-gray-600",
  
  // Modal
  modalOverlay: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm",
  modalContainer: "bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto",
  modalHeader: "border-b border-gray-200 p-8 flex justify-between items-start",
  modalTitle: "text-2xl font-bold text-gray-900",
  modalSubtitle: "text-gray-600 text-base mt-2",
  closeButton: "text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors",
  closeButtonDanger: "bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300",
  modalConfirmButton: "px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800",
  modalCancelButton: "px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200",
  
  // Modal Grid
  modalGrid: "p-8 grid grid-cols-1 lg:grid-cols-2 gap-8",
  modalSection: "bg-gray-50 border border-gray-200 rounded-xl p-6",
  sectionTitle: "text-xl font-semibold text-gray-900 mb-6 flex items-center",
  sectionIcon: "w-6 h-6 mr-3 text-[#43C6AC]",
  sectionContent: "space-y-5",
  infoItem: "flex items-start space-x-4",
  infoIcon: "w-5 h-5 text-gray-500 mt-1 flex-shrink-0",
  infoLabel: "font-medium text-gray-900 text-sm",
  infoValue: "text-gray-700 text-base leading-relaxed",
  
  // Order Summary
  summaryItem: "flex justify-between items-center border-b pb-3",
  summaryTitle: "font-medium",
  summaryCategory: "text-gray-600 text-sm",
  summaryPrice: "text-right",
  totalItem: (isTotal) => `flex justify-between ${isTotal ? "pt-2 border-t" : ""}`,
  totalLabel: "text-gray-600",
  totalValue: (isTotal) => isTotal ? "font-bold text-lg text-[#43C6AC]" : "",
  
  // Payment Info
  paymentInfoItem: "flex justify-between",
  paymentLabel: "text-gray-600",
  paymentBadgeModal: (color) => `px-3 py-1 rounded-full text-xs ${color}`,
  
  // Status Update
  statusLabel: "block text-sm font-semibold text-gray-900 mb-3",
  statusSelect: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#43C6AC] focus:border-transparent text-base",
  statusUpdateSection: "bg-gradient-to-r from-[#43C6AC]/10 to-[#F8FFAE]/10 border-2 border-[#43C6AC]/20 rounded-xl p-6",
  statusUpdateTitle: "text-xl font-semibold text-gray-900 mb-4 flex items-center",
  statusUpdateIcon: "w-6 h-6 mr-3 text-[#43C6AC]",
  statusCurrentBadge: "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white border-2 border-gray-300",
  statusChangeIndicator: "ml-3 text-sm text-gray-600",
  
  // Modal Footer
  modalFooter: "border-t border-gray-200 p-8 flex justify-end space-x-3",
  footerButtonClose: "px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium",
  footerButtonSave: "px-6 py-3 bg-[#43C6AC] text-white rounded-lg hover:bg-[#538a7f] transition-colors font-medium",


  listBooksPage: "p-6 max-w-7xl mx-auto",
  listBooksHeader: "text-center mb-8",
  listBooksTitle: "text-3xl font-bold bg-gradient-to-r from-[#1A237E] to-[#43C6AC] bg-clip-text text-transparent",
  listBooksSubtitle: "text-gray-600 mt-2",
  controlsContainer: "bg-white rounded-2xl shadow-lg p-6 mb-8",
  controlsInner: "flex flex-col md:flex-row gap-4 justify-between",
  searchContainer: "relative flex-1 max-w-lg",
  searchIcon: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
  searchInput: "w-full pl-10 pr-3 py-2.5 border-0 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#43C6AC]",
  filterGroup: "relative group",
  filterGlow: "absolute -inset-0.5 bg-gradient-to-r from-[#43C6AC] to-[#F8FFAE] rounded-lg blur opacity-0 group-hover:opacity-20",
  filterContainer: "relative flex items-center",
  filterIcon: "absolute left-3 h-5 w-5 text-gray-400",
  filterSelect: "pl-10 pr-8 py-2.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#43C6AC]",
  booksTableContainer: "bg-white rounded-2xl shadow-lg overflow-hidden",
  table: "min-w-full",
  tableHead: "bg-gradient-to-r from-[#1A237E] to-[#43C6AC] text-white",
  tableHeader: "px-6 py-4 text-left cursor-pointer",
  tableHeaderContent: "flex items-center",
  tableRow: "hover:bg-gray-50",
  tableCell: "px-6 py-4",
  bookImage: "flex-shrink-0 h-12 w-12 bg-gray-200 border-2 border-dashed rounded-lg",
  bookTitle: "text-sm font-medium text-gray-900",
  categoryBadge: "px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full",
  actionButton: "text-gray-600 hover:text-gray-900",
  deleteButton: "text-red-600 hover:text-red-900",
  emptyState: "text-center py-12",
  emptyIconContainer: "inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4",
  emptyIcon: "text-gray-400 w-8 h-8",
  emptyTitle: "text-lg font-medium text-gray-900 mb-1",
  emptyMessage: "text-gray-500",
  tableFooter: "px-6 py-4 bg-gray-50 flex justify-between items-center",
  footerText: "text-sm text-gray-600",
  paginationButton: "px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50",
  paginationButtonNext: "px-4 py-2 bg-gradient-to-r from-[#1A237E] to-[#43C6AC] text-white rounded-lg hover:opacity-90",
  
  // RatingStars
  ratingContainer: "flex items-center",
  starContainer: "flex",
  starFilled: "text-amber-400 fill-amber-400",
  starEmpty: "text-gray-300",
  ratingText: "ml-1 text-sm text-gray-600",
  
  // StockBadge
  stockBadge: (stock) => `px-2.5 py-1 text-xs font-medium rounded-full ${
    stock > 10 
      ? 'bg-green-100 text-green-800' 
      : stock > 3 
        ? 'bg-yellow-100 text-yellow-800' 
        : 'bg-red-100 text-red-800'
  }`,



  // AddBooks specific styles
  addBooksPage: "min-h-screen pb-28 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6",
  addBooksContainer: "max-w-4xl mx-auto",
  headerContainer: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8",
  headerTitle: "text-2xl font-bold text-gray-900",
  headerSubtitle: "text-gray-600 mt-1",
  formContainer: "bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  formItem: "mb-6",
  formLabel: "block text-sm font-medium text-gray-700 mb-2",
  formInput: "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
  formTextarea: "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
  ratingContainer: "flex items-center gap-3",
  starsContainer: "flex",
  starFilled: "text-amber-400 fill-amber-400",
  starEmpty: "text-gray-300",
  previewContainer: "mt-6",
  previewTitle: "text-sm font-medium text-gray-700 mb-3",
  previewImage: "border border-gray-300 rounded-lg w-32 h-40 overflow-hidden",
  previewImg: "w-full h-full object-cover",
  submitContainer: "mt-8 flex justify-center",
  submitButton: "flex items-center gap-2 px-6 py-3 bg-[#43C6AC] text-white font-medium rounded-lg hover:bg-[#5ba193] transition-colors",
  // Sidebar specific styles
  sidebar: {
    container: (isCollapsed) => 
      `bg-gradient-to-t from-blue-300 via-blue-200 to-blue-100 text-blue-800 min-h-screen p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`,
    header: "flex justify-between items-center mb-8",
    logoContainer: "flex items-center gap-3",
    logoImageContainer: "bg-white p-2 rounded-lg",
    logoImage: "w-8 h-8",
    title: "text-xl font-bold text-blue-800",
    collapseButton: "p-2 rounded-full hover:bg-blue-300/90 transition-colors",
    nav: "space-y-1",
    navItem: (isCollapsed, isActive) => 
      `group flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
        isActive 
          ? 'bg-blue-200/90 shadow-md' 
          : 'hover:bg-blue-100/60'
      } ${isCollapsed ? 'justify-center' : ''}`,
    navItemInner: "flex items-center gap-3",
    iconContainer: (isActive) => 
      `p-2 rounded-lg ${
        isActive 
          ? 'bg-white text-blue-600' 
          : 'bg-blue-100 text-blue-700 group-hover:bg-white group-hover:text-blue-700'
      }`,
    navLabel: (isActive) => 
      `${isActive ? 'text-blue-800 font-medium' : 'text-blue-700 group-hover:text-blue-800'}`,
    divider: "h-px bg-blue-200/80 my-6",
    footer: (isCollapsed) => `mt-auto pt-4 ${isCollapsed ? 'text-center' : ''}`,
    footerText: "text-xs text-blue-600"
  },
  mobileNav: {
    container: "fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-300 via-blue-200 to-blue-100 z-50 shadow-lg",
    nav: "flex justify-around items-center py-3",
    item: "flex flex-col items-center w-full",
    iconContainer: (isActive) => 
      `p-2 rounded-lg ${isActive ? 'bg-white text-blue-600' : 'text-gray-400'}`,
    label: (isActive) => 
      `text-xs mt-1 ${isActive ? 'text-blue-700 font-medium' : 'text-gray-400'}`
  }




};

