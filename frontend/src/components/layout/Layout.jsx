import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import ChatWidget from '../chat/ChatWidget';
import WhatsAppButton from '../chat/WhatsAppButton';
import { useAuth } from '../../context/AuthContext';

function Layout({ children }) {
  const { usuario } = useAuth();
  const esDisenador = usuario?.rol === "disenador";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      {!esDisenador && <CartDrawer />}
      <ChatWidget />
      <WhatsAppButton />
    </div>
  );
}

export default Layout;