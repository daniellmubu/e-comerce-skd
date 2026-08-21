import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaTags } from "react-icons/fa";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import { getErrorMessage } from "../api/axios";
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../api/categoriasApi";

const FORM_VACIO = { nombre: "", descripcion: "", categoriaPadreId: "" };

function Categorias() {
  const [data, setData] = useState(null);
  const [todas, setTodas] = useState([]); // listado completo (mapa de nombres + select de padre)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  // Carga todo el listado (size amplio) para resolver el nombre del padre
  // en la tabla y llenar el select de categoría padre.
  const cargarTodas = useCallback(async () => {
    try {
      const resultado = await listarCategorias(0, 100);
      setTodas(resultado?.content ?? []);
    } catch {
      setTodas([]);
    }
  }, []);

  const cargar = useCallback(
    async (pagina = page, tamanio = size) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarCategorias(pagina, tamanio);
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size]
  );

  useEffect(() => {
    cargarTodas();
  }, [cargarTodas]);

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const mapaNombres = new Map(todas.map((c) => [c.id, c.nombre]));

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (categoria) => {
    setEditando(categoria);
    setForm({
      nombre: categoria.nombre || "",
      descripcion: categoria.descripcion || "",
      categoriaPadreId: categoria.categoriaPadreId ?? "",
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      categoriaPadreId: form.categoriaPadreId ? Number(form.categoriaPadreId) : null,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarCategoria(editando.id, payload);
      } else {
        await crearCategoria(payload);
      }
      setModalAbierto(false);
      cargar();
      cargarTodas();
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
      await eliminarCategoria(eliminando.id);
      setEliminando(null);
      cargar();
      cargarTodas();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const categorias = data?.content ?? [];

  // Select de padre: todas excepto la categoría que se está editando.
  const opcionesPadre = todas
    .filter((c) => c.id !== editando?.id)
    .map((c) => ({ value: c.id, label: c.nombre }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestiona las categorías del catálogo.
          </p>
        </div>
        <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
          Nueva categoría
        </Button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando categorías..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState
          icon={<FaTags />}
          title="No hay categorías"
          description="Crea la primera categoría del catálogo."
        >
          <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
            Nueva categoría
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="hidden px-6 py-4 md:table-cell">Descripción</th>
                  <th className="hidden px-6 py-4 md:table-cell">Categoría padre</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {categorias.map((categoria) => (
                  <tr
                    key={categoria.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{categoria.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {categoria.nombre}
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {categoria.descripcion || "—"}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {categoria.categoriaPadreId
                        ? mapaNombres.get(categoria.categoriaPadreId) ||
                          `#${categoria.categoriaPadreId}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(categoria)}
                          leftIcon={<FaEdit />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(categoria)}
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
        title={editando ? `Editar categoría #${editando.id}` : "Nueva categoría"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-categoria"
              loading={guardando}
              leftIcon={<FaPlus />}
            >
              {editando ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </>
        }
      >
        <form id="form-categoria" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Camisetas"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Input
            label="Descripción"
            placeholder="Descripción de la categoría"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <Select
            label="Categoría padre (opcional)"
            placeholder="Sin categoría padre"
            options={opcionesPadre}
            value={form.categoriaPadreId}
            onChange={(e) =>
              setForm({ ...form, categoriaPadreId: e.target.value })
            }
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
        title="Eliminar categoría"
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
          ¿Seguro que deseas eliminar la categoría{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {eliminando?.nombre}
          </span>
          ? El backend la rechazará si tiene subcategorías o productos asociados.
        </p>
      </Modal>
    </div>
  );
}

export default Categorias;
