import { useState } from "react";
import { FaCommentDots, FaTimes, FaPaperPlane } from "react-icons/fa";

// Nota: este widget es una simulación en el frontend (respuestas fijas).
// No existe todavía un backend de chat/asistente — si se quiere una IA real
// respondiendo, hay que decidir el proveedor y crear un endpoint dedicado.
const RESPUESTA_AUTOMATICA =
  "Gracias por tu mensaje. Un asesor te responderá pronto. Mientras tanto, puedes revisar el estado de tus pedidos en 'Mis pedidos'.";

function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    { autor: "bot", texto: "Hola, ¿en qué puedo ayudarte?" },
  ]);
  const [texto, setTexto] = useState("");

  const enviarMensaje = () => {
    if (!texto.trim()) return;

    const mensajeUsuario = { autor: "usuario", texto: texto.trim() };
    setMensajes((prev) => [...prev, mensajeUsuario]);
    setTexto("");

    setTimeout(() => {
      setMensajes((prev) => [...prev, { autor: "bot", texto: RESPUESTA_AUTOMATICA }]);
    }, 700);
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

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              m.autor === "bot"
                ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                : "ml-auto bg-indigo-50 text-indigo-900 dark:bg-cyan-500/20 dark:text-cyan-100"
            }`}
          >
            {m.texto}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={enviarMensaje}
            aria-label="Enviar mensaje"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:scale-105 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
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
