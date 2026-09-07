import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaUndo,
  FaTrash,
  FaStore,
  FaPhone,
  FaBan,
  FaMoneyBillWave,
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
import { listarProductos } from "../api/productosApi";
import { listarVariantesDeProducto } from "../api/variantesApi";
import {
  listarClientesVentaDirecta,
  listarVentasDirectas,
  crearVentaDirecta,
  cambiarCobroVentaDirecta,
  cancelarVentaDirecta,
  reactivarVentaDirecta,
} from "../api/ventasDirectasApi";
import { formatPrice } from "../utils/formato";

const METODOS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta (datafono)" },
  { value: "otro", label: "Otro" },
];

const ETIQUETAS_ESTADO = {
  pendiente: { label: "Por cobrar", color: "amber" },
  cobrada: { label: "Cobrada", color: "green" },
  cancelada: { label: "Cancelada", color: "red" },
};

let contadorLocal = 0;
const nuevaLineaVacia = () => ({
  key: `l${++contadorLocal}`,
  productoId: "",
  producto: null,
  varianteId: "",
  variante: null,
  cantidad: 1,
  precio: "",
});

const FORM_VACIO = {
  clienteId: null,
  nombreCliente: "",
  telefono: "",
  metodoPago: "",
  cobrada: false,
  nota: "",
};

