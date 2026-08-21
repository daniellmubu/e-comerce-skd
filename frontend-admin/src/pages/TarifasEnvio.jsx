import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTruck } from "react-icons/fa";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { getErrorMessage } from "../api/axios";
import {
  listarTarifasEnvio,
  crearTarifaEnvio,
  actualizarTarifaEnvio,
  eliminarTarifaEnvio,
} from "../api/tarifasEnvioApi";
import { formatPrice } from "../utils/formato";

const FORM_VACIO = { departamento: "", costoBase: "", diasEstimados: "" };

function TarifasEnvio() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtro = busquedaAplicada) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarTarifasEnvio({
          page: pagina,
          size: tamanio,
          departamento: filtro.trim() || undefined,
        });
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size, busquedaAplicada]
  );

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const aplicarBusqueda = () => {
    setBusquedaAplicada(busqueda);
    setPage(0);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setPage(0);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (tarifa) => {
    setEditando(tarifa);
    setForm({
      departamento: tarifa.departamento || "",
      costoBase: tarifa.costoBase ?? "",
      diasEstimados: tarifa.diasEstimados ?? "",
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const costo = Number(form.costoBase);
    const dias = Number(form.diasEstimados);

    if (!form.departamento.trim()) {
      setFormError("El departamento es obligatorio");
      return;
    }
    if (!form.costoBase || costo < 0) {
      setFormError("Ingresa un costo base válido (mayor o igual a 0)");
      return;
    }
    if (!form.diasEstimados || dias < 1) {
      setFormError("Los días estimados deben ser al menos 1");
      return;
    }

    const payload = {
      departamento: form.departamento.trim(),
      costoBase: costo,
      diasEstimados: dias,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarTarifaEnvio(editando.id, payload);
      } else {
        await crearTarifaEnvio(payload);
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarTarifaEnvio(eliminando.id);
      setEliminando(null);
      cargar();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const tarifas = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tarifas de envío
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Costo y días estimados de entrega por departamento.
          </p>
        </div>
        <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
          Nueva tarifa
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          placeholder="Buscar por departamento..."
          icon={<FaSearch />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicarBusqueda()}
        />
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={aplicarBusqueda} leftIcon={<FaSearch />}>
            Buscar
          </Button>
          <Button variant="outline" onClick={limpiarBusqueda}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando tarifas..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : tarifas.length === 0 ? (
        <EmptyState
          icon={<FaTruck />}
          title="No hay tarifas de envío"
          description="Crea la primera tarifa por departamento."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Departamento</th>
                  <th className="px-6 py-4">Costo base</th>
                  <th className="px-6 py-4">Días estimados</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {tarifas.map((tarifa) => (
                  <tr
                    key={tarifa.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{tarifa.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {tarifa.departamento}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(tarifa.costoBase)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {tarifa.diasEstimados} días
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(tarifa)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(tarifa)}
                          leftIcon={<FaTrash />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 dark:border-slate-800">
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={data.size}
              onPageChange={setPage}
              onPageSizeChange={(nuevoSize) => {
                setSize(nuevoSize);
                setPage(0);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? `Editar tarifa #${editando.id}` : "Nueva tarifa"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-tarifa"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear tarifa"}
            </Button>
          </>
        }
      >
        <form id="form-tarifa" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Departamento"
            placeholder="Ej. Tolima"
            value={form.departamento}
            onChange={(e) => setForm({ ...form, departamento: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Costo base (COP)"
              type="number"
              min="0"
              step="0.01"
              placeholder="12000"
              value={form.costoBase}
              onChange={(e) => setForm({ ...form, costoBase: e.target.value })}
            />
            <Input
              label="Días estimados de entrega"
              type="number"
              min="1"
              step="1"
              placeholder="3"
              value={form.diasEstimados}
              onChange={(e) => setForm({ ...form, diasEstimados: e.target.value })}
            />
          </div>
          {formError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar tarifa"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEliminando(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminandoLoading}
              onClick={confirmarEliminar}
              leftIcon={<FaTrash />}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que deseas eliminar la tarifa de envío del departamento{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {eliminando?.departamento}
          </span>
          ?
        </p>
      </Modal>
    </div>
  );
}

export default TarifasEnvio;
