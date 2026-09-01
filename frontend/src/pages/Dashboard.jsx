import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingBag,
  FaPalette,
  FaGift,
  FaUsers,
  FaCopy,
  FaShareAlt,
  FaLock,
  FaSave,
  FaEnvelope,
  FaUnlockAlt,
  FaCheckDouble,
  FaCheckCircle,
  FaExclamationCircle,
  FaChevronDown,
  FaChevronUp,
  FaBoxOpen,
  FaWallet,
  FaTicketAlt,
  FaInbox,
  FaHeart,
} from "react-icons/fa";

import { obtenerUsuarioActual, reenviarVerificacion, verificarEmail, cambiarPassword, verificarPasswordActual } from "../services/authService";
import { obtenerMiCodigo } from "../services/referidoService";
import { listarPedidosPorUsuario } from "../services/pedidoService";
import { listarMisFavoritos } from "../services/favoritoService";
import { listarMisCupones } from "../services/cuponService";
import { listarNotificaciones } from "../services/notificacionService";
import { getErrorMessage } from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const ROL_LABELS = {
  cliente: "Cliente",
  admin: "Administrador",
  disenador: "Diseñador",
};

function fuerzaPassword(pass) {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return Math.min(score, 4);
}

const FUERZA_LABEL = ["", "Débil", "Débil", "Media", "Fuerte"];
const FUERZA_COLOR = ["", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

const ESTADO_BADGE = {
  recibido: "bg-indigo-100 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  disenando: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  imprimiendo: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  empacando: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  enviado: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  entregado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => obtenerUsuarioActual());

  const [referido, setReferido] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [mensajeVerif, setMensajeVerif] = useState(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [totalGastado, setTotalGastado] = useState(0);
  const [favoritosCount, setFavoritosCount] = useState(0);
  const [cupones, setCupones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [erroresPassword, setErroresPassword] = useState({});
  const [mostrarCambiar, setMostrarCambiar] = useState(false);
  const [pasoCambiar, setPasoCambiar] = useState(1);
  const [verificandoActual, setVerificandoActual] = useState(false);

  useEffect(() => {
    if (!usuario) return undefined;
    let activo = true;

    obtenerMiCodigo()
      .then((data) => { if (activo) setReferido(data); })
      .catch(() => {});

    listarPedidosPorUsuario()
      .then((data) => {
        if (!activo) return;
        const lista = Array.isArray(data) ? data : [];
        setPedidos(lista);
        const activos = lista.filter((p) => !["entregado", "cancelado"].includes(p.estado));
        const gastado = lista
          .filter((p) => p.estado !== "cancelado")
          .reduce((acc, p) => acc + Number(p.total || 0), 0);
        setTotalGastado(gastado);
      })
      .catch(() => {});

    listarMisFavoritos(0, 1)
      .then((data) => {
        if (!activo) return;
        const total = data?.totalElements ?? data?.total ?? (Array.isArray(data) ? data.length : 0);
        setFavoritosCount(Number(total) || 0);
      })
      .catch(() => {});

    listarMisCupones()
      .then((data) => { if (activo) setCupones(Array.isArray(data) ? data : []); })
      .catch(() => {});

    listarNotificaciones()
      .then((data) => {
        if (activo) setNotificaciones((Array.isArray(data) ? data : []).slice(0, 3));
      })
      .catch(() => {});

    return () => { activo = false; };
  }, [usuario]);

  // Fallback defensivo: RutaProtegida ya evita llegar aquí sin sesión,
  // pero si localStorage se limpió manualmente evitamos un crash.
  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center text-gray-600 dark:bg-slate-950 dark:text-slate-300">
        <div>
          <p className="mb-4">No se pudo cargar tu sesión.</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            Iniciar sesión de nuevo
          </button>
        </div>
      </div>
    );
  }


  const handleVerificar = async () => {
    if (codigo.length !== 6) return;
    setVerificando(true);
    setMensajeVerif(null);
    try {
      await verificarEmail(codigo);
      // Refresca la sesión guardada y el estado local para que desaparezca el banner.
      const actual = obtenerUsuarioActual();
      const actualizado = { ...actual, verificado: true };
      localStorage.setItem("skd_user", JSON.stringify(actualizado));
      setUsuario(actualizado);
      setMensajeVerif("¡Correo verificado!");
    } catch (err) {
      setMensajeVerif(getErrorMessage(err));
    } finally {
      setVerificando(false);
    }
  };

  const handleVerificarActual = async (e) => {
    e.preventDefault();
    setErroresPassword({});
    if (!passwordActual.trim()) {
      setErroresPassword({ passwordActual: "Ingresa tu contraseña actual." });
      return;
    }
    setVerificandoActual(true);
    try {
      await verificarPasswordActual(passwordActual);
      setPasoCambiar(2);
    } catch (err) {
      setErroresPassword({ passwordActual: getErrorMessage(err) });
    } finally {
      setVerificandoActual(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErroresPassword({});
    setMensajePassword(null);

    const errs = {};
    if (!passwordActual.trim()) errs.passwordActual = "Ingresa tu contraseña actual.";
    if (nuevaPassword.length < 6) errs.nuevaPassword = "Debe tener al menos 6 caracteres.";
    if (nuevaPassword !== confirmarPassword) errs.confirmarPassword = "Las contraseñas no coinciden.";
    if (Object.keys(errs).length) {
      setErroresPassword(errs);
      return;
    }

    setCambiandoPassword(true);
    try {
      await cambiarPassword({ passwordActual, nuevaPassword });
      setMensajePassword({ tipo: "ok", texto: "Contraseña actualizada correctamente." });
      setPasswordActual("");
      setNuevaPassword("");
      setConfirmarPassword("");
    } catch (err) {
      setErroresPassword({ passwordActual: getErrorMessage(err) });
    } finally {
      setCambiandoPassword(false);
    }
  };

  const rolLabel = ROL_LABELS[usuario.rol] || usuario.rol;


  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 hidden h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl dark:block" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 hidden h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl dark:block" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
              {rolLabel}
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Hola, {usuario.nombre.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Este es tu panel en SKD. Desde aquí puedes seguir creando y
              revisar tu actividad.
            </p>
          </div>
        </div>

        {usuario.verificado === false && (
          <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <FaEnvelope className="mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Verifica tu correo
                </p>
                <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                  Ingresa el código que enviamos a {usuario.correo}.
                  {mensajeVerif && ` ${mensajeVerif}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="Código de 6 dígitos"
                className="w-full rounded-xl border border-amber-400 bg-white px-4 py-2.5 text-center text-lg font-bold tracking-widest text-gray-900 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 outline-none transition focus:border-amber-500 sm:w-44 dark:border-amber-500/40 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleVerificar}
                disabled={codigo.length !== 6 || verificando}
                className="shrink-0 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-400"
              >
                {verificando ? "Verificando..." : "Verificar"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setReenviando(true);
                  setMensajeVerif(null);
                  try {
                    await reenviarVerificacion(usuario.correo);
                    setMensajeVerif("Revisa tu correo.");
                  } catch (err) {
                    setMensajeVerif(getErrorMessage(err));
                  } finally {
                    setReenviando(false);
                  }
                }}
                disabled={reenviando}
                className="shrink-0 rounded-xl border border-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
              >
                {reenviando ? "Enviando..." : "Reenviar código"}
              </button>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300">
              <FaBoxOpen />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{pedidos.length}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Pedidos</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <FaWallet />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {Number(totalGastado).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Total gastado</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
              <FaHeart />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{favoritosCount}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Favoritos</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <FaTicketAlt />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{cupones.length}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Cupones</p>
          </div>
        </div>

        {/* Mis diseños — resumen con botón al centro */}
        <section className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Mis diseños
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
            Revisa tus diseños guardados.
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-slate-700">
            <FaPalette className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">
              Administra tus creaciones y descárgalas cuando quieras.
            </p>
            <button
              onClick={() => navigate("/mis-disenos")}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Ver mis diseños
            </button>
          </div>
        </section>

        {/* Referidos */}
        <section className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <FaGift />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invita y gana</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Comparte tu código y gana recompensas por cada amigo que se registre.</p>
            </div>
          </div>
          {referido ? (
            <div className="mt-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-5 dark:border-amber-400/40 dark:bg-amber-500/10 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-300">Tu código</p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-widest text-amber-700 dark:text-amber-300">{referido.codigo}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{referido.totalReferidos} referidos · {referido.recompensas} recompensas</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(referido.codigo);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow hover:bg-amber-100 dark:bg-slate-800 dark:text-amber-300"
                  >
                    <FaCopy /> {copiado ? "¡Copiado!" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) navigator.share({ title: "Únete a SKD", text: "Usa mi código en SKD:", url: referido.link }).catch(() => {});
                      else { navigator.clipboard.writeText(referido.link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    <FaShareAlt /> Compartir
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">Link: <span className="font-mono">{referido.link}</span></p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500 dark:text-slate-400">Cargando tu código...</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <FaUsers className="text-amber-500" />
            <button type="button" onClick={() => navigate("/galeria-clientes")} className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-300">
              Ver galería de clientes
            </button>
            <span>· inspira a otros con tus reseñas con foto</span>
          </div>
        </section>

        {/* Pedidos recientes */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pedidos recientes</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Tus últimos pedidos y su estado.</p>
            </div>
            <button
              onClick={() => navigate("/mis-pedidos")}
              className="text-sm font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
            >
              Ver todos
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-slate-700">
              <FaShoppingBag className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
              <p className="text-gray-500 dark:text-slate-400">Aún no tienes pedidos.</p>
              <button
                onClick={() => navigate("/catalogo")}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                Ir al catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-slate-800"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Pedido #{p.id}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {new Date(p.creadoEn).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {Number(p.total).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      ESTADO_BADGE[p.estado] ||
                      "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {p.estado?.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cupones */}
        {cupones.length > 0 && (
          <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  <FaTicketAlt />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cupones disponibles</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Usa tu descuento en el checkout.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/mis-cupones")}
                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
              >
                Ver todos
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {cupones.slice(0, 4).map((c) => (
                <div
                  key={c.cuponId || c.id}
                  className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-400/40 dark:bg-amber-500/10"
                >
                  <p className="font-mono text-lg font-black tracking-wide text-amber-700 dark:text-amber-300">
                    {c.codigo}
                  </p>
                  <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                    -{Number(c.descuentoPorcentaje || 0)}%
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notificaciones */}
        {notificaciones.length > 0 && (
          <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                  <FaInbox />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Novedades de tus pedidos.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/bandeja")}
                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
              >
                Ver bandeja
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {notificaciones.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 dark:border-slate-800"
                >
                  <FaInbox className="mt-0.5 shrink-0 text-indigo-500 dark:text-cyan-400" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{n.titulo}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-slate-400">{n.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cambiar contraseña */}
        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <FaLock />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Seguridad</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Actualiza tu contraseña para mantener tu cuenta segura.
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-md space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Estado de la cuenta
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Correo</span>
              <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                {usuario.correo}
                {usuario.verificado ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <FaCheckCircle className="text-xs" /> Verificado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                    <FaExclamationCircle className="text-xs" /> Pendiente
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Rol</span>
              <span className="capitalize text-gray-900 dark:text-white">
                {ROL_LABELS[usuario.rol] || usuario.rol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Miembro desde</span>
              <span className="text-gray-900 dark:text-white">
                {usuario.creadoEn
                  ? new Date(usuario.creadoEn).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>

          <div className="my-6 border-t border-gray-200 dark:border-slate-800" />

          <button
            type="button"
            onClick={() => setMostrarCambiar((v) => !v)}
            className="flex w-full max-w-md items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
          >
            <span className="flex items-center gap-2">
              <FaLock /> Cambiar contraseña
            </span>
            {mostrarCambiar ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {mostrarCambiar && (
            <div className="mt-4 max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              {pasoCambiar === 1 ? (
                <>
                  <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Verifica tu identidad
                  </p>
                  <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">
                    Ingresa tu contraseña actual para continuar.
                  </p>
                  <form onSubmit={handleVerificarActual} className="space-y-4" noValidate>
                    <Input
                      label="Contraseña actual"
                      type="password"
                      icon={<FaUnlockAlt />}
                      placeholder="Tu contraseña actual"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      autoComplete="current-password"
                      error={erroresPassword.passwordActual}
                    />
                    <Button
                      type="submit"
                      loading={verificandoActual}
                      disabled={!passwordActual.trim()}
                      className="w-full sm:w-auto"
                    >
                      Verificar
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Nueva contraseña
                    </p>
                    <button
                      type="button"
                      onClick={() => setPasoCambiar(1)}
                      className="text-xs font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
                    >
                      ← Volver
                    </button>
                  </div>
                  <form onSubmit={handleCambiarPassword} className="space-y-5" noValidate>
                    <div>
                      <Input
                        label="Nueva contraseña"
                        type="password"
                        icon={<FaLock />}
                        placeholder="Mínimo 6 caracteres"
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        autoComplete="new-password"
                        error={erroresPassword.nuevaPassword}
                      />
                      {nuevaPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                            <span>Fortaleza</span>
                            <span className="font-semibold">
                              {FUERZA_LABEL[fuerzaPassword(nuevaPassword)]}
                            </span>
                          </div>
                          <div className="mt-1 flex gap-1.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  fuerzaPassword(nuevaPassword) >= i
                                    ? FUERZA_COLOR[fuerzaPassword(nuevaPassword)]
                                    : "bg-gray-200 dark:bg-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Input
                      label="Confirmar nueva contraseña"
                      type="password"
                      icon={<FaCheckDouble />}
                      placeholder="Repite la nueva contraseña"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      autoComplete="new-password"
                      error={erroresPassword.confirmarPassword}
                    />

                    {mensajePassword && (
                      <div
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                          mensajePassword.tipo === "error"
                            ? "border-red-300 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        }`}
                      >
                        {mensajePassword.tipo === "ok" ? (
                          <FaCheckCircle className="shrink-0" />
                        ) : (
                          <FaExclamationCircle className="shrink-0" />
                        )}
                        {mensajePassword.texto}
                      </div>
                    )}

                    <Button
                      type="submit"
                      loading={cambiandoPassword}
                      disabled={!nuevaPassword || !confirmarPassword}
                      leftIcon={<FaSave />}
                      className="w-full sm:w-auto"
                    >
                      Guardar contraseña
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;