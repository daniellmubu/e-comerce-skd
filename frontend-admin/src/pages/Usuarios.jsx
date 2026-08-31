import { useCallback, useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaUserLock,
  FaUnlock,
  FaSearch,
  FaUsers,
  FaEnvelope,
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
import { getErrorMessage } from "../api/axios";
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  bloquearUsuario,
  desbloquearUsuario,
} from "../api/usuariosApi";
import { useAuth } from "../context/AuthContext";

const FORM_VACIO = {
  nombre: "",
  username: "",
  correo: "",
  telefono: "",
  rol: "cliente",
  contrasena: "",
};

const FILTROS_INICIALES = {
  search: "",
  username: "",
  correo: "",
  rol: "",
  bloqueado: "",
  verificado: "",
};

const ROL_VARIANT = {
  admin: "violet",
  disenador: "amber",
  cliente: "cyan",
};

function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const miId = usuarioActual?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtrosActuales = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarUsuarios({
          page: pagina,
          size: tamanio,
          nombre: filtrosActuales.search.trim() || undefined,
          username: filtrosActuales.username.trim() || undefined,
          correo: filtrosActuales.correo.trim() || undefined,
          rol: filtrosActuales.rol || undefined,
          bloqueado:
            filtrosActuales.bloqueado === ""
              ? undefined
              : filtrosActuales.bloqueado === "true",
          verificado:
            filtrosActuales.verificado === ""
              ? undefined
              : filtrosActuales.verificado === "true",
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
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
    setPage(0);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setInfoMessage(null);
    setModalAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setForm({
      nombre: usuario.nombre || "",
      username: usuario.username || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
      rol: usuario.rol || "cliente",
      contrasena: "",
    });
    setFormError(null);
    setInfoMessage(null);
    setModalAbierto(true);
  };

  const esMiPerfil = (usuario) => usuario.id === miId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (!form.username.trim()) {
      setFormError("El username es obligatorio");
      return;
    }
    if (!form.correo.trim()) {
      setFormError("El correo es obligatorio");
      return;
    }
    // Al crear la contraseña es obligatoria; al editar es opcional.
    if (!editando && !form.contrasena) {
      setFormError("La contraseña es obligatoria al crear un usuario");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      username: form.username.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      rol: form.rol,
      contrasena: form.contrasena,
    };

    setGuardando(true);
    setFormError(null);
    try {
      if (editando) {
        await actualizarUsuario(editando.id, payload);
      } else {
        await crearUsuario(payload);
      }
      setModalAbierto(false);
      cargar();
      setInfoMessage(
        editando
          ? "Se envió una solicitud de aprobación al correo del usuario. El cambio se aplicará solo cuando el cliente lo confirme."
          : "Usuario creado correctamente."
      );
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const alternarBloqueo = async (usuario) => {
    try {
      if (usuario.bloqueado) {
        await desbloquearUsuario(usuario.id);
      } else {
        await bloquearUsuario(usuario.id);
      }
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const usuarios = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Administra los usuarios de la plataforma.
          </p>
        </div>
        <Button onClick={abrirCrear} leftIcon={<FaPlus />}>
          Nuevo usuario
        </Button>
      </div>

      {/* Mensaje de éxito / solicitud enviada */}
      {infoMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
          <FaCheckCircle className="mt-0.5 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-2 xl:grid-cols-6">
        <Input
          placeholder="Buscar por nombre..."
          icon={<FaSearch />}
          value={filtros.search}
          onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
        <Input
          placeholder="Username"
          value={filtros.username}
          onChange={(e) => setFiltros({ ...filtros, username: e.target.value })}
        />
        <Input
          placeholder="Correo"
          value={filtros.correo}
          onChange={(e) => setFiltros({ ...filtros, correo: e.target.value })}
        />
        <Select
          placeholder="Todos los roles"
          options={[
            { value: "admin", label: "Admin" },
            { value: "disenador", label: "Diseñador" },
            { value: "cliente", label: "Cliente" },
          ]}
          value={filtros.rol}
          onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
        />
        <Select
          placeholder="Estado de bloqueo"
          options={[
            { value: "true", label: "Bloqueados" },
            { value: "false", label: "Activos" },
          ]}
          value={filtros.bloqueado}
          onChange={(e) => setFiltros({ ...filtros, bloqueado: e.target.value })}
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
          <Loading label="Cargando usuarios..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title="No hay usuarios"
          description="Prueba con otros filtros o crea un nuevo usuario."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="hidden px-6 py-4 md:table-cell">Correo</th>
                  <th className="hidden px-6 py-4 md:table-cell">Teléfono</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="hidden px-6 py-4 md:table-cell">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {usuarios.map((usuario) => {
                  const esYo = esMiPerfil(usuario);
                  return (
                    <tr
                      key={usuario.id}
                      className={`transition hover:bg-gray-50 dark:hover:bg-slate-800/40 ${
                        usuario.bloqueado ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        #{usuario.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {usuario.nombre}
                          {esYo && (
                            <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-cyan-400">
                              (tú)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          @{usuario.username}
                        </p>
                      </td>
                      <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                        {usuario.correo}
                      </td>
                      <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                        {usuario.telefono || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={ROL_VARIANT[usuario.rol] || "slate"}>
                          {usuario.rol}
                        </Badge>
                      </td>
                      <td className="hidden px-6 py-4 md:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {usuario.verificado ? (
                            <Badge variant="green">Verificado</Badge>
                          ) : (
                            <Badge variant="slate">No verificado</Badge>
                          )}
                          {usuario.bloqueado && (
                            <Badge variant="red">Bloqueado</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEditar(usuario)}
                            leftIcon={<FaEdit />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant={usuario.bloqueado ? "success" : "danger"}
                            size="sm"
                            onClick={() => alternarBloqueo(usuario)}
                            disabled={esYo}
                            title={
                              esYo
                                ? "No puedes bloquear tu propia cuenta"
                                : usuario.bloqueado
                                ? "Desbloquear"
                                : "Bloquear"
                            }
                            leftIcon={
                              usuario.bloqueado ? <FaUnlock /> : <FaUserLock />
                            }
                          >
                            {usuario.bloqueado ? "Desbloquear" : "Bloquear"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        title={editando ? `Editar usuario #${editando.id}` : "Nuevo usuario"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-usuario"
              loading={guardando}
              leftIcon={editando ? <FaEnvelope /> : <FaPlus />}
            >
              {editando ? "Solicitar cambio" : "Crear usuario"}
            </Button>
          </>
        }
      >
        <form id="form-usuario" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Input
              label="Username"
              placeholder="Nombre de usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <Input
              label="Correo"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
            <Input
              label="Teléfono"
              placeholder="3001234567"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>

          {!editando && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Rol"
                options={[
                  { value: "cliente", label: "Cliente" },
                  { value: "disenador", label: "Diseñador" },
                  { value: "admin", label: "Administrador" },
                ]}
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
              />
            </div>
          )}
          {editando && (
            <p className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              El rol y la contraseña no se cambian desde el panel por seguridad.
              El rol se asigna al crear el usuario y la contraseña la restablece
              el propio usuario con "¿Olvidaste tu contraseña?".
            </p>
          )}

          {editando && (
            <p className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
              Al guardar se enviará un correo al usuario con un enlace para
              aprobar o rechazar el cambio. Ningún dato se modifica hasta que el
              cliente lo confirme.
            </p>
          )}

          {formError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default Usuarios;
