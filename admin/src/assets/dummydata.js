export const initialOrders = [
    { 
      id: '#ORD-1001', 
      customer: 'John Doe', 
      date: 'Oct 15, 2025', 
      amount: 1250, 
      payment: 'online', 
      status: 'delivered',
      paymentStatus: 'paid',
      address: '123 Main St, New York, NY 10001',
      email: 'john@example.com',
      phone: '555-123-4567',
      books: [
        { title: 'The Silent Echo', category: 'Mystery', quantity: 1, price: 205 },
        { title: 'Digital Fortress', category: 'Thriller', quantity: 1, price: 190 }
      ]
    },
    { 
      id: '#ORD-1002', 
      customer: 'Jane Smith', 
      date: 'Oct 16, 2025', 
      amount: 890, 
      payment: 'cod', 
      status: 'processing',
      paymentStatus: 'pending',
      address: '456 Park Ave, Boston, MA 02108',
      email: 'jane@example.com',
      phone: '555-987-6543',
      books: [
        { title: 'The Last Orbit', category: 'Sci-Fi', quantity: 1, price: 202 },
        { title: 'Beyond the Stars', category: 'Sci-Fi', quantity: 1, price: 209 }
      ]
    },
    { 
      id: '#ORD-1003', 
      customer: 'Robert Johnson', 
      date: 'Oct 17, 2025', 
      amount: 2150, 
      payment: 'online', 
      status: 'shipped',
      paymentStatus: 'paid',
      address: '789 Broadway, Chicago, IL 60601',
      email: 'robert@example.com',
      phone: '555-456-7890',
      books: [
        { title: 'Mystic River', category: 'Drama', quantity: 2, price: 199 },
        { title: 'The Alchemist', category: 'Philosophy', quantity: 3, price: 179 }
      ]
    },
    { 
      id: '#ORD-1004', 
      customer: 'Emily Davis', 
      date: 'Oct 18, 2025', 
      amount: 1540, 
      payment: 'cod', 
      status: 'pending',
      paymentStatus: 'pending',
      address: '101 Oak St, San Francisco, CA 94102',
      email: 'emily@example.com',
      phone: '555-789-0123',
      books: [
        { title: 'Atomic Habits', category: 'Self-Help', quantity: 1, price: 299 },
        { title: 'Thinking, Fast and Slow', category: 'Psychology', quantity: 2, price: 249 },
        { title: 'The Design Of Books', category: 'Design', quantity: 1, price: 349 }
      ]
    },
  ];