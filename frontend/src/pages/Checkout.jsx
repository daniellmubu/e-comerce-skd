import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

import { useCart } from "../context/CartContext";
import { obtenerUsuarioActual, obtenerUsuarioId } from "../services/authService";
import {
  listarDireccionesPorUsuario,
  crearDireccion,
} from "../services/direccionService";
import { listarEmpaques } from "../services/empaqueService";
import { listarCupones } from "../services/cuponService";
import { procesarCheckout } from "../services/checkoutService";
import { getErrorMessage } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

// yyyy-mm-dd de hoy, en zona horaria local (no UTC), para usar como
// mínimo del input type="date" y evitar que se pueda elegir un día pasado.
function obtenerFechaMinimaHoy() {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
}

const METODOS_PAGO = [
  { value: "tarjeta", label: "Tarjeta de crédito/débito" },
  { value: "efectivo", label: "Contraentrega" },
];

function Checkout() {
  const navigate = useNavigate();
  const { items, total, cantidadProductos, recargarCarrito } = useCart();
  const usuario = obtenerUsuarioActual();

  const [direcciones, setDirecciones] = useState([]);
  const [empaques, setEmpaques] = useState([]);
  const [cupones, setCupones] = useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [direccionId, setDireccionId] = useState("");
  const [empaqueId, setEmpaqueId] = useState("");
  const [cuponId, setCuponId] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].value);
  const [fechaEntregaDeseada, setFechaEntregaDeseada] = useState("");
  const fechaMinima = obtenerFechaMinimaHoy();

  const [nuevaDireccion, setNuevaDireccion] = useState({
    calle: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
  });
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);

  const [procesando, setProcesando] = useState(false);
  const [errorCheckout, setErrorCheckout] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    cargarDatosIniciales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatosIniciales() {
    setCargandoDatos(true);
    try {
      const usuarioId = obtenerUsuarioId();
      const [dirs, emps, cups] = await Promise.all([
        listarDireccionesPorUsuario(usuarioId),
        listarEmpaques(),
        listarCupones().catch(() => []),
      ]);

      setDirecciones(dirs);
      setEmpaques(emps);
      setCupones(cups.filter((c) => c.activo));

      const predeterminada = dirs.find((d) => d.predeterminada) || dirs[0];
      if (predeterminada) setDireccionId(String(predeterminada.id));
      if (emps[0]) setEmpaqueId(String(emps[0].id));
      if (dirs.length === 0) setMostrarFormDireccion(true);

      setErrorCarga(null);
    } catch (err) {
      setErrorCarga(getErrorMessage(err));
    } finally {
      setCargandoDatos(false);
    }
  }

  const handleGuardarDireccion = async () => {
    const { calle, ciudad, departamento, codigoPostal } = nuevaDireccion;
    if (!calle || !ciudad || !departamento) return;

    try {
      const usuarioId = obtenerUsuarioId();
      const creada = await crearDireccion({
        usuarioId,
        calle,
        ciudad,
        departamento,
        codigoPostal,
        predeterminada: direcciones.length === 0,
      });
      setDirecciones((prev) => [...prev, creada]);
      setDireccionId(String(creada.id));
      setMostrarFormDireccion(false);
      setNuevaDireccion({ calle: "", ciudad: "", departamento: "", codigoPostal: "" });
    } catch (err) {
      setErrorCarga(getErrorMessage(err));
    }
  };

  const empaqueSeleccionado = empaques.find((e) => String(e.id) === empaqueId);
  const costoEnvioEstimado = 12000;
  const totalEstimado =
    total + (empaqueSeleccionado ? Number(empaqueSeleccionado.costoAdicional) : 0) + costoEnvioEstimado;

  const handleConfirmar = async () => {
    if (!direccionId || !empaqueId) {
      setErrorCheckout("Selecciona una dirección y un tipo de empaque.");
      return;
    }

    if (fechaEntregaDeseada && fechaEntregaDeseada < fechaMinima) {
      setErrorCheckout("La fecha de entrega deseada no puede ser anterior a hoy.");
      return;
    }

    setProcesando(true);
    setErrorCheckout(null);
    try {
      const usuarioId = obtenerUsuarioId();
      const respuesta = await procesarCheckout({
        usuarioId,
        direccionId: Number(direccionId),
        empaqueId: Number(empaqueId),
        cuponId: cuponId ? Number(cuponId) : null,
        fechaEntregaDeseada: fechaEntregaDeseada || null,
        metodoPago,
      });
      setResultado(respuesta);
      await recargarCarrito();
    } catch (err) {
      setErrorCheckout(getErrorMessage(err));
    } finally {
      setProcesando(false);
    }
  };

  if (resultado) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
          <FaCheckCircle className="mx-auto mb-6 text-5xl text-emerald-400" />
          <h1 className="text-3xl font-bold">¡Pedido confirmado!</h1>
          <p className="mt-2 text-slate-400">{resultado.mensaje}</p>

          <div className="mt-8 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-left text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Factura</span>
              <span className="font-semibold text-white">{resultado.numeroFactura}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(resultado.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuento</span>
              <span>-{formatPrice(resultado.descuento)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{formatPrice(resultado.costoEnvio)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-white">
              <span>Total</span>
              <span>{formatPrice(resultado.total)}</span>
            </div>
          </div>

          <Button fullWidth className="mt-8" onClick={() => navigate("/mis-pedidos")}>
            Ver mis pedidos
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            Checkout
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Confirma tu pedido
          </h1>
        </div>

        {cargandoDatos && (
          <div className="flex justify-center py-20">
            <Loading label="Cargando información..." />
          </div>
        )}

        {!cargandoDatos && cantidadProductos === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Tu carrito está vacío. Agrega productos antes de continuar.
            <div className="mt-6">
              <Button onClick={() => navigate("/catalogo")}>Ir al catálogo</Button>
            </div>
          </div>
        )}

        {!cargandoDatos && cantidadProductos > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {errorCarga && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {errorCarga}
                </p>
              )}

              {/* Dirección */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="mb-4 text-lg font-semibold">Dirección de envío</h2>

                {direcciones.length > 0 && (
                  <div className="space-y-3">
                    {direcciones.map((dir) => (
                      <label
                        key={dir.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          String(dir.id) === direccionId
                            ? "border-cyan-400 bg-cyan-400/5"
                            : "border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="direccion"
                          className="mt-1"
                          checked={String(dir.id) === direccionId}
                          onChange={() => setDireccionId(String(dir.id))}
                        />
                        <span className="text-sm text-slate-300">
                          {dir.calle}, {dir.ciudad}, {dir.departamento}
                          {dir.codigoPostal ? ` (${dir.codigoPostal})` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {!mostrarFormDireccion && (
                  <button
                    type="button"
                    onClick={() => setMostrarFormDireccion(true)}
                    className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    + Agregar nueva dirección
                  </button>
                )}

                {mostrarFormDireccion && (
                  <div className="mt-4 space-y-3 rounded-xl border border-slate-700 p-4">
                    <Input
                      label="Calle"
                      value={nuevaDireccion.calle}
                      onChange={(e) =>
                        setNuevaDireccion((p) => ({ ...p, calle: e.target.value }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Ciudad"
                        value={nuevaDireccion.ciudad}
                        onChange={(e) =>
                          setNuevaDireccion((p) => ({ ...p, ciudad: e.target.value }))
                        }
                      />
                      <Input
                        label="Departamento"
                        value={nuevaDireccion.departamento}
                        onChange={(e) =>
                          setNuevaDireccion((p) => ({ ...p, departamento: e.target.value }))
                        }
                      />
                    </div>
                    <Input
                      label="Código postal (opcional)"
                      value={nuevaDireccion.codigoPostal}
                      onChange={(e) =>
                        setNuevaDireccion((p) => ({ ...p, codigoPostal: e.target.value }))
                      }
                    />
                    <Button size="sm" onClick={handleGuardarDireccion}>
                      Guardar dirección
                    </Button>
                  </div>
                )}
              </div>

              {/* Empaque */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="mb-4 text-lg font-semibold">Tipo de empaque</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {empaques.map((emp) => (
                    <label
                      key={emp.id}
                      className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                        String(emp.id) === empaqueId
                          ? "border-cyan-400 bg-cyan-400/5"
                          : "border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="empaque"
                        className="sr-only"
                        checked={String(emp.id) === empaqueId}
                        onChange={() => setEmpaqueId(String(emp.id))}
                      />
                      <p className="font-semibold text-white">{emp.tipo}</p>
                      <p className="mt-1 text-slate-400">{emp.descripcion}</p>
                      <p className="mt-2 text-cyan-300">
                        {Number(emp.costoAdicional) > 0
                          ? `+${formatPrice(emp.costoAdicional)}`
                          : "Gratis"}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cupón y método de pago */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="mb-4 text-lg font-semibold">Cupón y pago</h2>

                {cupones.length > 0 && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-slate-400">
                      Cupón de descuento (opcional)
                    </label>
                    <select
                      value={cuponId}
                      onChange={(e) => setCuponId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="">Sin cupón</option>
                      {cupones.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} (-{Number(c.descuentoPorcentaje)}%)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-2 block text-sm text-slate-400">
                    Método de pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  type="date"
                  label="Fecha de entrega deseada (opcional)"
                  value={fechaEntregaDeseada}
                  min={fechaMinima}
                  onChange={(e) => setFechaEntregaDeseada(e.target.value)}
                />
              </div>
            </div>

            {/* Resumen */}
            <div>
              <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="mb-4 text-lg font-semibold">Resumen</h2>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal ({cantidadProductos} productos)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empaque</span>
                    <span>
                      {empaqueSeleccionado
                        ? formatPrice(empaqueSeleccionado.costoAdicional)
                        : formatPrice(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío estimado</span>
                    <span>{formatPrice(costoEnvioEstimado)}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between border-t border-slate-800 pt-4 text-lg font-bold text-white">
                  <span>Total estimado</span>
                  <span>{formatPrice(totalEstimado)}</span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  El descuento del cupón y el costo final se calculan al confirmar.
                </p>

                {errorCheckout && (
                  <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {errorCheckout}
                  </p>
                )}

                <Button
                  fullWidth
                  className="mt-6"
                  loading={procesando}
                  onClick={handleConfirmar}
                >
                  Confirmar pedido
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Checkout;