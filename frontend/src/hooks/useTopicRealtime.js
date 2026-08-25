import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const TOKEN_KEY = "skd_token";

function baseWsUrl() {
  const api = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return api.replace(/\/api\/?$/, "") + "/ws";
}

/**
 * Mantiene una conexión STOMP/WebSocket al backend y se suscribe a una lista
 * de topics (ej: "/topic/pedidos/12", "/topic/solicitudes/3"). Cada vez que
 * llega un mensaje llama a `onEvent` con el cuerpo ya decodificado.
 *
 * Internamente usa una clave estable para no reconectar cuando la lista de
 * topics se recarga con el mismo contenido.
 */
export function useTopicRealtime(topics, onEvent) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const clave = (topics ?? []).slice().sort().join("|");

  useEffect(() => {
    if (!clave) return undefined;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;

    const listaTopics = clave.split("|");

    const cliente = new Client({
      webSocketFactory: () => new SockJS(baseWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
    });

    let suscripciones = [];

    cliente.onConnect = () => {
      suscripciones = listaTopics.map((tema) =>
        cliente.subscribe(tema, (mensaje) => {
          try {
            onEventRef.current(JSON.parse(mensaje.body));
          } catch {
            onEventRef.current(mensaje.body);
          }
        })
      );
    };

    cliente.activate();

    return () => {
      suscripciones.forEach((sub) => sub.unsubscribe());
      cliente.deactivate();
    };
  }, [clave]);
}