function VentaDirecta() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [estadoAplicado, setEstadoAplicado] = useState("");

  // Catálogo para el formulario de venta (productos + variantes).
  const [productos, setProductos] = useState([]);
  const [variantesPorProducto, setVariantesPorProducto] = useState({});
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  // Modal registrar venta.
  const [modalNueva, setModalNueva] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [lineas, setLineas] = useState([]);
  const [formError, setFormError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Autocompletado de cliente (se guarda para futuras ventas).
  const [sugerenciasCliente, setSugerenciasCliente] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Modal ver detalle.
  const [detalle, setDetalle] = useState(null);

  // Modal cancelar / reactivar.
  const [confirmar, setConfirmar] = useState(null); // { venta, accion: 'cancelar'|'reactivar' }
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, estadoF = estadoAplicado, filtro = busquedaAplicada) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarVentasDirectas({
          page: pagina,
          size: tamanio,
          estado: estadoF || undefined,
          q: filtro.trim() || undefined,
        });
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size, estadoAplicado, busquedaAplicada]
  );

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const aplicarFiltros = () => {
    setEstadoAplicado(filtroEstado);
    setBusquedaAplicada(busqueda);
    setPage(0);
  };

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setBusqueda("");
    setEstadoAplicado("");
    setBusquedaAplicada("");
    setPage(0);
  };

  // ---------- Catálogo para registrar venta ----------
  const cargarCatalogo = useCallback(async () => {
    if (cargandoCatalogo) return;
    setCargandoCatalogo(true);
    try {
      const resultado = await listarProductos({ page: 0, size: 200 });
      setProductos(resultado?.content ?? []);
    } catch {
      setProductos([]);
    } finally {
      setCargandoCatalogo(false);
    }
  }, [cargandoCatalogo]);

  const cargarVariantesDe = useCallback(
    async (productoId) => {
      try {
        const lista = await listarVariantesDeProducto(productoId);
        setVariantesPorProducto((prev) => ({ ...prev, [productoId]: lista }));
        return lista;
      } catch {
        setVariantesPorProducto((prev) => ({ ...prev, [productoId]: [] }));
        return [];
      }
    },
    []
  );

  // Busca clientes guardados por nombre/teléfono con debounce mientras se escribe.
  const buscarClientes = useCallback(async (termino) => {
    if (!termino || termino.trim().length < 2) {
      setSugerenciasCliente([]);
      return;
    }
    setBuscandoCliente(true);
    try {
      const lista = await listarClientesVentaDirecta(termino.trim());
      setSugerenciasCliente(lista || []);
    } catch {
      setSugerenciasCliente([]);
    } finally {
      setBuscandoCliente(false);
    }
  }, []);

  useEffect(() => {
    const termino = form.nombreCliente;
    if (!modalNueva || !termino || termino.trim().length < 2) {
      setSugerenciasCliente([]);
      return;
    }
    const id = setTimeout(() => buscarClientes(termino), 350);
    return () => clearTimeout(id);
  }, [modalNueva, form.nombreCliente, buscarClientes]);

  const elegirCliente = (cliente) => {
    setForm((prev) => ({
      ...prev,
      clienteId: cliente.id,
      nombreCliente: cliente.nombre,
      telefono: cliente.telefono || prev.telefono,
    }));
    setSugerenciasCliente([]);
  };

  const abrirNueva = async () => {
    setForm(FORM_VACIO);
    setLineas([nuevaLineaVacia()]);
    setFormError(null);
    setSugerenciasCliente([]);
    setModalNueva(true);
    await cargarCatalogo();
  };

  const cambiarProductoLinea = async (linea, productoIdRaw) => {
    const productoId = Number(productoIdRaw);
    const producto = productos.find((p) => p.id === productoId) || null;

    let varianteId = "";
    let variante = null;
    let precio = producto ? producto.precio ?? "" : "";
    if (producto?.tieneVariantes && productoId) {
      const variantes = variantesPorProducto[productoId];
      const disponibles =
        variantes && variantes.length > 0 ? variantes : await cargarVariantesDe(productoId);
      if (disponibles?.length === 1) {
        variante = disponibles[0];
        varianteId = String(variante.id);
        precio = variante.precio;
      }
    }

    setLineas((prev) =>
      prev.map((l) =>
        l.key === linea.key
          ? { ...l, productoId: String(productoId), producto, varianteId, variante, precio }
          : l
      )
    );
  };

  const cambiarVarianteLinea = (linea, varianteIdRaw) => {
    const variante =
      linea.producto?.tieneVariantes && varianteIdRaw
        ? (variantesPorProducto[linea.producto.id] || []).find(
            (v) => String(v.id) === String(varianteIdRaw)
          ) || null
        : null;
    setLineas((prev) =>
      prev.map((l) =>
        l.key === linea.key
          ? {
              ...l,
              varianteId: varianteIdRaw,
              variante,
              precio: variante ? variante.precio : l.precio,
            }
          : l
      )
    );
  };

  const actualizarLinea = (key, patch) =>
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const quitarLinea = (key) => setLineas((prev) => prev.filter((l) => l.key !== key));

  const totalVenta = useMemo(
    () =>
      lineas.reduce((acc, l) => {
        const precio = Number(l.precio) || 0;
        const cantidad = Number(l.cantidad) || 0;
        return acc + precio * cantidad;
      }, 0),
    [lineas]
  );

  const validarFormulario = () => {
    if (!form.nombreCliente.trim()) return "El nombre del cliente es obligatorio.";
    if (!form.metodoPago) return "Selecciona el método de pago.";
    if (lineas.length === 0) return "Agrega al menos un producto a la venta.";
    for (const l of lineas) {
      if (!l.productoId) return "Cada línea debe tener un producto.";
      if (l.producto?.tieneVariantes && !l.varianteId) {
        return `Elige la talla/color de: ${l.producto.nombre}.`;
      }
      if (!Number(l.cantidad) || Number(l.cantidad) < 1) {
        return "La cantidad debe ser mayor a 0.";
      }
      if (l.precio === "" || Number(l.precio) < 0) {
        return "Revisa el precio de cada producto.";
      }
    }
    return null;
  };

  const handleGuardarVenta = async (e) => {
    e.preventDefault();
    const problema = validarFormulario();
    if (problema) {
      setFormError(problema);
      return;
    }

    const payload = {
      clienteId: form.clienteId || null,
      nombreCliente: form.nombreCliente.trim(),
      telefono: form.telefono.trim() || null,
      metodoPago: form.metodoPago,
      estado: form.cobrada ? "cobrada" : "pendiente",
      nota: form.nota.trim() || null,
      items: lineas.map((l) => ({
        productoId: Number(l.productoId),
        varianteId: l.varianteId ? Number(l.varianteId) : null,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precio),
      })),
    };

    setGuardando(true);
    setFormError(null);
    try {
      await crearVentaDirecta(payload);
      setModalNueva(false);
      cargar();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Acciones sobre ventas ----------
  const ejecutarCobro = async (venta, cobrado) => {
    setLoading(true);
    try {
      await cambiarCobroVentaDirecta(venta.id, cobrado);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmar) return;
    setConfirmando(true);
    try {
      if (confirmar.accion === "cancelar") {
        await cancelarVentaDirecta(confirmar.venta.id);
      } else {
        await reactivarVentaDirecta(confirmar.venta.id);
      }
      setConfirmar(null);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmando(false);
    }
  };

  const ventas = data?.content ?? [];
  const opcionesProductos = productos
    .filter((p) => p.activo !== false)
    .map((p) => ({
      value: String(p.id),
      label: `${p.nombre} — stock ${p.stockEfectivo ?? p.stock ?? 0}${p.tieneVariantes ? " (variantes)" : ""}`,
    }));

  const stockProductoDe = (p) => (p ? (p.stockEfectivo ?? p.stock ?? 0) : null);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventas directas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Registra ventas hechas fuera de la tienda (mostrador, WhatsApp). Al guardar se descuenta
            inventario; al cancelar, se devuelve.
          </p>
        </div>
        <Button onClick={abrirNueva} leftIcon={<FaPlus />}>
          Nueva venta directa
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-[1fr_220px_auto]">
        <Input
          placeholder="Buscar por cliente o teléfono..."
          icon={<FaSearch />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
        <Select
          label="Estado"
          placeholder="Todos"
          options={[
            { value: "pendiente", label: "Por cobrar" },
            { value: "cobrada", label: "Cobrada" },
            { value: "cancelada", label: "Cancelada" },
          ]}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        />
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={aplicarFiltros} leftIcon={<FaSearch />}>
            Buscar
          </Button>
          <Button variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando ventas..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : ventas.length === 0 ? (
        <EmptyState
          icon={<FaStore />}
          title="No hay ventas directas"
          description="Registra tu primera venta de mostrador o externa para mantener el inventario al día."
        >
          <Button onClick={abrirNueva} leftIcon={<FaPlus />}>
            Nueva venta directa
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="hidden px-6 py-4 md:table-cell">Método</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="hidden px-6 py-4 md:table-cell">Fecha</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {ventas.map((venta) => {
                  const etiqueta = ETIQUETAS_ESTADO[venta.estado] || ETIQUETAS_ESTADO.pendiente;
                  return (
                    <tr
                      key={venta.id}
                      className={`transition hover:bg-gray-50 dark:hover:bg-slate-800/40 ${
                        venta.estado === "cancelada" ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">#{venta.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {venta.nombreCliente}
                        </p>
                        {venta.telefono && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                            <FaPhone className="text-[10px]" /> {venta.telefono}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 text-gray-600 dark:text-slate-300 md:table-cell">
                        {venta.metodoPago || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={etiqueta.color}>{etiqueta.label}</Badge>
                      </td>
                      <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                        {venta.creadoEn
                          ? new Date(venta.creadoEn).toLocaleDateString("es-CO")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {formatPrice(venta.total)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetalle(venta)}
                            leftIcon={<FaEye />}
                          >
                            Ver
                          </Button>
                          {venta.estado === "pendiente" && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => ejecutarCobro(venta, true)}
                              leftIcon={<FaMoneyBillWave />}
                            >
                              Cobrar
                            </Button>
                          )}
                          {venta.estado === "cobrada" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => ejecutarCobro(venta, false)}
                              leftIcon={<FaUndo />}
                            >
                              Por cobrar
                            </Button>
                          )}
                          {venta.estado === "cancelada" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmar({ venta, accion: "reactivar" })}
                              leftIcon={<FaCheckCircle />}
                            >
                              Reactivar
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmar({ venta, accion: "cancelar" })}
                              leftIcon={<FaBan />}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 dark:border-slate-800">
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={data.size}
              onPageChange={setPage}
              onPageSizeChange={(nuevoSize) => {
                setSize(nuevoSize);
                setPage(0);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal registrar venta */}
      <Modal
        isOpen={modalNueva}
        onClose={() => setModalNueva(false)}
        title="Registrar venta directa"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalNueva(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-venta-directa"
              loading={guardando}
              leftIcon={<FaStore />}
            >
              Guardar venta (descuenta stock)
            </Button>
          </>
        }
      >
        <form id="form-venta-directa" onSubmit={handleGuardarVenta} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                label="Cliente *"
                placeholder="Escribe el nombre (busca clientes guardados)"
                value={form.nombreCliente}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nombreCliente: e.target.value,
                    clienteId: null,
                  }))
                }
              />
              {sugerenciasCliente.length > 0 && (
                <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {sugerenciasCliente.map((cliente) => (
                    <li key={cliente.id}>
                      <button
                        type="button"
                        onClick={() => elegirCliente(cliente)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span className="truncate font-medium">{cliente.nombre}</span>
                        {cliente.telefono && (
                          <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">
                            {cliente.telefono}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {buscandoCliente && (
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                  Buscando clientes...
                </p>
              )}
              {form.clienteId && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Cliente guardado seleccionado (se actualiza su teléfono si cambia).
                </p>
              )}
            </div>
            <Input
              label="Teléfono (opcional)"
              placeholder="300 123 4567"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Select
              label="Método de pago *"
              placeholder="Selecciona..."
              options={METODOS}
              value={form.metodoPago}
              onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
            />
            <div className="flex items-end">
              <Toggle
                label="¿Ya cobrado?"
                description="Desmárcalo si queda por cobrar"
                checked={form.cobrada}
                onChange={(valor) => setForm({ ...form, cobrada: valor })}
              />
            </div>
          </div>

          {/* Líneas de productos */}
          <div className="rounded-2xl border border-gray-200 p-4 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Productos de la venta
              </p>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setLineas((prev) => [...prev, nuevaLineaVacia()])}
                leftIcon={<FaPlus />}
              >
                Añadir producto
              </Button>
            </div>

            <div className="space-y-4">
              {lineas.map((linea, idx) => {
                const producto = linea.producto;
                const variantes = producto?.tieneVariantes
                  ? variantesPorProducto[producto.id] || []
                  : [];
                return (
                  <div
                    key={linea.key}
                    className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Producto {idx + 1}
                      </p>
                      {lineas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => quitarLinea(linea.key)}
                          className="text-xs font-medium text-red-500 hover:text-red-600"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Producto"
                        placeholder="Selecciona un producto"
                        options={opcionesProductos}
                        value={linea.productoId}
                        onChange={(e) => cambiarProductoLinea(linea, e.target.value)}
                      />

                      {producto?.tieneVariantes ? (
                        <Select
                          label="Talla / color"
                          placeholder="Selecciona..."
                          options={variantes.map((v) => ({
                            value: String(v.id),
                            label: `${v.talla} / ${v.color} — ${formatPrice(v.precio)} (${
                              v.stock ?? 0
                            } und)`,
                          }))}
                          value={linea.varianteId}
                          onChange={(e) => cambiarVarianteLinea(linea, e.target.value)}
                        />
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>

                    {producto?.tieneVariantes && !linea.varianteId && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Este producto se vende por talla/color: elige la variante para validar stock.
                      </p>
                    )}

                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <Input
                        label="Cantidad"
                        type="number"
                        min="1"
                        step="1"
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(linea.key, { cantidad: e.target.value })}
                      />
                      <Input
                        label="Precio unitario (COP)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.precio}
                        onChange={(e) => actualizarLinea(linea.key, { precio: e.target.value })}
                      />
                      <div className="flex flex-col justify-end pb-2">
                        <p className="text-sm">
                          <span className="text-gray-500 dark:text-slate-400">Subtotal: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(
                              (Number(linea.precio) || 0) * (Number(linea.cantidad) || 0)
                            )}
                          </span>
                        </p>
                        {producto && (
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">
                            Stock disponible:{" "}
                            {linea.variante ? linea.variante.stock : stockProductoDe(producto)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-slate-400">Total venta:</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(totalVenta)}
              </span>
            </div>
          </div>

          <Input
            label="Nota (opcional)"
            placeholder="Detalle de la venta, descuento, etc."
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
          />

          {formError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Modal detalle */}
      <Modal
        isOpen={!!detalle}
        onClose={() => setDetalle(null)}
        title={`Venta directa #${detalle?.id ?? ""}`}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setDetalle(null)}>
            Cerrar
          </Button>
        }
      >
        {detalle && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Cliente
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {detalle.nombreCliente}
                </p>
                {detalle.telefono && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">{detalle.telefono}</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Estado y pago
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={(ETIQUETAS_ESTADO[detalle.estado] || {}).color}>
                    {(ETIQUETAS_ESTADO[detalle.estado] || ETIQUETAS_ESTADO.pendiente).label}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-slate-300">
                    {detalle.metodoPago}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
                Productos
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Cant.</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {detalle.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {item.productoNombre || item.detalle}
                          {item.talla && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-slate-400">
                              ({item.talla} / {item.color})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                          {formatPrice(item.precioUnitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                          {formatPrice(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {detalle.nota ? `Nota: ${detalle.nota}` : "Sin nota"}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(detalle.total)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmar cancelar / reactivar */}
      <Modal
        isOpen={!!confirmar}
        onClose={() => setConfirmar(null)}
        title={confirmar?.accion === "cancelar" ? "Cancelar venta directa" : "Reactivar venta directa"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmar(null)}>
              No
            </Button>
            <Button
              variant={confirmar?.accion === "cancelar" ? "danger" : "success"}
              loading={confirmando}
              onClick={ejecutarConfirmacion}
              leftIcon={confirmar?.accion === "cancelar" ? <FaTrash /> : <FaUndo />}
            >
              {confirmar?.accion === "cancelar" ? "Sí, cancelar" : "Sí, reactivar"}
            </Button>
          </>
        }
      >
        {confirmar?.accion === "cancelar" ? (
          <p>
            Se cancelará la venta de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {confirmar.venta.nombreCliente}
            </span>{" "}
            por <span className="font-semibold">{formatPrice(confirmar.venta.total)}</span> y se
            devolverá el stock al inventario.
          </p>
        ) : (
          <p>
            Se reactivará la venta de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {confirmar?.venta?.nombreCliente}
            </span>{" "}
            volviendo a reservar el stock (si hay disponibilidad).
          </p>
        )}
      </Modal>
    </div>
  );
}

export default VentaDirecta;
