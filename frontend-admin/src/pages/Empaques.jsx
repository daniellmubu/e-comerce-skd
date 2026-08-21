import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox } from "react-icons/fa";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { getErrorMessage } from "../api/axios";
import {
  listarEmpaques,
  crearEmpaque,
  actualizarEmpaque,
  eliminarEmpaque,
} from "../api/empaquesApi";
import { formatPrice } from "../utils/formato";

const FORM_VACIO = { tipo: "", descripcion: "", costoAdicional: "" };

function Empaques() {
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
        const resultado = await listarEmpaques({
          page: pagina,
          size: tamanio,
          tipo: filtro.trim() || undefined,
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

  const abrirEditar = (empaque) => {
    setEditando(empaque);
    setForm({
      tipo: empaque.tipo || "",
      descripcion: empaque.descripcion || "",
      costoAdicional: empaque.costoAdicional ?? "",
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo.trim()) {
      setFormError("El tipo de empaque es obligatorio");
      return;
    }
    if (form.costoAdicional && Number(form.costoAdicional) < 0) {
      setFormError("El costo adicional no puede ser negativo");
      return;
    }

    const payload = {
      tipo: form.tipo.trim(),
      descripcion: form.descripcion.trim(),
      costoAdicional: form.costoAdicional
        ? Number(form.costoAdicional)
        : null,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarEmpaque(editando.id, payload);
      } else {
        await crearEmpaque(payload);
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
      await eliminarEmpaque(eliminando.id);
      setEliminando(null);
      cargar();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const empaques = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Empaques
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestiona las opciones de empaque.
          </p>
        </div>
        <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
          Nuevo empaque
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          placeholder="Buscar por tipo..."
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
          <Loading label="Cargando empaques..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : empaques.length === 0 ? (
        <EmptyState
          icon={<FaBox />}
          title="No hay empaques"
          description="Crea la primera opción de empaque."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="hidden px-6 py-4 md:table-cell">Descripción</th>
                  <th className="px-6 py-4">Costo adicional</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {empaques.map((empaque) => (
                  <tr
                    key={empaque.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{empaque.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {empaque.tipo}
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {empaque.descripcion || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(empaque.costoAdicional)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(empaque)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(empaque)}
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
        title={editando ? `Editar empaque #${editando.id}` : "Nuevo empaque"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-empaque"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear empaque"}
            </Button>
          </>
        }
      >
        <form id="form-empaque" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tipo"
            placeholder="Ej. Premium"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          />
          <Input
            label="Descripción"
            placeholder="Descripción del empaque"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <Input
            label="Costo adicional (COP, opcional)"
            type="number"
            min="0"
            step="0.01"
            placeholder="5000"
            value={form.costoAdicional}
            onChange={(e) => setForm({ ...form, costoAdicional: e.target.value })}
          />
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
        title="Eliminar empaque"
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
          ¿Seguro que deseas eliminar el empaque{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {eliminando?.tipo}
          </span>
          ? El backend lo rechazará si tiene pedidos asociados.
        </p>
      </Modal>
    </div>
  );
}

export default Empaques;
