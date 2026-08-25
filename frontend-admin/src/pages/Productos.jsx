import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUndo,
  FaSearch,
  FaBoxOpen,
  FaPercent,
  FaCheckSquare,
  FaImage,
  FaUpload,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import Toggle from "../components/Toggle";
import { getErrorMessage } from "../api/axios";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  restaurarProducto,
  ajustarPrecios,
  subirImagenProducto,
} from "../api/productosApi";
import { listarCategorias } from "../api/categoriasApi";
import { formatPrice } from "../utils/formato";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  activo: true,
  masVendido: false,
  categoriaId: "",
};

const FILTROS_INICIALES = {
  search: "",
  categoriaId: "",
  activo: "",
  precioMin: "",
  precioMax: "",
};

// Construye los parámetros de consulta para listarProductos.
function construirParams(filtros, pagina, tamanio) {
  return {
    page: pagina,
    size: tamanio,
    nombre: filtros.search.trim() || undefined,
    categoriaId: filtros.categoriaId || undefined,
    activo: filtros.activo === "" ? undefined : filtros.activo === "true",
    precioMin: filtros.precioMin || undefined,
    precioMax: filtros.precioMax || undefined,
  };
}

function Productos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);

  const [categorias, setCategorias] = useState([]);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  // Ajuste de precios en lote
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [modalPrecioAbierto, setModalPrecioAbierto] = useState(false);
  const [porcentaje, setPorcentaje] = useState("");
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);
  const [errorPrecio, setErrorPrecio] = useState(null);
  const [mensajePrecio, setMensajePrecio] = useState(null);
  const checkSeleccionRef = useRef(null);

  // Imagen del producto
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const manejarImagenSeleccion = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImagenFile(archivo);
    setImagenPreview(URL.createObjectURL(archivo));
  };

  const limpiarImagen = () => {
    setImagenFile(null);
    setImagenPreview("");
  };

  // Carga las categorías para el select del formulario y del filtro.
  const cargarCategorias = useCallback(async () => {
    try {
      const resultado = await listarCategorias(0, 100);
      setCategorias(resultado?.content ?? []);
    } catch {
      setCategorias([]);
    }
  }, []);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtrosActuales = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarProductos(
          construirParams(filtrosActuales, pagina, tamanio)
        );
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size, filtrosAplicados]
  );

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros);
    setPage(0);
    limpiarSeleccion();
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
    setPage(0);
    limpiarSeleccion();
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setImagenFile(null);
    setImagenPreview("");
    setModalAbierto(true);
  };

  const abrirEditar = (producto) => {
    // El ProductoResponse NO expone categoriaId (solo el nombre de la categoría),
    // así que inferimos el id desde el listado de categorías cargado.
    const categoria = categorias.find((c) => c.nombre === producto.categoria);

    setEditando(producto);
    setForm({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || "",
      precio: producto.precio ?? "",
      stock: producto.stock ?? "",
      activo: producto.activo ?? true,
      masVendido: producto.masVendido ?? false,
      categoriaId: categoria?.id ?? "",
    });
    setImagenFile(null);
    setImagenPreview(producto.imagenUrl || "");
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const precio = Number(form.precio);
    const stock = Number(form.stock);

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (!form.precio || precio < 0) {
      setFormError("Ingresa un precio válido (mayor o igual a 0)");
      return;
    }
    if (!form.stock || stock < 0) {
      setFormError("Ingresa un stock válido (mayor o igual a 0)");
      return;
    }
    if (!form.categoriaId) {
      setFormError("Debes seleccionar una categoría");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio,
      stock,
      activo: form.activo,
      masVendido: form.masVendido,
      categoriaId: Number(form.categoriaId),
    };

    setGuardando(true);
    setFormError(null);
    try {
      let productoId = editando?.id;
      if (editando) {
        await actualizarProducto(editando.id, payload);
      } else {
        const creado = await crearProducto(payload);
        productoId = creado?.id ?? productoId;
      }
      if (imagenFile && productoId) {
        setSubiendoImagen(true);
        await subirImagenProducto(productoId, imagenFile);
      }
      setModalAbierto(false);
      setImagenFile(null);
      setImagenPreview("");
      cargar();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubiendoImagen(false);
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarProducto(eliminando.id);
      setEliminando(null);
      cargar();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const restaurar = async (producto) => {
    try {
      await restaurarProducto(producto.id);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const productos = data?.content ?? [];

  // ---- Selección múltiple para ajuste de precios ----
  const todosPaginaSeleccionados =
    productos.length > 0 && productos.every((p) => seleccionados.has(p.id));
  const algunosPaginaSeleccionados = productos.some((p) =>
    seleccionados.has(p.id)
  );

  useEffect(() => {
    if (checkSeleccionRef.current) {
      checkSeleccionRef.current.indeterminate =
        algunosPaginaSeleccionados && !todosPaginaSeleccionados;
    }
  }, [algunosPaginaSeleccionados, todosPaginaSeleccionados]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const toggleSeleccionTodosPagina = () => {
    const idsPagina = productos.map((p) => p.id);
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (idsPagina.every((id) => nuevo.has(id))) {
        idsPagina.forEach((id) => nuevo.delete(id));
      } else {
        idsPagina.forEach((id) => nuevo.add(id));
      }
      return nuevo;
    });
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const seleccionarTodosResultados = async () => {
    try {
      const total = data?.totalElements ?? 0;
      if (total === 0) return;
      const resultado = await listarProductos(
        construirParams(filtrosAplicados, 0, total)
      );
      setSeleccionados(new Set((resultado?.content ?? []).map((p) => p.id)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const abrirAjustePrecios = () => {
    setPorcentaje("");
    setErrorPrecio(null);
    setMensajePrecio(null);
    setModalPrecioAbierto(true);
  };

  const confirmarAjustePrecios = async () => {
    const valor = Number(porcentaje);
    if (porcentaje === "" || Number.isNaN(valor)) {
      setErrorPrecio("Ingresa un porcentaje válido");
      return;
    }
    if (valor < -100) {
      setErrorPrecio("El porcentaje no puede ser menor a -100");
      return;
    }
    const ids = Array.from(seleccionados);
    if (ids.length === 0) {
      setErrorPrecio("Selecciona al menos un producto");
      return;
    }
    setGuardandoPrecio(true);
    setErrorPrecio(null);
    setMensajePrecio(null);
    try {
      const resultado = await ajustarPrecios(ids, valor);
      setMensajePrecio(
        `Se actualizó el precio de ${resultado.actualizados} producto${
          resultado.actualizados === 1 ? "" : "s"
        }.`
      );
      setSeleccionados(new Set());
      cargar();
    } catch (err) {
      setErrorPrecio(getErrorMessage(err));
    } finally {
      setGuardandoPrecio(false);
    }
  };

  const productosSeleccionados = productos.filter((p) =>
    seleccionados.has(p.id)
  );
  const productoEjemplo = productosSeleccionados[0];
  const ejemploNuevoPrecio = (() => {
    if (!productoEjemplo || porcentaje === "") return null;
    const valor = Number(porcentaje);
    if (Number.isNaN(valor)) return null;
    return productoEjemplo.precio * (1 + valor / 100);
  })();

  const opcionesCategorias = categorias.map((c) => ({
    value: c.id,
    label: c.nombre,
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Productos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestiona el catálogo de productos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={abrirAjustePrecios}
            disabled={seleccionados.size === 0}
            leftIcon={<FaPercent />}
          >
            Ajustar precios
            {seleccionados.size > 0 ? ` (${seleccionados.size})` : ""}
          </Button>
          <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="Buscar por nombre..."
          icon={<FaSearch />}
          value={filtros.search}
          onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
        <Select
          placeholder="Todas las categorías"
          options={opcionesCategorias}
          value={filtros.categoriaId}
          onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
        />
        <Select
          placeholder="Todos los estados"
          options={[
            { value: "true", label: "Activos" },
            { value: "false", label: "Inactivos" },
          ]}
          value={filtros.activo}
          onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Precio mín."
            value={filtros.precioMin}
            onChange={(e) => setFiltros({ ...filtros, precioMin: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Precio máx."
            value={filtros.precioMax}
            onChange={(e) => setFiltros({ ...filtros, precioMax: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={aplicarFiltros} leftIcon={<FaSearch />}>
            Buscar
          </Button>
          <Button variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Barra de selección masiva */}
      {seleccionados.size > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <FaCheckSquare />
            {seleccionados.size} producto{seleccionados.size === 1 ? "" : "s"}{" "}
            seleccionado{seleccionados.size === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={seleccionarTodosResultados}
            >
              Seleccionar todos los {data?.totalElements ?? 0} resultados
            </Button>
            <Button variant="outline" size="sm" onClick={limpiarSeleccion}>
              Limpiar selección
            </Button>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando productos..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : productos.length === 0 ? (
        <EmptyState
          icon={<FaBoxOpen />}
          title="No hay productos"
          description="Prueba con otros filtros o crea un nuevo producto."
        >
          <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
            Nuevo producto
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">
                    <input
                      ref={checkSeleccionRef}
                      type="checkbox"
                      checked={todosPaginaSeleccionados}
                      onChange={toggleSeleccionTodosPagina}
                      aria-label="Seleccionar todos los productos de la página"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-900"
                    />
                  </th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="hidden px-6 py-4 md:table-cell">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="hidden px-6 py-4 md:table-cell">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {productos.map((producto) => (
                  <tr
                    key={producto.id}
                    className={`transition hover:bg-gray-50 dark:hover:bg-slate-800/40 ${
                      !producto.activo ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(producto.id)}
                        onChange={() => toggleSeleccion(producto.id)}
                        aria-label={`Seleccionar ${producto.nombre}`}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-900"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{producto.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {producto.imagenUrl ? (
                          <img
                            src={producto.imagenUrl}
                            alt={producto.nombre}
                            className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-800"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-300 dark:border-slate-700 dark:text-slate-600">
                            <FaImage />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {producto.nombre}
                          </p>
                          {producto.masVendido && (
                            <Badge variant="amber" className="mt-1">
                              Más vendido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {producto.categoria || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(producto.precio)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {producto.stock}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {producto.activo ? (
                        <Badge variant="green">Activo</Badge>
                      ) : (
                        <Badge variant="red">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(producto)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        {producto.activo ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setEliminando(producto)}
                            leftIcon={<FaTrash />}
                          >
                            Eliminar
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => restaurar(producto)}
                            leftIcon={<FaUndo />}
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 dark:border-slate-800">
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={data.size}
              onPageChange={(nuevaPagina) => {
                setPage(nuevaPagina);
                limpiarSeleccion();
              }}
              onPageSizeChange={(nuevoSize) => {
                setSize(nuevoSize);
                setPage(0);
                limpiarSeleccion();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal ajuste de precios por porcentaje */}
      <Modal
        isOpen={modalPrecioAbierto}
        onClose={() => setModalPrecioAbierto(false)}
        title="Ajustar precios por porcentaje"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModalPrecioAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              loading={guardandoPrecio}
              onClick={confirmarAjustePrecios}
              leftIcon={<FaPercent />}
            >
              Aplicar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            Se aplicará el ajuste a{" "}
            <span className="font-semibold">
              {seleccionados.size} producto{seleccionados.size === 1 ? "" : "s"}
            </span>{" "}
            seleccionado{seleccionados.size === 1 ? "" : "s"}.
          </div>

          <Input
            label="Porcentaje (%)"
            type="number"
            step="0.01"
            placeholder="Ej. 10 para subir, -5 para bajar"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
          />

          {productoEjemplo && ejemploNuevoPrecio !== null && (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Ejemplo: <span className="font-semibold">{productoEjemplo.nombre}</span>{" "}
              pasará de {formatPrice(productoEjemplo.precio)} a{" "}
              <span className="font-semibold">
                {formatPrice(ejemploNuevoPrecio)}
              </span>
              .
            </p>
          )}

          {errorPrecio && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {errorPrecio}
            </p>
          )}

          {mensajePrecio && (
            <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
              {mensajePrecio}
            </p>
          )}
        </div>
      </Modal>

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? `Editar producto #${editando.id}` : "Nuevo producto"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-producto"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear producto"}
            </Button>
          </>
        }
      >
        <form id="form-producto" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Camiseta Blanca Sublimable"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Input
            label="Descripción"
            placeholder="Descripción del producto"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />

          {/* Imagen del producto */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-slate-300">
              Imagen del producto
            </label>
            <div className="flex items-center gap-4">
              {imagenPreview ? (
                <img
                  src={imagenPreview}
                  alt="Vista previa"
                  className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-800"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300 dark:border-slate-700 dark:text-slate-600">
                  <FaImage className="h-6 w-6" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400">
                <FaUpload />
                {imagenFile ? imagenFile.name : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={manejarImagenSeleccion}
                />
              </label>
              {imagenFile && (
                <Button variant="outline" size="sm" onClick={limpiarImagen}>
                  Quitar
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              La imagen se sube automáticamente al guardar el producto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
              label="Stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Select
              label="Categoría"
              placeholder="Selecciona una categoría"
              options={opcionesCategorias}
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            />
          </div>

          <div className="grid gap-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700 sm:grid-cols-2">
            <Toggle
              label="Activo"
              description="Visible en el catálogo"
              checked={form.activo}
              onChange={(valor) => setForm({ ...form, activo: valor })}
            />
            <Toggle
              label="Más vendido"
              description="Destacar como más vendido"
              checked={form.masVendido}
              onChange={(valor) => setForm({ ...form, masVendido: valor })}
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
        title="Eliminar producto"
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
          ¿Seguro que deseas desactivar el producto{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {eliminando?.nombre}
          </span>
          ? Se ocultará del catálogo (borrado lógico). Podrás restaurarlo después.
        </p>
      </Modal>
    </div>
  );
}

export default Productos;
