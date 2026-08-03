package com.skd.sublimacion_api.specification;

import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.entity.Usuario;
import org.springframework.data.jpa.domain.Specification;

public class UsuarioSpecification {

    public static Specification<Usuario> nombreContiene(String nombre) {
        return (root, query, cb) -> {

            if (nombre == null || nombre.isBlank()) {
                return null;
            }

            return cb.like(
                    cb.lower(root.get("nombre")),
                    "%" + nombre.toLowerCase() + "%");
        };
    }

    public static Specification<Usuario> usernameContiene(String username) {
        return (root, query, cb) -> {

            if (username == null || username.isBlank()) {
                return null;
            }

            return cb.like(
                    cb.lower(root.get("username")),
                    "%" + username.toLowerCase() + "%");
        };
    }

    public static Specification<Usuario> correoContiene(String correo) {
        return (root, query, cb) -> {

            if (correo == null || correo.isBlank()) {
                return null;
            }

            return cb.like(
                    cb.lower(root.get("correo")),
                    "%" + correo.toLowerCase() + "%");
        };
    }

    public static Specification<Usuario> rolEs(Rol rol) {
        return (root, query, cb) -> {

            if (rol == null) {
                return null;
            }

            return cb.equal(root.get("rol"), rol);
        };
    }

    public static Specification<Usuario> bloqueadoEs(Boolean bloqueado) {
        return (root, query, cb) -> {

            if (bloqueado == null) {
                return null;
            }

            return cb.equal(root.get("bloqueado"), bloqueado);
        };
    }

    public static Specification<Usuario> verificadoEs(Boolean verificado) {
        return (root, query, cb) -> {

            if (verificado == null) {
                return null;
            }

            return cb.equal(root.get("verificado"), verificado);
        };
    }

}