import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaShieldAlt, FaCheckCircle, FaCreditCard, FaMobileAlt, FaMoneyBillWave, FaUniversity, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { iniciarPagoWompi, simularPagoTarjeta, consultarEstadoPago } from "../services/pagoService";
import { getErrorMessage } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

const METODO_INFO = {
  tarjeta: { label: "Tarjeta de crédito / débito", icon: FaCreditCard, color: "from-indigo-500 to-violet-600", desc: "Visa, Mastercard, American Express" },
  pse: { label: "PSE - Pago Seguro en Línea", icon: FaUniversity, color: "from-emerald-500 to-teal-600", desc: "Desde tu banco de confianza" },
  nequi: { label: "Nequi", icon: FaMobileAlt, color: "from-pink-500 to-rose-600", desc: "Pago inmediato con notificación push" },
  efectivo: { label: "Pago contra entrega", icon: FaMoneyBillWave, color: "from-amber-500 to-orange-600", desc: "Pagas al recibir tu pedido" },
};

export default function CheckoutPago() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pagoId = searchParams.get("pagoId");
  const pedidoId = searchParams.get("pedidoId");
  const metodo = searchParams.get("metodo") || "pse";
  const total = searchParams.get("total");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [paso, setPaso] = useState("resumen"); // resumen | procesando | aprobado
  const [telefonoNequi, setTelefonoNequi] = useState("");
  const [errorNequi, setErrorNequi] = useState(null);
  const [nequiPendiente, setNequiPendiente] = useState(false);
  const [nequiReferencia, setNequiReferencia] = useState(null);
  const [verificandoNequi, setVerificandoNequi] = useState(false);
  const [segundosNequi, setSegundosNequi] = useState(0);
  const [expiradoNequi, setExpiradoNequi] = useState(false);
  const [ultimaVerificacion, setUltimaVerificacion] = useState(null);
  // Tarjeta demo (solo si metodo tarjeta y viene de checkout sin datos previos)
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [errorTarjeta, setErrorTarjeta] = useState(null);

  const info = METODO_INFO[metodo] || METODO_INFO.pse;
  const Icon = info.icon;

  useEffect(() => {
    if (!pagoId) {
      setError("No se encontró la información del pago. Vuelve al checkout.");
    }
  }, [pagoId]);

  async function verificarEstadoNequi() {
    if (!pagoId) return;
    setVerificandoNequi(true);
    try {
      const estado = await consultarEstadoPago(pagoId);
      setUltimaVerificacion(new Date().toLocaleTimeString("es-CO"));
      if (estado.aprobado) {
        navigate(`/checkout/resultado?pagoId=${pagoId}`);
      } else if (estado.estadoPago === "expirado") {
        setError("El tiempo para completar el pago expiró. Vuelve a intentarlo o elige otro método.");
        setNequiPendiente(false);
        setExpiradoNequi(false);
      } else if (estado.estadoPago === "rechazado" || estado.estadoPago === "error" || estado.estadoPago === "voided") {
        setError("El pago fue rechazado (" + estado.estadoPago + "). Intenta de nuevo o usa otro método.");
        setNequiPendiente(false);
        setExpiradoNequi(false);
      } else {
        // PENDING: feedback visible para que el usuario sepa que el botón sí hizo algo
        setError(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerificandoNequi(false);
    }
  }

  // Polling automático cada 4s cuando Nequi está pendiente - mismo endpoint que el botón manual
  useEffect(() => {
    if (!nequiPendiente) return;
    setSegundosNequi(0);
    setExpiradoNequi(false);
    const id = setInterval(() => {
      setSegundosNequi((s) => {
        const ns = s + 4;
        if (ns >= 240) { // 4 minutos timeout razonable (spec 3-5 min)
          setExpiradoNequi(true);
          setNequiPendiente(false);
          setError("El push de Nequi expiró (sin respuesta en 4 min). Puedes reintentar con el mismo número o cambiar de método.");
          clearInterval(id);
          return ns;
        }
        return ns;
      });
      verificarEstadoNequi();
    }, 4000);
    return () => clearInterval(id);
  }, [nequiPendiente, pagoId]);

  async function handlePagarWompi() {
    if (!pagoId) return;
    if (metodo === "nequi") {
      const clean = telefonoNequi.replace(/\D/g, "");
      if (!/^\d{10}$/.test(clean) || !clean.startsWith("3")) {
        setErrorNequi("Ingresa un número Nequi válido de 10 dígitos (ej: 3001234567).");
        return;
      }
      setCargando(true);
      setError(null);
      try {
        const wompi = await iniciarPagoWompi(pagoId, clean);
        // Si la respuesta no trae URL, es flujo directo Nequi (push)
        if (!wompi.url) {
          setNequiReferencia(wompi.referencia);
          setNequiPendiente(true);
          setSegundosNequi(0);
          setExpiradoNequi(false);
          setUltimaVerificacion(null);
          setError(null);
          return;
        }
        // Fallback: si por alguna razón devolvió URL, redirigir (flujo antiguo)
        window.location.href = wompi.url;
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setCargando(false);
      }
      return;
    }
    if (metodo === "tarjeta" && pagoId) {
      if (numeroTarjeta || fechaExpiracion || cvv) {
        if (!/^\d{13,19}$/.test(numeroTarjeta)) { setErrorTarjeta("Número de tarjeta inválido (13-19 dígitos)."); return; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaExpiracion)) { setErrorTarjeta("Fecha debe ser MM/AA."); return; }
        if (!/^\d{3}$/.test(cvv)) { setErrorTarjeta("CVV debe tener 3 dígitos."); return; }
        try {
          setCargando(true);
          setError(null);
          const sim = await simularPagoTarjeta(pagoId, { numeroTarjeta, fechaExpiracion, cvv });
          if (!sim.aprobado) { setError(sim.mensaje || "Pago rechazado."); return; }
          navigate(`/checkout/resultado?pagoId=${pagoId}`);
          return;
        } catch (err) {
          setError(getErrorMessage(err));
          return;
        } finally { setCargando(false); }
      }
    }
    setCargando(true);
    setError(null);
    try {
      const wompi = await iniciarPagoWompi(pagoId);
      window.location.href = wompi.url;
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  async function handleEfectivoConfirmar() {
    navigate("/mis-pedidos");
  }

  if (!pagoId && !pedidoId) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <FaExclamationTriangle className="mx-auto mb-4 text-4xl text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pago no encontrado</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <Button className="mt-6" onClick={() => navigate("/checkout")}>Volver al checkout</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        {/* Header branded SKD */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate("/checkout")} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white">
            <FaArrowLeft /> Volver al resumen
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <FaLock /> Pago 100% seguro
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Columna principal - Pago */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${info.color} text-xl text-white shadow`}>
                  <Icon />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Métodos de pago</h1>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Procesado de forma segura por <strong>Wompi</strong> <span className="mx-1">·</span> Bancolombia</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="mt-1 text-indigo-500 dark:text-cyan-400" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 dark:text-white">Tu pago está protegido</p>
                    <p className="mt-1 text-xs leading-relaxed text-indigo-700/80 dark:text-slate-400">SKD utiliza la infraestructura certificada de Wompi (PCI-DSS, 3D Secure). Tus datos de tarjeta nunca tocan nuestros servidores; se transmiten cifrados directamente a la pasarela. No almacenamos números de tarjeta ni CVV.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Método seleccionado</h2>
                <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-indigo-400 bg-indigo-50 p-4 dark:border-cyan-400 dark:bg-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${info.color} text-white`}><Icon /></div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{info.label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{info.desc}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Seleccionado</span>
                </div>
              </div>

              {/* Formularios contextuales */}
              {metodo === "nequi" && !nequiPendiente && (
                <div className="mt-6 rounded-2xl border border-pink-200 bg-pink-50/50 p-5 dark:border-pink-500/20 dark:bg-pink-500/5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Confirma tu número Nequi</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Te enviaremos una notificación push a tu app Nequi para autorizar el pago de {total ? formatPrice(total) : "tu pedido"}. No saldrás de SKD: el cobro va directo a tu Nequi vía Wompi.</p>
                  <div className="mt-4">
                    <Input label="Número de celular Nequi" placeholder="300 123 4567" inputMode="numeric" value={telefonoNequi} onChange={(e)=>{ setTelefonoNequi(e.target.value.replace(/\D/g,"").slice(0,10)); setErrorNequi(null);}} />
                    {errorNequi && <p className="mt-2 text-xs font-medium text-red-500">{errorNequi}</p>}
                    <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">Al continuar enviaremos el push. Abre tu app Nequi y confirma en los próximos 2 minutos.</p>
                  </div>
                </div>
              )}
              {nequiPendiente && (
                <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white animate-pulse">
                    <FaMobileAlt className="text-xl" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-emerald-800 dark:text-emerald-300">¡Push enviado a Nequi!</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                    Revisa tu celular <strong>{telefonoNequi}</strong>. Abre la app Nequi y aprueba el cobro de <strong>{total ? formatPrice(total) : ""}</strong>.<br/>Ref: <span className="font-mono text-[11px]">{nequiReferencia || pagoId}</span>
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={verificarEstadoNequi} loading={verificandoNequi}>Ya aprobé, verificar pago</Button>
                    <Button size="sm" variant="ghost" onClick={()=> { setNequiPendiente(false); setSegundosNequi(0); setExpiradoNequi(false); setError(null); }}>Cambiar número</Button>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-500 dark:text-slate-400">
                    Esto se verifica automáticamente cada 4 segundos{ultimaVerificacion ? ` · último check: ${ultimaVerificacion}` : ""} · {segundosNequi}s / 240s{expiradoNequi ? " · expirado" : ""}. Una vez aprobado pasarás a producción sin volver a elegir “Nequi”.
                  </p>
                </div>
              )}

              {metodo === "pse" && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">PSE - Pagos seguros en línea</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Serás llevado a la pasarela de tu banco a través de Wompi. Elige tu banco en el siguiente paso. El pago se confirma en segundos y tu pedido pasa a producción inmediatamente.</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-slate-400">
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Compatible con todos los bancos colombianos</li>
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Confirmación inmediata</li>
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Sin comisión adicional</li>
                  </ul>
                </div>
              )}

              {metodo === "tarjeta" && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tarjeta de crédito / débito</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Ingresa los datos para simulación local, o continúa a Wompi para pago real con 3D Secure.</p>
                  <div className="mt-4 space-y-3">
                    <Input label="Número de tarjeta" placeholder="0000 0000 0000 0000" inputMode="numeric" value={numeroTarjeta} onChange={(e)=> setNumeroTarjeta(e.target.value.replace(/\D/g,"").slice(0,19))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="MM/AA" placeholder="12/28" value={fechaExpiracion} onChange={(e)=>{ let v=e.target.value.replace(/\D/g,"").slice(0,4); if(v.length>=3) v=v.slice(0,2)+"/"+v.slice(2); setFechaExpiracion(v);}} />
                      <Input label="CVV" placeholder="123" type="password" inputMode="numeric" value={cvv} onChange={(e)=> setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} />
                    </div>
                    {errorTarjeta && <p className="text-xs text-red-500">{errorTarjeta}</p>}
                    <p className="text-[11px] text-gray-400">Demo: CVV 000 = rechazado, cualquier otro aprueba. En producción se usa Wompi real.</p>
                  </div>
                </div>
              )}

              {metodo === "efectivo" && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Pago contra entrega</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">Tu pedido se prepara y lo pagas cuando te llegue. El repartidor lleva datafono y efectivo.</p>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</div>
              )}

              <div className="mt-8">
                {metodo === "efectivo" ? (
                  <Button fullWidth size="lg" onClick={handleEfectivoConfirmar}>Confirmar pedido contra entrega</Button>
                ) : nequiPendiente ? (
                  <Button fullWidth size="lg" variant="outline" loading={verificandoNequi} onClick={verificarEstadoNequi}>
                    Verificar pago en Nequi
                  </Button>
                ) : (
                  <Button fullWidth size="lg" loading={cargando} onClick={handlePagarWompi} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                    <FaLock className="mr-2" />
                    {metodo === "nequi" ? "Enviar push a mi Nequi" : metodo === "tarjeta" && (numeroTarjeta || cvv) ? "Pagar ahora" : "Continuar a pago seguro"}
                  </Button>
                )}
                <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                  <FaShieldAlt /> Transacción cifrada TLS 1.3 · Wompi by Bancolombia · SKD nunca ve tu tarjeta
                </p>
                <div className="mt-4 flex items-center justify-center gap-3 opacity-60">
                  <span className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold tracking-widest text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">VISA</span>
                  <span className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold tracking-widest text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">MASTERCARD</span>
                  <span className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold tracking-widest text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">PSE</span>
                  <span className="rounded bg-pink-500 px-2 py-1 text-[10px] font-bold text-white">nequi</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400 dark:text-slate-500">Al hacer clic aceptas nuestros <a href="/legal/terminos" className="underline">Términos</a> y <a href="/legal/privacidad" className="underline">Privacidad</a>. Soporte: hola@skdsublimacion.com</p>
          </div>

          {/* Resumen pedido */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-gray-900 dark:text-white">Resumen del pedido</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Pedido</span><span className="font-mono font-semibold text-gray-900 dark:text-white">#{pedidoId || "-"}</span></div>
                <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Pago</span><span className="font-mono text-gray-900 dark:text-white">#{pagoId || "-"}</span></div>
                <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Método</span><span className="capitalize font-medium text-gray-900 dark:text-white">{info.label}</span></div>
                {total && <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900 dark:border-slate-800 dark:text-white"><span>Total a pagar</span><span>{formatPrice(total)}</span></div>}
                {!total && <p className="border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-slate-800">El total se cargó en el paso anterior.</p>}
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">¿Por qué ves “Wompi”?</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">Wompi es la pasarela certificada que procesa el cobro. SKD mantiene tu experiencia y marca; Wompi solo gestiona el movimiento bancario de forma segura. Verás el dominio <code className="rounded bg-white px-1 py-0.5 text-[10px] dark:bg-slate-700">checkout.wompi.co</code> tras hacer clic.</p>
              </div>

              <div className="mt-6 space-y-2 text-xs text-gray-500 dark:text-slate-400">
                <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Factura electrónica inmediata</p>
                <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Soporte humano por WhatsApp</p>
                <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Entrega 2-5 días hábiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
