import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  luhnCheck,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
  validateEmail,
} from '../../utils/cardValidation';
import styles from './CheckoutPage.module.css';

const EMAILJS_SERVICE_ID  = 'service_pqx48nr';
const EMAILJS_TEMPLATE_ID = 'template_gck17u7';
const EMAILJS_PUBLIC_KEY  = 'Q41GlKlgWj4MjnsIn';

const VisaLogo = () => (
  <svg viewBox="0 0 48 16" width="48" height="16" aria-label="Visa">
    <text x="0" y="14" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#1A1F71">VISA</text>
  </svg>
);

const MastercardLogo = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Mastercard">
    <circle cx="14" cy="12" r="12" fill="#EB001B" />
    <circle cx="24" cy="12" r="12" fill="#F79E1B" />
    <path d="M19 5.3a12 12 0 0 1 0 13.4A12 12 0 0 1 19 5.3z" fill="#FF5F00" />
  </svg>
);

function Section({ title, children }) {
  return (
    <motion.div
      className={styles.section}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', phone: '',
    fullName: '', address: '', city: '', postalCode: '', country: '',
    cardNumber: '', cardholderName: '', expiry: '', cvc: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (items.length === 0 && !submittingRef.current) navigate('/');
  }, [items.length, navigate]);

  const cardBrand = detectCardBrand(form.cardNumber);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      setForm(f => ({ ...f, cardNumber: formatCardNumber(value) }));
    } else if (name === 'expiry') {
      setForm(f => ({ ...f, expiry: formatExpiry(value) }));
    } else if (name === 'cvc') {
      setForm(f => ({ ...f, cvc: value.replace(/\D/g, '').slice(0, 4) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const e = {};
    const req = t('checkout.errors.required');

    if (!form.email) e.email = req;
    else if (!validateEmail(form.email)) e.email = t('checkout.errors.email');
    if (!form.phone) e.phone = req;
    if (!form.fullName) e.fullName = req;
    if (!form.address) e.address = req;
    if (!form.city) e.city = req;
    if (!form.postalCode) e.postalCode = req;
    if (!form.country) e.country = req;

    const rawCard = form.cardNumber.replace(/\s/g, '');
    if (!rawCard) e.cardNumber = req;
    else if (rawCard.length < 16) e.cardNumber = t('checkout.errors.card');
    else if (!luhnCheck(rawCard)) e.cardNumber = t('checkout.errors.card');
    else if (cardBrand === 'unknown') e.cardNumber = t('checkout.errors.brand');

    if (!form.cardholderName) e.cardholderName = req;

    if (!form.expiry) e.expiry = req;
    else if (!validateExpiry(form.expiry)) e.expiry = t('checkout.errors.expiry');

    if (!form.cvc) e.cvc = req;
    else if (form.cvc.length < 3) e.cvc = t('checkout.errors.cvc');

    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    setIsProcessing(true);
    submittingRef.current = true;

    const order = {
      id: 'GR-' + Date.now(),
      items: items.map(i => ({ ...i })),
      total: cartTotal,
      contact: { email: form.email, phone: form.phone },
      shipping: {
        fullName: form.fullName,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
      },
      notes: form.notes,
      last4: form.cardNumber.replace(/\s/g, '').slice(-4),
      brand: cardBrand,
    };

    const itemLines = order.items
      .map(({ product, quantity }) => `• ${product.name} × ${quantity} — ${(product.price * quantity).toFixed(2)} ₼`)
      .join('\n');

    const templateParams = {
      order_id:      order.id,
      customer_name: form.fullName,
      customer_email: form.email,
      customer_phone: form.phone,
      shipping_address: `${form.address}, ${form.city}, ${form.postalCode}, ${form.country}`,
      items_list:    itemLines,
      order_total:   `${cartTotal.toFixed(2)} ₼`,
      card_info:     `${cardBrand === 'visa' ? 'Visa' : 'Mastercard'} •••• ${order.last4}`,
      order_notes:   form.notes || '—',
    };

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      .catch(() => {/* silent — order still goes through */})
      .finally(() => {
        clearCart();
        navigate(`/order-confirmation/${order.id}`, { state: { order } });
      });
  }

  function field(name, label, type = 'text', placeholder = '') {
    return (
      <div className={styles.fieldGroup}>
        <label htmlFor={name} className={styles.label}>{label}</label>
        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${styles.input} ${errors[name] ? styles.inputError : ''}`}
          autoComplete={name}
          disabled={isProcessing}
        />
        {errors[name] && <span className={styles.errorMsg}>{errors[name]}</span>}
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
        {t('checkout.backToShop')}
      </Link>

      <h1 className={styles.pageTitle}>{t('checkout.title')}</h1>

      <div className={styles.layout}>
        {/* ── LEFT: Form ── */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Section title={t('checkout.contactSection')}>
            <div className={styles.grid2}>
              {field('email', t('checkout.email'), 'email', 'you@example.com')}
              {field('phone', t('checkout.phone'), 'tel', '+994 50 000 00 00')}
            </div>
          </Section>

          <Section title={t('checkout.shippingSection')}>
            {field('fullName', t('checkout.fullName'), 'text', 'John Doe')}
            {field('address', t('checkout.address'), 'text', '123 Main St')}
            <div className={styles.grid3}>
              {field('city', t('checkout.city'), 'text', 'Baku')}
              {field('postalCode', t('checkout.postalCode'), 'text', 'AZ1000')}
              {field('country', t('checkout.country'), 'text', 'Azerbaijan')}
            </div>
          </Section>

          <Section title={t('checkout.paymentSection')}>
            {/* Card number with brand icon */}
            <div className={styles.fieldGroup}>
              <label htmlFor="cardNumber" className={styles.label}>{t('checkout.cardNumber')}</label>
              <div className={styles.cardInputWrap}>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={handleChange}
                  placeholder="0000 0000 0000 0000"
                  className={`${styles.input} ${styles.cardInput} ${errors.cardNumber ? styles.inputError : ''}`}
                  maxLength={19}
                  disabled={isProcessing}
                />
                <span className={styles.brandIcon}>
                  {cardBrand === 'visa' && <VisaLogo />}
                  {cardBrand === 'mastercard' && <MastercardLogo />}
                </span>
              </div>
              {errors.cardNumber && <span className={styles.errorMsg}>{errors.cardNumber}</span>}
            </div>

            {field('cardholderName', t('checkout.cardholderName'), 'text', 'JOHN DOE')}

            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="expiry" className={styles.label}>{t('checkout.expiry')}</label>
                <input
                  id="expiry"
                  name="expiry"
                  type="text"
                  inputMode="numeric"
                  value={form.expiry}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  className={`${styles.input} ${errors.expiry ? styles.inputError : ''}`}
                  maxLength={5}
                  disabled={isProcessing}
                />
                {errors.expiry && <span className={styles.errorMsg}>{errors.expiry}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="cvc" className={styles.label}>{t('checkout.cvc')}</label>
                <input
                  id="cvc"
                  name="cvc"
                  type="text"
                  inputMode="numeric"
                  value={form.cvc}
                  onChange={handleChange}
                  placeholder="CVC"
                  className={`${styles.input} ${errors.cvc ? styles.inputError : ''}`}
                  maxLength={4}
                  disabled={isProcessing}
                />
                {errors.cvc && <span className={styles.errorMsg}>{errors.cvc}</span>}
              </div>
            </div>

            <div className={styles.acceptedCards}>
              <span className={styles.acceptedLabel}>{t('checkout.acceptedCards')}</span>
              <VisaLogo />
              <MastercardLogo />
            </div>
          </Section>

          <Section title={t('checkout.notesSection')}>
            <div className={styles.fieldGroup}>
              <label htmlFor="notes" className={styles.label}>{t('checkout.notesLabel')}</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder={t('checkout.notesPlaceholder')}
                className={styles.textarea}
                rows={3}
                disabled={isProcessing}
              />
            </div>
          </Section>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className={styles.processingWrap}>
                <span className={styles.spinner} />
                {t('checkout.processing')}
              </span>
            ) : (
              `${t('checkout.placeOrder')} — ${cartTotal.toFixed(2)} ₼`
            )}
          </button>
        </form>

        {/* ── RIGHT: Order summary ── */}
        <div className={styles.summaryBox}>
          <h3 className={styles.summaryTitle}>{t('checkout.summary')}</h3>
          <ul className={styles.summaryItems}>
            {items.map(({ product, quantity }) => (
              <li key={product.id} className={styles.summaryItem}>
                <img src={product.image} alt={product.name} className={styles.summaryImg} />
                <div className={styles.summaryInfo}>
                  <span className={styles.summaryName}>{product.name}</span>
                  <span className={styles.summaryQty}>× {quantity}</span>
                </div>
                <span className={styles.summaryPrice}>
                  {(product.price * quantity).toFixed(2)} ₼
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.summaryTotal}>
            <span>{t('checkout.totalLabel')}</span>
            <span className={styles.summaryTotalPrice}>{cartTotal.toFixed(2)} ₼</span>
          </div>
          <p className={styles.secureNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {t('checkout.securePayment')}
          </p>
        </div>
      </div>
    </div>
  );
}
