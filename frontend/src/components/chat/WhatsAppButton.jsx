import { FaWhatsapp } from "react-icons/fa6";

// Reemplaza por el número de WhatsApp de la empresa (con código de país,
// sin "+" ni espacios). También se puede configurar con VITE_WHATSAPP_NUMBER.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "573215525163";
const WHATSAPP_MESSAGE =
  import.meta.env.VITE_WHATSAPP_MESSAGE || "Hola, quiero hacer un pedido en SKD";

function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500"
    >
      <FaWhatsapp />
    </a>
  );
}

export default WhatsAppButton;