import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookPlus, 
  BookOpen, 
  ShoppingCart,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logoicon.png';
import {styles} from '../assets/dummyStyles';

const Sidebar = ({ isCollapsed: isCollapsedProp = false, onCollapse }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(isCollapsedProp);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsCollapsed(isCollapsedProp);
  }, [isCollapsedProp]);
  
  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/add-books', icon: BookPlus, label: 'Add Books' },
    { path: '/list-books', icon: BookOpen, label: 'List Books' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chat Assistant' },
  ];

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      onCollapse?.(next);
      return next;
    });
  };

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div className={styles.mobileNav.container}>
        <nav className={styles.mobileNav.nav}>
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={styles.mobileNav.item}
              >
                <div className={styles.mobileNav.iconContainer(isActive)}>
                  <Icon className="h-5 w-5 mx-auto" />
                </div>
                <span className={styles.mobileNav.label(isActive)}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div className={styles.sidebar.container(isCollapsed)}>
      <div className={styles.sidebar.header}>
        {!isCollapsed && (
          <div className={styles.sidebar.logoContainer}>
            <div className={styles.sidebar.logoImageContainer}>
              <img src={logo} alt="Logo" className={styles.sidebar.logoImage} />
            </div>
            <div>
              <h1 className={styles.sidebar.title}>
                BOOKSTORE
              </h1>
            </div>
          </div>
        )}
        
        <button 
          onClick={toggleCollapse}
          className={styles.sidebar.collapseButton}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className={styles.sidebar.nav}>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={styles.sidebar.navItem(isCollapsed, isActive)}
            >
              <div className={styles.sidebar.navItemInner}>
                <div className={styles.sidebar.iconContainer(isActive)}>
                  <Icon className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <span className={styles.sidebar.navLabel(isActive)}>
                    {label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebar.divider} />

      <div className={styles.sidebar.footer(isCollapsed)}>
        {!isCollapsed && (
          <div className="flex flex-col gap-2">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <p className={styles.sidebar.footerText}>© 2025 Bookstore</p>
          </div>
        )}
        {isCollapsed && (
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;