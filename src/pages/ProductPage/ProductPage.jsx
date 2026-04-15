import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import products from '../../data/products';
import styles from './ProductPage.module.css';

export default function ProductPage() {
  const { id } = useParams();
  const { t } = useLanguage();

  const product = products.find(p => p.id === Number(id));
  const hasDiscount = product && typeof product.originalPrice === 'number' && product.originalPrice > product.price;

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>{t('common.productNotFound')}</h2>
          <Link to="/" className={styles.backLink}>{t('productPage.back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t('productPage.back')}
      </Link>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.imageWrap}>
          <img src={product.image} alt={product.name} className={styles.image} />
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
        </div>

        <div className={styles.details}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.priceWrap}>
            {hasDiscount && <p className={styles.originalPrice}>{product.originalPrice.toFixed(2)}{"\u20BC"}</p>}
            <p className={`${styles.price} ${hasDiscount ? styles.salePrice : ''}`}>{product.price.toFixed(2)}{"\u20BC"}</p>
          </div>
          <p className={styles.description}>{product.description}</p>
          <div className={styles.catalogueNote}>
            {t('productPage.catalogueOnly')}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
