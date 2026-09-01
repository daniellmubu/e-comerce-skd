import { useEffect, useRef, useState } from "react";
import { FaCommentDots, FaTimes, FaPaperPlane } from "react-icons/fa";
import { enviarMensajeChat } from "../../services/chatService";
import { getErrorMessage } from "../../services/api";

function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    { autor: "bot", texto: "Hola, ¿en qué puedo ayudarte?" },
  ]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const listaRef = useRef(null);

  const scrollAlFinal = () => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollAlFinal();
  }, [mensajes, cargando]);

  const SALUDO_INICIAL = "Hola, ¿en qué puedo ayudarte?";

  const mapearHistorial = (msgs) => {
    // El saludo inicial del bot no debe enviarse al backend: Gemini exige que
    // contents empiece con role "user", y ese saludo como rol "model" provoca 400.
    const filtrado = msgs.filter(
      (m) => !(m.autor === "bot" && m.texto === SALUDO_INICIAL)
    );
    const mapeado = filtrado.map((m) => ({
      rol: m.autor === "usuario" ? "user" : "model",
      texto: m.texto,
    }));
    // Eliminar mensajes iniciales con rol "model" por si queda alguno (defensa extra)
    while (mapeado.length > 0 && mapeado[0].rol !== "user") {
      mapeado.shift();
    }
    // Respetar límite del backend (max 20)
    return mapeado.slice(-20);
  };

  const enviarMensaje = async () => {
    const limpio = texto.trim();
    if (!limpio || cargando) return;

    const mensajeUsuario = { autor: "usuario", texto: limpio };
    const nuevosMensajes = [...mensajes, mensajeUsuario];
    setMensajes(nuevosMensajes);
    setTexto("");
    setCargando(true);

    // Historial previo en formato backend (excluye el saludo inicial si se quiere mantener, lo enviamos igual)
    const historial = mapearHistorial(nuevosMensajes.slice(0, -1));

    try {
      const data = await enviarMensajeChat(limpio, historial);
      const respuesta = data?.respuesta || "Gracias por tu mensaje.";
      setMensajes((prev) => [...prev, { autor: "bot", texto: respuesta }]);
    } catch (error) {
      const msg = getErrorMessage(error);
      setMensajes((prev) => [...prev, { autor: "error", texto: msg }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enviarMensaje();
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente SKD"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl text-white shadow-lg transition hover:scale-105 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600 dark:shadow-cyan-500/30"
      >
        <FaCommentDots />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600">
        <span className="flex items-center gap-2 font-semibold text-white">
          <FaCommentDots /> Asistente SKD
        </span>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar asistente"
          className="text-white/80 transition hover:text-white"
        >
          <FaTimes />
        </button>
      </div>

      <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              m.autor === "bot"
                ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                : m.autor === "error"
                ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                : "ml-auto bg-indigo-50 text-indigo-900 dark:bg-cyan-500/20 dark:text-cyan-100"
            }`}
          >
            {m.texto}
          </div>
        ))}
        {cargando && (
          <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500 dark:bg-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              Escribiendo
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            maxLength={500}
            disabled={cargando}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={enviarMensaje}
            disabled={cargando || !texto.trim()}
            aria-label="Enviar mensaje"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-slate-500">Hablar con asesor</p>
      </div>
    </div>
  );
}

export default ChatWidget;
