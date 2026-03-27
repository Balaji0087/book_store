import { Link } from "react-router-dom"
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react"
import logo from "../../assets/logoicon.png"
import { footerStyles as styles } from "../../assets/dummystyles"

import {socialLinks,quickLinks} from '../../assets/dummydata'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.logoBlock}>
            <Link to="/" className={styles.logoLink}>
              <img src={logo} alt="Logo" className={styles.logoImg} />
              <h1 className={styles.logoText}>BOOKSTORE</h1>
            </Link>
            <p className={styles.aboutText}>
              Your gateway to literary adventures. Discover, explore, and immerse yourself in the world of books.
            </p>
            <div className={styles.socialWrap}>
              {socialLinks.map(({ Icon, url }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label={`Visit our ${Icon.name} page`}
                >
                  <Icon className={styles.socialIcon} />
                </a>
              ))}
            </div>
          </div>

          <div className={styles.quickLinksBlock}>
            <h3 className={styles.quickLinksTitle}>Quick Links</h3>
            <ul className={styles.quickLinksList}>
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.url} className={styles.quickLinkItem}>
                    <span className={styles.quickLinkDot}></span>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.newsletterBlock}>
            <h3 className={styles.newsletterTitle}>Stay Updated</h3>
            <p className={styles.newsletterText}>
              Subscribe to our newsletter for the latest releases and exclusive offers.
            </p>
            <form className={styles.formWrap}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.input}
              />
              <button type="submit" className={styles.button}>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className={styles.contactBlock}>
            <h3 className={styles.contactTitle}>Contact Us</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <MapPin className={styles.contactIcon} />
                <span>123 Literary Lane, Bookville, BK 12345</span>
              </div>
              <div className={styles.contactRow}>
                <Phone className={styles.contactIconInline} />
                <span>+1 (234) 567-8901</span>
              </div>
              <div className={styles.contactRow}>
                <Mail className={styles.contactIconInline} />
                <span>contact@bookstore.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.copyrightWrap}>
          <p className={styles.copyrightText}>
            &copy; {new Date().getFullYear()} BookStore. All rights reserved.
          </p>
          <a href="https://hexagondigitalservices.com"
            target="_blank"
            className=" text-sm cursor-pointer text-gray-500 hover:text-purple-600">
            Powered By {" "}
            <br />
            Hexagon Digital Services
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
