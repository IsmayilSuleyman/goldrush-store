import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const hasDiscount = typeof product.originalPrice === 'number' && product.originalPrice > product.price;

  return (
    <Link to={`/product/${product.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={product.image} alt={product.name} className={styles.image} loading="lazy" />
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
      </div>
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.priceWrap}>
          {hasDiscount && <p className={styles.originalPrice}>{product.originalPrice.toFixed(2)}{"\u20BC"}</p>}
          <p className={`${styles.price} ${hasDiscount ? styles.salePrice : ''}`}>{product.price.toFixed(2)}{"\u20BC"}</p>
        </div>
      </div>
    </Link>
  );
}
