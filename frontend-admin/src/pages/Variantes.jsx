import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxOpen,
  FaTshirt,
  FaArrowLeft,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Select from "../components/Select";
import { getErrorMessage } from "../api/axios";
import { listarProductos } from "../api/productosApi";
import {
  listarVariantesDeProducto,
  crearVariante,
  actualizarVariante,
  eliminarVariante,
} from "../api/variantesApi";
import { formatPrice } from "../utils/formato";

const FORM_VACIO = {
  talla: "",
  color: "",
  stock: "",
  precio: "",
  sku: "",
};

function Variantes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const productoIdInicial = searchParams.get("productoId") || "";
  const productoNombreInicial = searchParams.get("nombre") || "";

  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState(productoIdInicial);
  const [productoNombre, setProductoNombre] = useState(productoNombreInicial);

  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  // Carga los productos para el selector.
  const cargarProductos = useCallback(async () => {
    try {
      const resultado = await listarProductos({ size: 100, activo: true });
      setProductos(resultado?.content ?? []);
      // Si no vino un producto por URL, tomamos el primero.
      if (!productoIdInicial && resultado?.content?.length > 0) {
        const primero = resultado.content[0];
        setProductoId(String(primero.id));
        setProductoNombre(primero.nombre);
      }
    } catch {
      setProductos([]);
    }
  }, [productoIdInicial]);

  const cargarVariantes = useCallback(
    async (id) => {
      if (!id) {
        setVariantes([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const lista = await listarVariantesDeProducto(id);
        setVariantes(lista);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  useEffect(() => {
    cargarVariantes(productoId);
  }, [cargarVariantes, productoId]);

  const cambiarProducto = (e) => {
    const id = e.target.value;
    setProductoId(id);
    const producto = productos.find((p) => String(p.id) === id);
    setProductoNombre(producto?.nombre || "");
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (variante) => {
    setEditando(variante);
    setForm({
      talla: variante.talla || "",
      color: variante.color || "",
      stock: variante.stock ?? "",
      precio: variante.precio ?? "",
      sku: variante.sku || "",
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stock = Number(form.stock);
    const precio = Number(form.precio);

    if (!productoId) {
      setFormError("Debes seleccionar un producto");
      return;
    }
    if (!form.talla.trim()) {
      setFormError("La talla es obligatoria");
      return;
    }
    if (!form.color.trim()) {
      setFormError("El color es obligatorio");
      return;
    }
    if (form.stock === "" || Number.isNaN(stock) || stock < 0) {
      setFormError("Ingresa un stock válido (mayor o igual a 0)");
      return;
    }
    if (form.precio === "" || Number.isNaN(precio) || precio < 0) {
      setFormError("Ingresa un precio válido (mayor o igual a 0)");
      return;
    }

    const payload = {
      productoId: Number(productoId),
      talla: form.talla.trim(),
      color: form.color.trim(),
      stock,
      precio,
      sku: form.sku.trim() || null,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarVariante(editando.id, payload);
      } else {
        await crearVariante(payload);
      }
      setModalAbierto(false);
      cargarVariantes(productoId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarVariante(eliminando.id);
      setEliminando(null);
      cargarVariantes(productoId);
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const opcionesProductos = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <FaTshirt className="text-indigo-600 dark:text-cyan-400" />
            Variantes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestiona tallas, colores, stock y precio de cada producto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/productos")}
            leftIcon={<FaArrowLeft />}
          >
            Volver a productos
          </Button>
          <Button
            onClick={abrirCrear}
            disabled={!productoId}
            leftIcon={<FaPlus />}
          >
            Nueva variante
          </Button>
        </div>
      </div>

      {/* Selector de producto */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <Select
          label="Producto"
          placeholder="Selecciona un producto"
          options={opcionesProductos}
          value={productoId}
          onChange={cambiarProducto}
        />
        {productoNombre && (
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <FaBoxOpen className="text-indigo-500 dark:text-cyan-400" />
            Mostrando variantes de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {productoNombre}
            </span>
          </p>
        )}
      </div>

      {/* Contenido */}
      {!productoId ? (
        <EmptyState
          icon={<FaBoxOpen />}
          title="Selecciona un producto"
          description="Elige un producto para ver y gestionar sus variantes."
        />
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando variantes..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => cargarVariantes(productoId)}
          >
            Reintentar
          </Button>
        </div>
      ) : variantes.length === 0 ? (
        <EmptyState
          icon={<FaTshirt />}
          title="Sin variantes"
          description="Este producto aún no tiene variantes. Crea la primera."
        >
          <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
            Nueva variante
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Talla</th>
                  <th className="px-6 py-4">Color</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="hidden px-6 py-4 md:table-cell">SKU</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {variantes.map((variante) => (
                  <tr
                    key={variante.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{variante.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {variante.talla || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {variante.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300 dark:border-slate-600"
                            style={{
                              backgroundColor: variante.color.toLowerCase(),
                            }}
                            title={variante.color}
                          />
                          {variante.color}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {variante.stock > 0 ? (
                        <Badge variant="green">{variante.stock} und</Badge>
                      ) : (
                        <Badge variant="red">Sin stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(variante.precio)}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {variante.sku || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(variante)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(variante)}
                          leftIcon={<FaTrash />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? `Editar variante #${editando.id}` : "Nueva variante"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-variante"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear variante"}
            </Button>
          </>
        }
      >
        <form id="form-variante" onSubmit={handleSubmit} className="space-y-4">
          {productoNombre && (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Producto:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {productoNombre}
              </span>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Talla"
              placeholder="Ej. S, M, L, XL, Única"
              value={form.talla}
              onChange={(e) => setForm({ ...form, talla: e.target.value })}
            />
            <Input
              label="Color"
              placeholder="Ej. Blanco, Negro, Azul"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Input
              label="Precio (COP)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <Input
              label="SKU (opcional)"
              placeholder="Ej. CAM-M-AZUL"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>

          {formError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar variante"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEliminando(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminandoLoading}
              onClick={confirmarEliminar}
              leftIcon={<FaTrash />}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que deseas eliminar la variante{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {eliminando?.talla || "—"}
            {eliminando?.talla && eliminando?.color ? " / " : ""}
            {eliminando?.color || ""}
          </span>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

export default Variantes;
