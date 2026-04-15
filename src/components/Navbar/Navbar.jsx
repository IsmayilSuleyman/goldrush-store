import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <img src="/images/logo.png" alt="GoldRush" style={{ height: '40px', width: 'auto' }} />
          <span>GoldRush</span>
        </Link>

        <div className={styles.actions}>
          <button
            className={styles.langBtn}
            onClick={toggleLanguage}
            aria-label="Toggle language"
            title={language === 'az' ? t('languages.english') : t('languages.azerbaijani')}
          >
            {language === 'az' ? 'EN' : 'AZ'}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
