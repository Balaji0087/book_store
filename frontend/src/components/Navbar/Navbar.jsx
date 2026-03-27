import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Menu, X, User, Package
} from 'lucide-react'
import { useCart } from "../../CartContext/CartContext"
import logo from "../../assets/logoicon.png"
import { navbarStyles } from "../../assets/dummystyles"
import { FaOpencart } from 'react-icons/fa';
import { navItems } from '../../assets/dummydata'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { cart } = useCart()

  const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={navbarStyles.nav(scrolled)}>
      <div className={navbarStyles.container}>
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className={navbarStyles.logoContainer}>
            <div className="relative group">
              <div className={navbarStyles.logoGradient} />
              <div className="relative flex items-center">
                <img src={logo} alt="Logo" className={navbarStyles.logoImage} />
                <div className="ml-2">
                  <h1 className={navbarStyles.logoText}>BOOKSTORE</h1>
                  <div className={navbarStyles.logoUnderline} />
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className={navbarStyles.desktopNavWrapper}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link key={item.name} to={item.path} className={navbarStyles.navLink}>
                  <div className="relative z-10 flex items-center">
                    <div className="relative">
                      <div className={navbarStyles.navIconWrapper(item.color)} />
                      <item.icon className={navbarStyles.navIcon(isActive)} />
                    </div>
                    <span className={navbarStyles.navText(isActive, item.color)}>{item.name}</span>
                    {isActive && <span className={navbarStyles.navUnderline(item.color)} />}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Right Icons */}
          <div className={navbarStyles.rightIconsWrapper}>
            <Link to="/cart" className={navbarStyles.cartWrapper}>
              <div className={navbarStyles.cartGradient} />
              <div className="relative">
                <FaOpencart className={navbarStyles.cartIcon} />
                {totalQuantity > 0 && (
                  <span className={navbarStyles.cartBadge}>{totalQuantity}</span>
                )}
              </div>
            </Link>
            <Link to="/login" className={navbarStyles.loginWrapper}>
              <div className={navbarStyles.loginGradient} />
              <div className="relative">
                <User className={navbarStyles.loginIcon} />
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className={navbarStyles.menuBtn}>
              <div className={navbarStyles.menuGradient} />
              <div className="relative">
                {isOpen ? <X className={navbarStyles.menuIcon} /> : <Menu className={navbarStyles.menuIcon} />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={navbarStyles.mobileMenu}>
          <div className={navbarStyles.mobileContainer}>
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)}
                    className={navbarStyles.mobileNavItem(isActive, item.color)}>
                    <item.icon className={navbarStyles.mobileNavIcon(isActive, item.color)} />
                    <span className={navbarStyles.mobileNavText(isActive, item.color)}>{item.name}</span>
                  </Link>
                )
              })}

              <div className={navbarStyles.mobileIconRow}>
                <Link to="/cart" className="relative group p-2" onClick={() => setIsOpen(false)}>
                  <FaOpencart className="h-5 w-5 text-gray-600 group-hover:text-amber-600" />
                  {totalQuantity > 0 && (
                    <span className={navbarStyles.mobileCartBadge}>{totalQuantity}</span>
                  )}
                </Link>

                <Link to="/login" className="p-2 group" onClick={() => setIsOpen(false)}>
                  <User className="h-5 w-5 text-gray-600 group-hover:text-emerald-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar