import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import ChatWidget from '../chat/ChatWidget';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}

export default Layout;