import { useCallback, useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaSearch,
  FaTicketAlt,
  FaCheckCircle,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import Toggle from "../components/Toggle";
import { getErrorMessage } from "../api/axios";
import {
  listarCupones,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
  asignarCupon,
} from "../api/cuponesApi";
import { formatFecha } from "../utils/formato";

const FORM_VACIO = {
  codigo: "",
  descuentoPorcentaje: "",
  fechaInicio: "",
  fechaFin: "",
  usosMaximos: "",
  activo: true,
  esUnicoPorUsuario: false,
};

function Cupones() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [filtros, setFiltros] = useState({ codigo: "", activo: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ codigo: "", activo: "" });

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);

  // Modal asignar
  const [asignando, setAsignando] = useState(null);
  const [modoAsignacion, setModoAsignacion] = useState("todos");
  const [usuarioAsignarId, setUsuarioAsignarId] = useState("");
  const [resultadoAsignacion, setResultadoAsignacion] = useState(null);
  const [asignandoLoading, setAsignandoLoading] = useState(false);
  const [asignarError, setAsignarError] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtrosActuales = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarCupones({
          page: pagina,
          size: tamanio,
          codigo: filtrosActuales.codigo.trim() || undefined,
          activo:
            filtrosActuales.activo === "" ? undefined : filtrosActuales.activo === "true",
        });
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size, filtrosAplicados]
  );

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros);
    setPage(0);
  };

  const limpiarFiltros = () => {
    setFiltros({ codigo: "", activo: "" });
    setFiltrosAplicados({ codigo: "", activo: "" });
    setPage(0);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (cupon) => {
    setEditando(cupon);
    setForm({
      codigo: cupon.codigo || "",
      descuentoPorcentaje: cupon.descuentoPorcentaje ?? "",
      fechaInicio: cupon.fechaInicio || "",
      fechaFin: cupon.fechaFin || "",
      usosMaximos: cupon.usosMaximos ?? "",
      activo: cupon.activo ?? true,
      esUnicoPorUsuario: cupon.esUnicoPorUsuario ?? false,
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const descuento = Number(form.descuentoPorcentaje);
    const usos = Number(form.usosMaximos);

    if (!form.codigo.trim()) {
      setFormError("El código es obligatorio");
      return;
    }
    if (!form.descuentoPorcentaje || descuento < 1 || descuento > 100) {
      setFormError("El descuento debe estar entre 1 y 100");
      return;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      setFormError("Las fechas de inicio y fin son obligatorias");
      return;
    }
    if (form.fechaFin < form.fechaInicio) {
      setFormError("La fecha de fin no puede ser anterior a la de inicio");
      return;
    }
    if (usos < 0) {
      setFormError("Los usos máximos no pueden ser negativos");
      return;
    }

    const payload = {
      codigo: form.codigo.trim(),
      descuentoPorcentaje: descuento,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      usosMaximos: usos,
      activo: form.activo,
      esUnicoPorUsuario: form.esUnicoPorUsuario,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarCupon(editando.id, payload);
      } else {
        await crearCupon(payload);
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const abrirAsignar = (cupon) => {
    setAsignando(cupon);
    setModoAsignacion("todos");
    setUsuarioAsignarId("");
    setResultadoAsignacion(null);
    setAsignarError(null);
  };

  const ejecutarAsignacion = async () => {
    const asignarATodos = modoAsignacion === "todos";
    const usuarioId = asignarATodos ? null : Number(usuarioAsignarId);

    if (!asignarATodos && !usuarioAsignarId) {
      setAsignarError("Ingresa el ID del usuario a asignar");
      return;
    }

    setAsignandoLoading(true);
    setAsignarError(null);
    setResultadoAsignacion(null);
    try {
      const resultado = await asignarCupon(asignando.id, {
        usuarioId,
        asignarATodos,
      });
      setResultadoAsignacion(resultado);
    } catch (err) {
      setAsignarError(getErrorMessage(err));
    } finally {
      setAsignandoLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarCupon(eliminando.id);
      setEliminando(null);
      cargar();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const cupones = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cupones
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestiona los cupones de descuento y su asignación.
          </p>
        </div>
        <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
          Nuevo cupón
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          placeholder="Buscar por código..."
          icon={<FaSearch />}
          value={filtros.codigo}
          onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
        <Select
          placeholder="Todos los estados"
          options={[
            { value: "true", label: "Activos" },
            { value: "false", label: "Inactivos" },
          ]}
          value={filtros.activo}
          onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
        />
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={aplicarFiltros} leftIcon={<FaSearch />}>
            Buscar
          </Button>
          <Button variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando cupones..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : cupones.length === 0 ? (
        <EmptyState
          icon={<FaTicketAlt />}
          title="No hay cupones"
          description="Crea el primer cupón de descuento."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Descuento</th>
                  <th className="hidden px-6 py-4 md:table-cell">Vigencia</th>
                  <th className="hidden px-6 py-4 md:table-cell">Usos</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {cupones.map((cupon) => (
                  <tr
                    key={cupon.id}
                    className={`transition hover:bg-gray-50 dark:hover:bg-slate-800/40 ${
                      !cupon.activo ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{cupon.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono font-semibold text-gray-900 dark:text-white">
                        {cupon.codigo}
                      </p>
                      {cupon.esUnicoPorUsuario && (
                        <Badge variant="purple" className="mt-1">
                          Único por usuario
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {cupon.descuentoPorcentaje}%
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {formatFecha(cupon.fechaInicio)} → {formatFecha(cupon.fechaFin)}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 dark:text-slate-300 md:table-cell">
                      {cupon.usosActuales} / {cupon.usosMaximos ?? "∞"}
                    </td>
                    <td className="px-6 py-4">
                      {cupon.activo ? (
                        <Badge variant="green">Activo</Badge>
                      ) : (
                        <Badge variant="red">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(cupon)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => abrirAsignar(cupon)}
                          leftIcon={<FaUsers />}
                        >
                          Asignar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(cupon)}
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
        title={editando ? `Editar cupón #${editando.id}` : "Nuevo cupón"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-cupon"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear cupón"}
            </Button>
          </>
        }
      >
        <form id="form-cupon" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Código"
              placeholder="Ej. BIENVENIDA10"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
            <Input
              label="Descuento (%)"
              type="number"
              min="1"
              max="100"
              placeholder="10"
              value={form.descuentoPorcentaje}
              onChange={(e) =>
                setForm({ ...form, descuentoPorcentaje: e.target.value })
              }
            />
            <Input
              label="Fecha de inicio"
              type="date"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
            <Input
              label="Usos máximos (vacío = ilimitado)"
              type="number"
              min="0"
              placeholder="100"
              value={form.usosMaximos}
              onChange={(e) => setForm({ ...form, usosMaximos: e.target.value })}
            />
          </div>

          <div className="grid gap-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700 sm:grid-cols-2">
            <Toggle
              label="Activo"
              description="Disponible para canjear"
              checked={form.activo}
              onChange={(valor) => setForm({ ...form, activo: valor })}
            />
            <Toggle
              label="Único por usuario"
              description="Solo se puede usar una vez por cliente"
              checked={form.esUnicoPorUsuario}
              onChange={(valor) => setForm({ ...form, esUnicoPorUsuario: valor })}
            />
          </div>

          {formError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Modal asignar */}
      <Modal
        isOpen={!!asignando}
        onClose={() => setAsignando(null)}
        title={`Asignar cupón ${asignando?.codigo ?? ""}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAsignando(null)}>
              Cerrar
            </Button>
            <Button
              onClick={ejecutarAsignacion}
              loading={asignandoLoading}
              leftIcon={<FaUsers />}
            >
              Asignar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Toggle
            label="Asignar a todos los clientes"
            description="Crea la asignación en cada usuario con rol cliente"
            checked={modoAsignacion === "todos"}
            onChange={(valor) =>
              setModoAsignacion(valor ? "todos" : "usuario")
            }
          />

          {modoAsignacion === "usuario" && (
            <Input
              label="ID del usuario"
              type="number"
              placeholder="Ej. 7"
              value={usuarioAsignarId}
              onChange={(e) => setUsuarioAsignarId(e.target.value)}
            />
          )}

          {asignarError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {asignarError}
            </p>
          )}

          {resultadoAsignacion && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              <FaCheckCircle />
              <span>
                Asignados: {resultadoAsignacion.asignados} · Ya asignados:{" "}
                {resultadoAsignacion.yaAsignados}
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar cupón"
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
          ¿Seguro que deseas eliminar el cupón{" "}
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            {eliminando?.codigo}
          </span>
          ? Se eliminará de forma permanente.
        </p>
      </Modal>
    </div>
  );
}

export default Cupones;
