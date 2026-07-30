import { useEffect, useState } from "react";

import { listarProductos } from "../services/productService";

function useProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await listarProductos();
      setProductos(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return {
    productos,
    loading,
    error,
    recargar: cargarProductos,
  };
}

export default useProducts;