import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaBoxOpen, FaBox, FaGift, FaCheck } from "react-icons/fa";

import { useCart } from "../context/CartContext";
import { obtenerUsuarioActual, obtenerUsuarioId } from "../services/authService";
import {
  listarDireccionesPorUsuario,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
} from "../services/direccionService";
import { listarEmpaques } from "../services/empaqueService";
import { listarCupones, listarMisCupones } from "../services/cuponService";
import { procesarCheckout } from "../services/checkoutService";
import { iniciarPagoWompi, simularPagoTarjeta } from "../services/pagoService";
import { calcularEnvio } from "../services/envioService";
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
  { value: "pse", label: "PSE" },
  { value: "nequi", label: "Nequi" },
  { value: "efectivo", label: "Contraentrega" },
];

// Número de Nequi del negocio para pagos por transferencia (sin Wompi).
const NEQUI_NUMERO = import.meta.env.VITE_NEQUI_NUMBER || "3223458419";

const EMPAQUE_META = {
  Estandar: { icon: FaBoxOpen, bubble: "from-slate-400 to-slate-600", tag: "Incluido" },
  Premium: { icon: FaBox, bubble: "from-indigo-500 to-violet-600", tag: "Recomendado" },
  Regalo: { icon: FaGift, bubble: "from-pink-500 to-rose-600", tag: "Especial" },
};
const EMPAQUE_DEFAULT = { icon: FaBox, bubble: "from-slate-500 to-slate-700", tag: "" };

const OCASIONES_REGALO = [
  "Cumpleaños",
  "Aniversario",
  "Navidad",
  "Día de la madre",
  "Día del padre",
  "San Valentín",
  "Otro",
];

