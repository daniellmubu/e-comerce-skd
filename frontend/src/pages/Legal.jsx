import { Link, useParams } from "react-router-dom";
import { FaFileContract, FaShieldAlt, FaTruck, FaArrowLeft } from "react-icons/fa";

const CONTENIDO = {
  terminos: {
    titulo: "Términos y condiciones",
    icono: <FaFileContract />,
    secciones: [
      {
        h: "1. Aceptación de los términos",
        p: "Al acceder y utilizar este sitio web, aceptas los presentes términos y condiciones. Si no estás de acuerdo, te pedimos que no utilices nuestros servicios.",
      },
      {
        h: "2. Productos personalizados",
        p: "Nuestros productos (camisetas, mugs, gorras y más) se fabrican bajo pedido mediante sublimación. Por esta razón, los colores y el resultado final pueden variar ligeramente respecto a la vista previa que se muestra en la pantalla.",
      },
      {
        h: "3. Precios y pagos",
        p: "Los precios se muestran en pesos colombianos (COP) e incluyen los impuestos aplicables. El pago se procesa de forma segura a través de nuestra pasarela de pagos. No realizaremos el envío hasta confirmar el pago.",
      },
      {
        h: "4. Envíos",
        p: "Los tiempos de entrega estimados se indican al realizar el pedido y dependen de la cobertura del transportador. SKD no se hace responsable por retrasos ocasionados por el servicio de mensajería.",
      },
      {
        h: "5. Propiedad intelectual",
        p: "Los diseños creados por el cliente deben respetar los derechos de autor. No se permite subir o solicitar diseños que infrinjan marcas o derechos de terceros.",
      },
      {
        h: "6. Modificaciones",
        p: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán publicados en esta página y entrarán en vigor desde su publicación.",
      },
    ],
  },
  privacidad: {
    titulo: "Política de privacidad",
    icono: <FaShieldAlt />,
    secciones: [
      {
        h: "1. Datos que recopilamos",
        p: "Recopilamos los datos necesarios para procesar tus pedidos: nombre, correo electrónico, dirección de envío y datos de contacto. También almacenamos tus diseños e historial de compras para mejorar tu experiencia.",
      },
      {
        h: "2. Uso de la información",
        p: "Usamos tu información para gestionar pedidos, enviar notificaciones y facturas, y ofrecer soporte. Con tu consentimiento, podemos enviarte promociones y novedades.",
      },
      {
        h: "3. Protección de datos",
        p: "Tus datos de pago se procesan directamente por nuestra pasarela de pagos (Wompi). No almacenamos números de tarjeta ni datos bancarios. Aplicamos medidas de seguridad para proteger tu información personal.",
      },
      {
        h: "4. Compartir información",
        p: "No vendemos ni alquilamos tus datos a terceros. Solo los compartimos con los proveedores necesarios para completar tu pedido (pagos y envíos) y cuando la ley lo exija.",
      },
      {
        h: "5. Tus derechos",
        p: "Puedes solicitar la corrección, actualización o eliminación de tus datos personales en cualquier momento escribiéndonos a través de nuestro canal de contacto.",
      },
      {
        h: "6. Cookies",
        p: "Utilizamos cookies para mantener tu sesión activa y recordar tu carrito de compras. Puedes configurar tu navegador para bloquearlas, aunque algunas funciones podrían no funcionar correctamente.",
      },
    ],
  },
  envios: {
    titulo: "Política de envíos y devoluciones",
    icono: <FaTruck />,
    secciones: [
      {
        h: "1. Tiempos de producción",
        p: "Cada producto se fabrica bajo pedido. El tiempo de producción es de 1 a 3 días hábiles antes del despacho.",
      },
      {
        h: "2. Tiempos de envío",
        p: "Una vez despachado, el tiempo de entrega depende de la ciudad y el transportador. Verás una estimación en tu confirmación de pedido y podrás hacer seguimiento desde 'Mis pedidos'.",
      },
      {
        h: "3. Costo del envío",
        p: "El costo del envío se calcula en el checkout según el destino. Puede haber promociones de envío gratuito según el valor del pedido.",
      },
      {
        h: "4. Productos dañados o defectuosos",
        p: "Si recibes tu pedido dañado o con un defecto de fabricación, contáctanos dentro de los 5 días hábiles posteriores a la entrega con fotos del producto y lo reemplazaremos sin costo.",
      },
      {
        h: "5. Devoluciones por personalización",
        p: "Al ser productos personalizados, no se aceptan devoluciones por cambios de opinión una vez iniciada la producción. Si el diseño enviado no cumple con lo solicitado, lo ajustaremos.",
      },
      {
        h: "6. Errores de dirección",
        p: "Asegúrate de ingresar correctamente tu dirección de envío. No nos hacemos responsables por entregas fallidas debido a direcciones incorrectas o incompletas.",
      },
    ],
  },
};

function Legal() {
  const { tipo } = useParams();
  const contenido = CONTENIDO[tipo];

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
        >
          <FaArrowLeft /> Volver al inicio
        </Link>

        {contenido ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                {contenido.icono}
              </span>
              <h1 className="text-3xl font-bold">{contenido.titulo}</h1>
            </div>

            <div className="space-y-6">
              {contenido.secciones.map((s) => (
                <div key={s.h}>
                  <h2 className="text-lg font-semibold">{s.h}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                    {s.p}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-gray-400 dark:text-slate-500">
              Última actualización: agosto de 2026. SKD - Creando Sueños.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <p>Documento no encontrado.</p>
            <Link to="/" className="mt-2 inline-block font-semibold text-indigo-600 dark:text-cyan-400">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default Legal;