import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default Layout;