function Checkout() {
  const navigate = useNavigate();
  const { items, total, cantidadProductos, recargarCarrito } = useCart();
  const usuario = obtenerUsuarioActual();

  const [direcciones, setDirecciones] = useState([]);
  const [empaques, setEmpaques] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cuponesDisponibles, setCuponesDisponibles] = useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [direccionId, setDireccionId] = useState("");
  const [empaqueId, setEmpaqueId] = useState("");
  const [cuponId, setCuponId] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState(null);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].value);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [errorTarjeta, setErrorTarjeta] = useState(null);
  const [destinatarioRegalo, setDestinatarioRegalo] = useState("");
  const [ocasionRegalo, setOcasionRegalo] = useState("");
  const [fechaEntregaDeseada, setFechaEntregaDeseada] = useState("");
  const fechaMinima = obtenerFechaMinimaHoy();

  const [envioInfo, setEnvioInfo] = useState(null);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  const [nuevaDireccion, setNuevaDireccion] = useState({
    calle: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
  });
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

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

  useEffect(() => {
    if (!direccionId) {
      setEnvioInfo(null);
      return;
    }

    let activo = true;
    setCargandoEnvio(true);
    calcularEnvio(Number(direccionId))
      .then((info) => {
        if (activo) setEnvioInfo(info);
      })
      .catch(() => {
        if (activo) setEnvioInfo(null);
      })
      .finally(() => {
        if (activo) setCargandoEnvio(false);
      });

    return () => {
      activo = false;
    };
  }, [direccionId]);

  async function cargarDatosIniciales() {
    setCargandoDatos(true);
    try {
      const usuarioId = obtenerUsuarioId();
      const [dirs, emps, mios, globales] = await Promise.all([
        listarDireccionesPorUsuario(usuarioId),
        listarEmpaques(),
        listarMisCupones().catch(() => []),
        listarCupones().catch(() => []),
      ]);

      setDirecciones(dirs);
      setEmpaques(emps);

      const hoy = new Date().toISOString().split("T")[0];

      // Cupones propios: asignados, sin usar y vigentes. Se muestran como
      // tarjetas clicables y se pueden resolver por código.
      const propios = mios.filter((c) => !c.usado && c.fechaFin >= hoy);

      // Cupones globales no exclusivos: activos, vigentes y con usos
      // disponibles. Permiten escribir un código público (ej: SKD20).
      const globalesUsables = globales.filter(
        (c) =>
          c.activo &&
          c.fechaFin >= hoy &&
          c.esUnicoPorUsuario !== true &&
          (c.usosMaximos == null || c.usosActuales < c.usosMaximos),
      );

      setCupones(propios);

      // Mapa codigo -> cupón, deduplicado por cuponId (un cupón asignado
      // también aparece en el catálogo global).
      const porCodigo = new Map();
      propios.forEach((c) =>
        porCodigo.set(c.codigo, {
          cuponId: c.cuponId,
          codigo: c.codigo,
          descuentoPorcentaje: c.descuentoPorcentaje,
        }),
      );
      globalesUsables.forEach((c) =>
        porCodigo.set(c.codigo, {
          cuponId: c.id,
          codigo: c.codigo,
          descuentoPorcentaje: c.descuentoPorcentaje,
        }),
      );
      setCuponesDisponibles([...porCodigo.values()]);

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
      if (editandoId) {
        const actualizada = await actualizarDireccion(editandoId, { usuarioId, calle, ciudad, departamento, codigoPostal });
        setDirecciones((prev) => prev.map((d) => d.id === editandoId ? actualizada : d));
        setEditandoId(null);
      } else {
        const creada = await crearDireccion({ usuarioId, calle, ciudad, departamento, codigoPostal, predeterminada: direcciones.length === 0 });
        setDirecciones((prev) => [...prev, creada]);
        setDireccionId(String(creada.id));
      }
      setMostrarFormDireccion(false);
      setNuevaDireccion({ calle: "", ciudad: "", departamento: "", codigoPostal: "" });
    } catch (err) { setErrorCarga(getErrorMessage(err)); }
  };

  const handleEditarDireccion = (dir) => {
    setNuevaDireccion({ calle: dir.calle, ciudad: dir.ciudad, departamento: dir.departamento, codigoPostal: dir.codigoPostal || "" });
    setEditandoId(dir.id);
    setMostrarFormDireccion(true);
  };
  const handleEliminarDireccion = async (id) => {
    try { await eliminarDireccion(id); setDirecciones((prev) => prev.filter((d) => d.id !== id)); if (String(id) === direccionId) setDireccionId(""); } catch (err) { setErrorCarga(getErrorMessage(err)); }
  };

  const empaqueSeleccionado = empaques.find((e) => String(e.id) === empaqueId);
  const costoEnvioEstimado = envioInfo ? Number(envioInfo.costoEnvio) : null;
  const descuentoEstimado = cuponAplicado
    ? (total * Number(cuponAplicado.descuentoPorcentaje)) / 100
    : 0;
  const totalEstimado =
    total +
    (empaqueSeleccionado ? Number(empaqueSeleccionado.costoAdicional) : 0) +
    (costoEnvioEstimado ?? 0) -
    descuentoEstimado;

  const aplicarCupon = () => {
    const codigo = codigoCupon.trim().toUpperCase();

    if (!codigo) {
      setErrorCupon("Escribe un código de cupón.");
      return;
    }

    const encontrado = cuponesDisponibles.find((c) => c.codigo === codigo);

    if (!encontrado) {
      setErrorCupon("Cupón no válido o no disponible para tu cuenta.");
      setCuponId("");
      setCuponAplicado(null);
      return;
    }

    setCuponId(encontrado.cuponId);
    setCuponAplicado(encontrado);
    setErrorCupon(null);
  };

  const seleccionarCupon = (c) => {
    setCodigoCupon(c.codigo);
    setCuponId(c.cuponId);
    setCuponAplicado(c);
    setErrorCupon(null);
  };

  const quitarCupon = () => {
    setCodigoCupon("");
    setCuponId("");
    setCuponAplicado(null);
    setErrorCupon(null);
  };

  const handleConfirmar = async () => {
    if (!direccionId || !empaqueId) {
      setErrorCheckout("Selecciona una dirección y un tipo de empaque.");
      return;
    }

    if (fechaEntregaDeseada && fechaEntregaDeseada < fechaMinima) {
      setErrorCheckout("La fecha de entrega deseada no puede ser anterior a hoy.");
      return;
    }

    const esEmpaqueRegalo =
      empaqueSeleccionado?.tipo?.toLowerCase() === "regalo";

    setProcesando(true);
    setErrorCheckout(null);
    try {
      if (esEmpaqueRegalo && !destinatarioRegalo.trim()) {
        setErrorCheckout("Si eliges empaque de regalo, indica para quién es.");
        return;
      }

      if (metodoPago === "tarjeta") {
        if (!/^\d{13,19}$/.test(numeroTarjeta)) {
          setErrorTarjeta("Número de tarjeta inválido (13 a 19 dígitos).");
          return;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaExpiracion)) {
          setErrorTarjeta("La fecha de expiración debe tener el formato MM/AA.");
          return;
        }
        if (!/^\d{3}$/.test(cvv)) {
          setErrorTarjeta("El CVV debe tener 3 dígitos.");
          return;
        }
      }

      const respuesta = await procesarCheckout({
        direccionId: Number(direccionId),
        empaqueId: Number(empaqueId),
        cuponId: cuponId ? Number(cuponId) : null,
        fechaEntregaDeseada: fechaEntregaDeseada || null,
        metodoPago,
        destinatarioRegalo: esEmpaqueRegalo ? destinatarioRegalo.trim() : undefined,
        ocasionRegalo: esEmpaqueRegalo ? ocasionRegalo.trim() : undefined,
      });

      if (metodoPago === "pse") {
        const wompi = await iniciarPagoWompi(respuesta.pagoId);
        window.location.href = wompi.url;
        return;
      }

      if (metodoPago === "tarjeta") {
        const simulacion = await simularPagoTarjeta(respuesta.pagoId, {
          numeroTarjeta,
          fechaExpiracion,
          cvv,
        });
        if (!simulacion.aprobado) {
          setErrorCheckout(simulacion.mensaje || "El pago fue rechazado.");
          return;
        }
      }

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
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900/80">
          <FaCheckCircle className="mx-auto mb-6 text-5xl text-emerald-400" />
          <h1 className="text-3xl font-bold">
            {metodoPago === "nequi" || metodoPago === "efectivo"
              ? "¡Pedido recibido!"
              : "¡Pedido confirmado!"}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-slate-400">
            {metodoPago === "nequi" || metodoPago === "efectivo"
              ? "Tu pedido está pendiente de pago. Te confirmaremos cuando recibamos el pago."
              : resultado.mensaje}
          </p>

          <div className="mt-8 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Factura</span>
              <span className="font-semibold text-gray-900 dark:text-white">{resultado.numeroFactura}</span>
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
            {resultado.diasEstimadosEntrega && (
              <div className="flex justify-between text-gray-400 dark:text-slate-500">
                <span>Entrega estimada</span>
                <span>{resultado.diasEstimadosEntrega} días hábiles</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-slate-800 dark:text-white">
              <span>Total</span>
              <span>{formatPrice(resultado.total)}</span>
            </div>
          </div>

          {metodoPago === "nequi" && (
            <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-left dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Pago con Nequi
              </p>
              <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                Transfiere{" "}
                <strong>{formatPrice(resultado.total)}</strong> al Nequi{" "}
                <strong>{NEQUI_NUMERO}</strong> y confirma el pago en tu app.
                Tu pedido se procesa cuando confirmemos la transferencia.
              </p>
            </div>
          )}

          <Button fullWidth className="mt-8" onClick={() => navigate("/mis-pedidos")}>
            Ver mis pedidos
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
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
                <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {errorCarga}
                </p>
              )}

              {/* Dirección */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Dirección de envío</h2>

                {direcciones.length > 0 && (
                  <div className="space-y-3">
                    {direcciones.map((dir) => (
                      <div key={dir.id} className={`flex items-start gap-2 rounded-xl border p-3 ${String(dir.id) === direccionId ? "border-indigo-400 bg-indigo-50 dark:border-cyan-400 dark:bg-cyan-400/5" : "border-gray-200 dark:border-slate-700"}`}>
                        <label className="flex flex-1 cursor-pointer items-start gap-3">
                          <input type="radio" name="direccion" className="mt-1" checked={String(dir.id) === direccionId} onChange={() => setDireccionId(String(dir.id))} />
                          <span className="text-sm text-gray-600 dark:text-slate-300">{dir.calle}, {dir.ciudad}, {dir.departamento}{dir.codigoPostal ? ` (${dir.codigoPostal})` : ""}</span>
                        </label>
                        <button onClick={()=>handleEditarDireccion(dir)} className="text-xs text-indigo-600 dark:text-cyan-400">Editar</button>
                        <button onClick={()=>handleEliminarDireccion(dir.id)} className="text-xs text-red-500">Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}

                {!mostrarFormDireccion && (
                  <button
                    type="button"
                    onClick={() => setMostrarFormDireccion(true)}
                    className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    + Agregar nueva dirección
                  </button>
                )}

                {mostrarFormDireccion && (
                  <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
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
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleGuardarDireccion}>{editandoId ? "Actualizar" : "Guardar"} dirección</Button>
                      <button onClick={()=>{ setMostrarFormDireccion(false); setEditandoId(null); setNuevaDireccion({ calle: "", ciudad: "", departamento: "", codigoPostal: "" }); }} className="text-sm text-gray-500">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Empaque */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Tipo de empaque</h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
                  Elige cómo quieres recibir tu pedido.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {empaques.map((emp) => {
                    const meta = EMPAQUE_META[emp.tipo] || EMPAQUE_DEFAULT;
                    const Icono = meta.icon;
                    const seleccionado = String(emp.id) === empaqueId;
                    return (
                      <label
                        key={emp.id}
                        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                          seleccionado
                            ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-400/30 dark:border-cyan-400 dark:bg-cyan-400/10 dark:ring-cyan-400/20"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="empaque"
                          className="sr-only"
                          checked={seleccionado}
                          onChange={() => setEmpaqueId(String(emp.id))}
                        />
                        {seleccionado && (
                          <FaCheckCircle className="absolute right-3 top-3 text-lg text-indigo-500 dark:text-cyan-300" />
                        )}
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${meta.bubble} text-lg text-white shadow`}
                        >
                          <Icono />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{emp.tipo}</p>
                          {meta.tag && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                              {meta.tag}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                          {emp.descripcion}
                        </p>
                        <p
                          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            Number(emp.costoAdicional) > 0
                              ? "bg-indigo-100 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          }`}
                        >
                          {Number(emp.costoAdicional) > 0 ? (
                            <>
                              <FaCheck /> {formatPrice(emp.costoAdicional)}
                            </>
                          ) : (
                            "Gratis"
                          )}
                        </p>
                      </label>
                    );
                  })}
                </div>

                {empaqueSeleccionado?.tipo?.toLowerCase() === "regalo" && (
                  <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-500/5">
                    <div className="flex items-center gap-2">
                      <FaGift className="text-rose-500" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Detalles del regalo
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Lo incluiremos en la tarjeta del regalo.
                    </p>
                    <div className="mt-4 space-y-4">
                      <Input
                        label="¿Para quién es? (nombre del destinatario)"
                        placeholder="Ej: Para Mamá"
                        value={destinatarioRegalo}
                        onChange={(e) => setDestinatarioRegalo(e.target.value)}
                        maxLength={60}
                      />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-slate-300">
                          ¿Qué celebramos?
                        </label>
                        <select
                          value={ocasionRegalo}
                          onChange={(e) => setOcasionRegalo(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-rose-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-rose-400"
                        >
                          <option value="">Selecciona una ocasión...</option>
                          {OCASIONES_REGALO.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cupón y método de pago */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cupón y pago</h2>

                <div className="mb-4">
                  <label className="mb-2 block text-sm text-gray-500 dark:text-slate-400">
                    Cupón de descuento (opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={codigoCupon}
                      onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                      placeholder="Escribe el código (ej: SKD20)"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
                    />
                    {cuponAplicado ? (
                      <Button size="sm" onClick={quitarCupon}>
                        Quitar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={aplicarCupon}>
                        Aplicar
                      </Button>
                    )}
                  </div>

                  {errorCupon && (
                    <p className="mt-2 text-sm text-red-500">{errorCupon}</p>
                  )}

                  {cuponAplicado && (
                    <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                      Cupón {cuponAplicado.codigo} aplicado: -
                      {Number(cuponAplicado.descuentoPorcentaje)}%
                    </p>
                  )}
                </div>

                {cupones.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-gray-500 dark:text-slate-400">
                      Tus cupones disponibles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cupones.map((c) => {
                        const activo =
                          cuponAplicado?.cuponId === c.cuponId;
                        return (
                          <button
                            key={c.cuponId}
                            type="button"
                            onClick={() =>
                              seleccionarCupon({
                                cuponId: c.cuponId,
                                codigo: c.codigo,
                                descuentoPorcentaje: c.descuentoPorcentaje,
                              })
                            }
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                              activo
                                ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300"
                                : "border-dashed border-gray-300 text-gray-600 hover:border-indigo-300 dark:border-slate-600 dark:text-slate-300 dark:hover:border-cyan-400/60"
                            }`}
                          >
                            {c.codigo} (-{Number(c.descuentoPorcentaje)}%)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-2 block text-sm text-gray-500 dark:text-slate-400">
                    Método de pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {metodoPago === "tarjeta" && (
                  <div className="mb-4 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Datos de la tarjeta
                    </p>
                    <Input
                      label="Número de tarjeta"
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      value={numeroTarjeta}
                      onChange={(e) =>
                        setNumeroTarjeta(
                          e.target.value.replace(/\D/g, "").slice(0, 19)
                        )
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expiración (MM/AA)"
                        placeholder="12/28"
                        inputMode="numeric"
                        value={fechaExpiracion}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                          setFechaExpiracion(v);
                        }}
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        type="password"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                        }
                      />
                    </div>
                    {errorTarjeta && (
                      <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                        {errorTarjeta}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Demo: cualquier CVV aprueba, excepto 000 (rechaza).
                    </p>
                  </div>
                )}

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
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/80">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Resumen</h2>

                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
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
                    <span>
                      {cargandoEnvio || costoEnvioEstimado === null
                        ? "Calculando..."
                        : formatPrice(costoEnvioEstimado)}
                    </span>
                  </div>
                  {envioInfo && (
                    <div className="flex justify-between text-gray-400 dark:text-slate-500">
                      <span>Entrega estimada</span>
                      <span>{envioInfo.diasEstimados} días hábiles</span>
                    </div>
                  )}
                  {cuponAplicado && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Descuento ({cuponAplicado.codigo})</span>
                      <span>-{formatPrice(descuentoEstimado)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold text-gray-900 dark:border-slate-800 dark:text-white">
                  <span>Total estimado</span>
                  <span>{formatPrice(totalEstimado)}</span>
                </div>

                <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                  El costo final se confirma al procesar el pedido.
                </p>

                {errorCheckout && (
                  <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
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