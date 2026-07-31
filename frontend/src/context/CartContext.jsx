import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { estaAutenticado, obtenerUsuarioId } from "../services/authService";
import { useAuth } from "./AuthContext";
import {
  obtenerOCrearCarrito,
  listarItemsDelCarrito,
  agregarItem,
  eliminarItem,
  actualizarCantidadItem,
} from "../services/carritoService";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { usuario } = useAuth();
  const [carritoId, setCarritoId] = useState(null);
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abrirCarrito = () => setIsOpen(true);
  const cerrarCarrito = () => setIsOpen(false);

  const cargarCarrito = useCallback(async () => {
    if (!estaAutenticado()) {
      setCarritoId(null);
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const usuarioId = obtenerUsuarioId();
      const carrito = await obtenerOCrearCarrito(usuarioId);
      setCarritoId(carrito.id);

      const detalles = await listarItemsDelCarrito(carrito.id);
      setItems(detalles);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar tu carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito, usuario]);

  const agregarProducto = async (producto) => {
    try {
      setLoading(true);

      let idCarrito = carritoId;
      if (!idCarrito) {
        const usuarioId = obtenerUsuarioId();
        const carrito = await obtenerOCrearCarrito(usuarioId);
        idCarrito = carrito.id;
        setCarritoId(idCarrito);
      }

      const existente = items.find((item) => item.productoId === producto.id);

      let itemActualizado;
      if (existente) {
        itemActualizado = await actualizarCantidadItem(
          existente,
          existente.cantidad + 1
        );
        setItems((prev) =>
          prev.map((item) => (item.id === existente.id ? itemActualizado : item))
        );
      } else {
        itemActualizado = await agregarItem({
          carritoId: idCarrito,
          productoId: producto.id,
          cantidad: 1,
        });
        setItems((prev) => [...prev, itemActualizado]);
      }

      setError(null);
      abrirCarrito();
    } catch (err) {
      console.error(err);
      setError("No fue posible agregar el producto al carrito.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (itemId) => {
    try {
      setLoading(true);
      await eliminarItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible eliminar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const cambiarCantidad = async (itemId, nuevaCantidad) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      await eliminarProducto(itemId);
      return;
    }

    try {
      setLoading(true);
      const itemActualizado = await actualizarCantidadItem(item, nuevaCantidad);
      setItems((prev) => prev.map((i) => (i.id === itemId ? itemActualizado : i)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible actualizar la cantidad.");
    } finally {
      setLoading(false);
    }
  };

  const aumentarCantidad = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (item) cambiarCantidad(itemId, item.cantidad + 1);
  };

  const disminuirCantidad = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (item) cambiarCantidad(itemId, item.cantidad - 1);
  };

  const vaciarCarrito = async () => {
    try {
      setLoading(true);
      await Promise.all(items.map((item) => eliminarItem(item.id)));
      setItems([]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible vaciar el carrito.");
    } finally {
      setLoading(false);
    }
  };

  const cantidadProductos = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.subtotal), 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        loading,
        error,
        total,
        cantidadProductos,
        abrirCarrito,
        cerrarCarrito,
        agregarProducto,
        eliminarProducto,
        aumentarCantidad,
        disminuirCantidad,
        vaciarCarrito,
        recargarCarrito: cargarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}