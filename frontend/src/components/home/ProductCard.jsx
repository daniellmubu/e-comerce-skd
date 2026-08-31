 import { useState } from "react";
import { FaHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Card from "../ui/Card";
import Button from "../ui/Button";

import { useCart } from "../../context/CartContext";
import { estaAutenticado } from "../../services/authService";

function ProductCard({ producto }) {
  const navigate = useNavigate();
  const { agregarProducto } = useCart();
  const [agregando, setAgregando] = useState(false);

  const handleAgregar = async () => {
    if (!estaAutenticado()) {
      navigate("/login");
      return;
    }

    setAgregando(true);
    try {
      await agregarProducto(producto);
    } finally {
      setAgregando(false);
    }
  };

  return (
    <Card className="group overflow-hidden">
      {/* Imagen */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={producto.imagenUrl || producto.imagen}
          alt={producto.nombre}
          className="
            h-64
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-110
          "
        />

        <button
          className="
            absolute
            right-3
            top-3
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-slate-900/80
            text-slate-300
            backdrop-blur
            transition
            hover:text-red-500
          "
        >
          <FaHeart />
        </button>
      </div>

      {/* Información */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{producto.nombre}</h3>

          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-400">
            {producto.categoria}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-slate-400">
          {producto.descripcion}
        </p>

        <div className="mt-4 flex items-center gap-1 text-yellow-400">
          <FaStar />
          <span className="text-sm">{producto.calificacion || 5}</span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-2xl font-bold text-cyan-400">
            ${producto.precio.toLocaleString()}
          </span>

          <Button
            leftIcon={<FaShoppingCart />}
            onClick={handleAgregar}
            loading={agregando}
          >
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;