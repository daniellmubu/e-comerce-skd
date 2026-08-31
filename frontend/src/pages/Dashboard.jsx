import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMagic,
  FaShoppingBag,
  FaPalette,
  FaGift,
  FaUsers,
  FaCopy,
  FaShareAlt,
  FaEnvelope,
} from "react-icons/fa";

import { obtenerUsuarioActual, reenviarVerificacion, verificarEmail } from "../services/authService";
import { obtenerMiCodigo } from "../services/referidoService";
import { getErrorMessage } from "../services/api";

const ROL_LABELS = {
  cliente: "Cliente",
  admin: "Administrador",
  disenador: "Diseñador",
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

  useEffect(() => {
    if (!usuario) return undefined;
    let activo = true;
    obtenerMiCodigo()
      .then((data) => { if (activo) setReferido(data); })
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

        {/* Accesos rápidos */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          <button
            onClick={() => navigate("/personalizador")}
            className="group flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur dark:hover:border-cyan-400/50 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
              <FaMagic />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Diseña con IA
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Crea un nuevo diseño desde un prompt
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/catalogo")}
            className="group flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur dark:hover:border-cyan-400/50 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
              <FaShoppingBag />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Ver catálogo
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Explora productos disponibles para personalizar
              </p>
            </div>
          </button>
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

        {/* Mis pedidos */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Mis pedidos
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
            El historial de tus compras aparecerá aquí.
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-slate-700">
            <FaShoppingBag className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">Revisa el historial de tus compras.</p>
            <button
              onClick={() => navigate("/mis-pedidos")}
              className="mt-4 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
            >
              Ver mis pedidos
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;