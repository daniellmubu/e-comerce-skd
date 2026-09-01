import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaFire,
  FaPalette,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import {
  listarDisenosPublicos,
  darMeGustaDiseno,
  quitarMeGustaDiseno,
} from "../services/disenoService";
import { obtenerOCrearCarrito, agregarItem } from "../services/carritoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

const ORDENES = [
  { value: "recientes", label: "Más recientes" },
  { value: "megusta", label: "Más populares" },
  { value: "usos", label: "Más usados" },
];

function GaleriaDisenos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [orden, setOrden] = useState("recientes");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    let activo = true;
    listarDisenosPublicos({ page, size: 12, orden })
      .then((data) => {
        if (!activo) return;
        setItems(data.content ?? []);
        setTotalPaginas(data.totalPages ?? 0);
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [page, orden]);

  const requerirSesion = () => {
    if (!usuario) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const alternarMeGusta = async (diseno) => {
    if (!requerirSesion()) return;
    setProcesandoId(diseno.id);
    setMensaje(null);
    try {
      if (diseno.meGustaPropio) {
        await quitarMeGustaDiseno(diseno.id);
      } else {
        await darMeGustaDiseno(diseno.id);
      }
      // Actualización local optimista de la tarjeta.
      setItems((prev) =>
        prev.map((d) =>
          d.id === diseno.id
            ? {
                ...d,
                meGustaPropio: !d.meGustaPropio,
                meGusta: d.meGusta + (d.meGustaPropio ? -1 : 1),
              }
            : d
        )
      );
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setProcesandoId(null);
    }
  };

  const usarDiseno = async (diseno) => {
    if (!requerirSesion()) return;
    if (!diseno.productoId) {
      setMensaje({ tipo: "error", texto: "Este diseño no tiene un producto asociado." });
      return;
    }
    setProcesandoId(diseno.id);
    setMensaje(null);
    try {
      const carrito = await obtenerOCrearCarrito();
      // El endpoint acepta disenoId de diseños propios o públicos aprobados.
      await agregarItem({
        carritoId: carrito.id ?? carrito,
        productoId: diseno.productoId,
        cantidad: 1,
        disenoId: diseno.id,
      });
      navigate("/carrito");
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setProcesandoId(null);
    }
  };

  const cambiarOrden = (op) => {
    setCargando(true);
    setError(null);
    setOrden(op);
    setPage(0);
  };

  const cambiarPagina = (nuevaPagina) => {
    setCargando(true);
    setError(null);
    setPage(nuevaPagina);
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Diseños de la comunidad
          </span>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            Galería de diseños
          </h1>
          <p className="mt-2 text-gray-500 dark:text-slate-400">
            Crea, publica tu diseño y deja que todo el mundo lo use. Los más
            populares llegan aquí.
          </p>
          {usuario && (
            <Link
              to="/mis-disenos"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              <FaPalette /> Publicar mis diseños
            </Link>
          )}
        </div>

        {mensaje && (
          <p
            className={`mb-4 rounded-xl border px-4 py-3 text-center text-sm ${
              mensaje.tipo === "error"
                ? "border-red-300 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        {/* Selector de orden */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {ORDENES.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => cambiarOrden(op.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                orden === op.value
                  ? "bg-indigo-600 text-white shadow dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <Loading label="Cargando diseños..." />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => {
                setCargando(true);
                setPage((p) => p + 0); // fuerza recarga
                window.location.reload();
              }}
              className="mt-4 rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium dark:border-slate-700"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center dark:border-slate-700">
            <FaPalette className="mb-4 text-4xl text-gray-300 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">
              Aún no hay diseños publicados.
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
              ¡Sé el primero en compartir tu creación!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((diseno) => (
                <div
                  key={diseno.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-800">
                    {diseno.imagenUrl ? (
                      <img
                        src={diseno.imagenUrl}
                        alt={diseno.titulo || "Diseño"}
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <FaPalette className="text-3xl text-gray-300 dark:text-slate-600" />
                    )}
                    <button
                      type="button"
                      onClick={() => alternarMeGusta(diseno)}
                      disabled={procesandoId === diseno.id}
                      title={usuario ? "Me gusta" : "Inicia sesión para dar me gusta"}
                      className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow transition disabled:opacity-50 ${
                        diseno.meGustaPropio
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-red-500 hover:bg-red-50 dark:bg-slate-900/90 dark:text-red-400"
                      }`}
                    >
                      {diseno.meGustaPropio ? <FaHeart /> : <FaRegHeart />}
                      {diseno.meGusta}
                    </button>
                    {diseno.vecesUsado > 0 && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-orange-500 dark:bg-slate-900/90">
                        <FaFire /> {diseno.vecesUsado} usos
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
                      {diseno.titulo || "Diseño sin título"}
                    </h3>
                    {diseno.producto && (
                      <Link
                        to={`/productos/${diseno.productoId}`}
                        className="mt-0.5 block text-sm font-medium text-indigo-600 hover:underline dark:text-cyan-300"
                      >
                        {diseno.producto}
                      </Link>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                      <FaUser /> por {diseno.usuarioNombre || "Anónimo"}
                    </p>
                    {diseno.prompt && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                        {diseno.prompt}
                      </p>
                    )}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => usarDiseno(diseno)}
                        disabled={procesandoId === diseno.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                      >
                        <FaShoppingCart /> Usar este diseño
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => cambiarPagina(Math.max(0, page - 1))}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Página {page + 1} de {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPaginas}
                  onClick={() => cambiarPagina(page + 1)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default GaleriaDisenos;
