import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar/Navbar';
import FloatingOrbs from './components/FloatingOrbs/FloatingOrbs';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage/HomePage';
import ProductPage from './pages/ProductPage/ProductPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <FloatingOrbs />
          <Navbar />
          <ScrollToTop />
          <main style={{ flex: 1, paddingTop: '70px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </main>
          <Footer />
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
