import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes from './routes/AppRoutes';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <AppRoutes />
        </Layout>
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AppContent />
        </GoogleOAuthProvider>
      ) : (
        <AppContent />
      )}
    </ThemeProvider>
  );
}

export default App;