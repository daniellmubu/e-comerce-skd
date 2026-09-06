import { useEffect, useRef, useState } from "react";
import {
  FaCommentDots,
  FaTimes,
  FaPaperPlane,
  FaMicrophone,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { enviarMensajeChat } from "../../services/chatService";
import { getErrorMessage } from "../../services/api";

const SALUDO_INICIAL = "Hola, ¿en qué puedo ayudarte?";

// Reconocimiento de voz: Web Speech API (Chrome/Edge desktop).
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const soportaMic = Boolean(SpeechRecognition);
const soportaVoz = "speechSynthesis" in window;

function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    { autor: "bot", texto: SALUDO_INICIAL },
  ]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [vozActiva, setVozActiva] = useState(true);
  const listaRef = useRef(null);

  // Referencias síncronas para los callbacks del reconocimiento.
  const escuchandoRef = useRef(false);
  const paradaManualRef = useRef(false);
  const arrancoRef = useRef(false);
  const reiniciosRef = useRef(0);
  const reconocimientoRef = useRef(null);

  const scrollAlFinal = () => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollAlFinal();
  }, [mensajes, cargando]);

  // Mantiene el ref sincronizado con el estado visible del botón.
  useEffect(() => {
    escuchandoRef.current = escuchando;
  }, [escuchando]);

  const mapearHistorial = (msgs) => {
    const filtrado = msgs.filter(
      (m) => !(m.autor === "bot" && m.texto === SALUDO_INICIAL)
    );
    const mapeado = filtrado.map((m) => ({
      rol: m.autor === "usuario" ? "user" : "model",
      texto: m.texto,
    }));
    while (mapeado.length > 0 && mapeado[0].rol !== "user") {
      mapeado.shift();
    }
    return mapeado.slice(-20);
  };

  /** Lee en voz alta la respuesta del asistente. */
  const hablar = (textoParaHablar) => {
    if (!vozActiva || !soportaVoz || !textoParaHablar) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textoParaHablar);
    utterance.lang = "es-CO";
    utterance.rate = 1.05;
    const voces = window.speechSynthesis.getVoices();
    const vozEspanol = voces.find((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
    if (vozEspanol) utterance.voice = vozEspanol;
    window.speechSynthesis.speak(utterance);
  };

  const enviarTexto = async (limpio) => {
    if (!limpio || cargando) return;

    const mensajeUsuario = { autor: "usuario", texto: limpio };
    const nuevosMensajes = [...mensajes, mensajeUsuario];
    setMensajes(nuevosMensajes);
    setTexto("");
    setCargando(true);

    const historial = mapearHistorial(nuevosMensajes.slice(0, -1));

    try {
      const data = await enviarMensajeChat(limpio, historial);
      const respuesta = data?.respuesta || "Gracias por tu mensaje.";
      setMensajes((prev) => [...prev, { autor: "bot", texto: respuesta }]);
      hablar(respuesta);
    } catch (error) {
      const msg = getErrorMessage(error);
      setMensajes((prev) => [...prev, { autor: "error", texto: msg }]);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = () => {
    enviarTexto(texto.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const agregarErrorVisible = (msg) => {
    setMensajes((prev) => [...prev, { autor: "error", texto: msg }]);
  };

  // ---- Micrófono (push-to-talk) ----
  const apagarMicrofono = () => {
    escuchandoRef.current = false;
    paradaManualRef.current = true;
    setEscuchando(false);
    if (reconocimientoRef.current) {
      try {
        reconocimientoRef.current.abort();
      } catch {
        // ya estaba detenido
      }
    }
  };

  const encenderMicrofono = () => {
    if (!SpeechRecognition || cargando) return;

    // Si el asistente está hablando, silenciarlo antes de escuchar (evita
    // que Chrome corte el reconocimiento por la salida de audio).
    if (soportaVoz) window.speechSynthesis.cancel();

    const crear = () => {
      const recon = new SpeechRecognition();
      recon.lang = "es-CO";
      recon.continuous = true; // no se detiene solo: esperamos la frase final
      recon.interimResults = true;
      recon.maxAlternatives = 1;

      arrancoRef.current = false;
      paradaManualRef.current = false;
      reiniciosRef.current = 0;
      const motivoRef = { actual: null };

      recon.onstart = () => {
        arrancoRef.current = true;
      };

      recon.onerror = (evento) => {
        console.warn("Reconocimiento de voz, error:", evento.error);
        motivoRef.actual = evento.error;
        if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
          agregarErrorVisible(
            "Necesito permiso del micrófono. Actívalo en el candado de la barra del navegador y vuelve a intentar."
          );
        } else if (evento.error === "network") {
          agregarErrorVisible(
            "No pude conectar con el servicio de voz de Google. Revisa tu internet o desactiva VPN/antivirus y vuelve a intentar."
          );
        } else if (evento.error === "audio-capture") {
          agregarErrorVisible("No encontré el micrófono. Conéctalo y vuelve a intentar.");
        }
      };

      recon.onresult = (evento) => {
        let fraseFinal = "";
        for (let i = evento.resultIndex; i < evento.results.length; i++) {
          const resultado = evento.results[i];
          if (resultado.isFinal) {
            fraseFinal += resultado[0].transcript;
          }
        }
        fraseFinal = fraseFinal.trim();
        if (fraseFinal) {
          setTexto(fraseFinal);
          apagarMicrofono();
          enviarTexto(fraseFinal);
        }
      };

      recon.onend = () => {
        // Si fue un corte manual o ya se envió la frase, no hacemos nada.
        if (paradaManualRef.current) {
          setEscuchando(false);
          return;
        }
        // No reintentamos en errores de red o permiso (no serviría).
        if (motivoRef.actual === "network" || motivoRef.actual === "not-allowed"
            || motivoRef.actual === "service-not-allowed" || motivoRef.actual === "audio-capture") {
          setEscuchando(false);
          return;
        }
        // Chrome a veces cierra solo tras "no-speech" o por el permiso:
        // reintentamos un par de veces si realmente arrancó y el usuario
        // sigue con el botón activo.
        if (escuchandoRef.current && arrancoRef.current && reiniciosRef.current < 2) {
          reiniciosRef.current += 1;
          try {
            recon.start();
          } catch {
            setEscuchando(false);
          }
          return;
        }
        if (!arrancoRef.current && !motivoRef.actual) {
          agregarErrorVisible(
            "No se pudo activar el micrófono. Revisa el permiso en el candado de la barra del navegador."
          );
        }
        setEscuchando(false);
      };

      return recon;
    };

    reconocimientoRef.current = crear();
    setEscuchando(true);
    try {
      reconocimientoRef.current.start();
    } catch {
      setEscuchando(false);
    }
  };

  const toggleMicrofono = () => {
    if (escuchando) {
      apagarMicrofono();
    } else {
      encenderMicrofono();
    }
  };

  useEffect(() => {
    return () => {
      if (reconocimientoRef.current) {
        try {
          reconocimientoRef.current.abort();
        } catch {
          // sin efecto
        }
      }
      if (soportaVoz) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleVoz = () => {
    setVozActiva((v) => {
      const nueva = !v;
      if (!nueva && soportaVoz) window.speechSynthesis.cancel();
      return nueva;
    });
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
    <div className="fixed bottom-6 right-6 z-50 flex h-[440px] w-[330px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600">
        <span className="flex items-center gap-2 font-semibold text-white">
          <FaCommentDots /> Asistente SKD
        </span>
        <div className="flex items-center gap-1">
          {soportaVoz && (
            <button
              type="button"
              onClick={toggleVoz}
              aria-label={vozActiva ? "Silenciar voz" : "Activar voz"}
              title={vozActiva ? "Respuestas con voz: activadas" : "Respuestas con voz: desactivadas"}
              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {vozActiva ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar asistente"
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
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
              Pensando
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {soportaMic && (
            <button
              type="button"
              onClick={toggleMicrofono}
              disabled={cargando}
              aria-label={escuchando ? "Detener micrófono" : "Hablar con el asistente"}
              title={escuchando ? "Detener micrófono" : "Hablar (microfono)"}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-50 ${
                escuchando
                  ? "animate-pulse bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <FaMicrophone className="text-sm" />
            </button>
          )}
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={escuchando ? "Escuchando... habla ahora" : "Escribe o habla..."}
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
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-slate-500">
          {escuchando
            ? "Te escucho, habla ahora"
            : soportaMic
              ? "Toca el micrófono y habla"
              : "Hablar con asesor"}
        </p>
      </div>
    </div>
  );
}

export default ChatWidget;
