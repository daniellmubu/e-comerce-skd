import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

import { consultarEstadoPago } from "../services/pagoService";
import { getErrorMessage } from "../services/api";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";

function CheckoutResultado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pagoId = searchParams.get("pagoId");

  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function verificar() {
    if (!pagoId) {
      setError("No se recibió el identificador del pago.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await consultarEstadoPago(pagoId);
      setEstado(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verificar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <Loading label="Verificando el pago..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
          <FaTimesCircle className="mx-auto mb-6 text-5xl text-red-400" />
          <h1 className="text-2xl font-bold">No pudimos verificar el pago</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="outline" onClick={verificar}>
              Reintentar
            </Button>
            <Button onClick={() => navigate("/mis-pedidos")}>
              Ver mis pedidos
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (estado?.aprobado) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
          <FaCheckCircle className="mx-auto mb-6 text-5xl text-emerald-400" />
          <h1 className="text-3xl font-bold">¡Pago aprobado!</h1>
          <p className="mt-2 text-slate-400">{estado.mensaje}</p>
          <Button
            fullWidth
            className="mt-8"
            onClick={() => navigate("/mis-pedidos")}
          >
            Ver mis pedidos
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
        <FaSpinner className="mx-auto mb-6 text-5xl text-amber-400" />
        <h1 className="text-2xl font-bold">Pago pendiente</h1>
        <p className="mt-2 text-slate-400">
          Aún no se confirma el pago. Puedes intentar de nuevo o volver más
          tarde.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="outline" onClick={verificar}>
            Verificar de nuevo
          </Button>
          <Button onClick={() => navigate("/mis-pedidos")}>
            Ver mis pedidos
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CheckoutResultado;
