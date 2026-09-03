import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { estaAutenticado } from "../services/authService";
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

  // Limpieza local inmediata (sin llamar al backend). Útil al cerrar sesión
  // para que el carrito no muestre datos del usuario anterior.
  const limpiarCarrito = useCallback(() => {
    setCarritoId(null);
    setItems([]);
    setIsOpen(false);
    setError(null);
  }, []);

  const cargarCarrito = useCallback(async () => {
    if (!estaAutenticado()) {
      setCarritoId(null);
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      const carrito = await obtenerOCrearCarrito();

      setCarritoId(carrito.id);

      const detalles = await listarItemsDelCarrito(carrito.id);

      if (Array.isArray(detalles)) {
        setItems(detalles);
      } else if (Array.isArray(detalles?.data)) {
        setItems(detalles.data);
      } else if (Array.isArray(detalles?.content)) {
        setItems(detalles.content);
      } else {
        console.warn("El backend no devolvió un arreglo:", detalles);
        setItems([]);
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("No fue posible cargar tu carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito, usuario]);

  const agregarProducto = async (producto, opciones = {}) => {
    if (!estaAutenticado()) {
      setError("Debes iniciar sesión para añadir al carrito.");
      throw new Error("NO_AUTH");
    }
    try {
      setLoading(true);

      let idCarrito = carritoId;

      if (!idCarrito) {
        const carrito = await obtenerOCrearCarrito();
        idCarrito = carrito.id;
        setCarritoId(idCarrito);
      }

      const varianteId = opciones.varianteId ?? null;
      const listaItems = Array.isArray(items) ? items : [];

      const existente = listaItems.find(
        (item) =>
          item.productoId === producto.id &&
          (item.varianteId ?? null) === varianteId
      );

      let itemActualizado;

      if (existente) {
        itemActualizado = await actualizarCantidadItem(
          existente,
          existente.cantidad + 1
        );

        setItems((prev) =>
          prev.map((item) =>
            item.id === existente.id ? itemActualizado : item
          )
        );
      } else {
        itemActualizado = await agregarItem({
          carritoId: idCarrito,
          productoId: producto.id,
          cantidad: 1,
          varianteId,
        });

        setItems((prev) => [...prev, itemActualizado]);
      }

      setError(null);
      abrirCarrito();
      return itemActualizado;
    } catch (err) {
      console.error(err);
      if (err.message === "NO_AUTH") throw err;
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Debes iniciar sesión para añadir al carrito.");
        throw err;
      }
      if (msg?.toLowerCase().includes("stock")) {
        setError(msg);
        throw err;
      }
      setError(msg || "No fue posible agregar el producto al carrito.");
      throw err;
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
    const listaItems = Array.isArray(items) ? items : [];
    const item = listaItems.find((i) => i.id === itemId);

    if (!item) return;

    if (nuevaCantidad <= 0) {
      await eliminarProducto(itemId);
      return;
    }

    try {
      setLoading(true);

      const itemActualizado = await actualizarCantidadItem(
        item,
        nuevaCantidad
      );

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? itemActualizado : i))
      );

      setError(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message;
      if (msg?.toLowerCase().includes("stock")) {
        setError(msg);
      } else {
        setError(msg || "No fue posible actualizar la cantidad.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const aumentarCantidad = (itemId) => {
    const listaItems = Array.isArray(items) ? items : [];
    const item = listaItems.find((i) => i.id === itemId);

    if (item) cambiarCantidad(itemId, item.cantidad + 1);
  };

  const disminuirCantidad = (itemId) => {
    const listaItems = Array.isArray(items) ? items : [];
    const item = listaItems.find((i) => i.id === itemId);

    if (item) cambiarCantidad(itemId, item.cantidad - 1);
  };

  const vaciarCarrito = async () => {
    try {
      setLoading(true);

      const listaItems = Array.isArray(items) ? items : [];

      await Promise.all(listaItems.map((item) => eliminarItem(item.id)));

      setItems([]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible vaciar el carrito.");
    } finally {
      setLoading(false);
    }
  };

  const cantidadProductos = useMemo(() => {
    const listaItems = Array.isArray(items) ? items : [];
    return listaItems.reduce((acc, item) => acc + item.cantidad, 0);
  }, [items]);

  const total = useMemo(() => {
    const listaItems = Array.isArray(items) ? items : [];
    return listaItems.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    );
  }, [items]);

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
        limpiarCarrito,
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