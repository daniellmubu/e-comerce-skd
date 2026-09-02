import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <AppRoutes />
          </Layout>
          <Toaster position="bottom-right" richColors />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;