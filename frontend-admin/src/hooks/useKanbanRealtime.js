import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Clave de sesión propia del panel admin (no comparte con la tienda).
const TOKEN_KEY = "skd_admin_token";

function baseWsUrl() {
  const api = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return api.replace(/\/api\/?$/, "") + "/ws";
}

/**
 * Mantiene una conexión STOMP/WebSocket del panel admin al topic
 * "/topic/kanban" y llama a `onEvent` con el cuerpo decodificado cada vez que
 * llega un cambio de estado de un pedido (sincroniza Pedidos <-> Producción en
 * tiempo real).
 *
 * El backend exige el JWT del admin en el header Authorization del frame
 * CONNECT y que el rol sea admin o diseñador para suscribirse.
 */
export function useKanbanRealtime(onEvent) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;

    const cliente = new Client({
      webSocketFactory: () => new SockJS(baseWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
    });

    let suscripcion = null;

    cliente.onConnect = () => {
      suscripcion = cliente.subscribe("/topic/kanban", (mensaje) => {
        try {
          onEventRef.current(JSON.parse(mensaje.body));
        } catch {
          onEventRef.current(mensaje.body);
        }
      });
    };

    cliente.activate();

    return () => {
      if (suscripcion) suscripcion.unsubscribe();
      cliente.deactivate();
    };
  }, []);
}
