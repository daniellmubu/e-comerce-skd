package com.skd.sublimacion_api.specification;

import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Resena;

import java.math.BigDecimal;

import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import org.springframework.data.jpa.domain.Specification;

public class ProductoSpecification {

    private ProductoSpecification() {
    }

    // Búsqueda libre: coincide en nombre O descripción, sin distinguir mayúsculas.
    public static Specification<Producto> textoContiene(String texto) {

        return (root, query, criteriaBuilder) -> {

            if (texto == null || texto.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String patron = "%" + texto.toLowerCase() + "%";

            return criteriaBuilder.or(
                    criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("nombre")),
                            patron),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("descripcion")),
                            patron)
            );

        };

    }

    public static Specification<Producto> nombreContiene(String nombre) {

        return (root, query, criteriaBuilder) -> {

            if (nombre == null || nombre.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("nombre")),
                    "%" + nombre.toLowerCase() + "%"
            );

        };
    
    }

    public static Specification<Producto> categoriaEs(Long categoriaId) {

        return (root, query, criteriaBuilder) -> {

            if (categoriaId == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("categoria").get("id"),
                    categoriaId
            );

        };

    }

    public static Specification<Producto> activoEs(Boolean activo) {

        return (root, query, criteriaBuilder) -> {

            if (activo == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("activo"),
                    activo
            );

        };

    }

    public static Specification<Producto> precioMayorIgual(BigDecimal precioMin) {

        return (root, query, criteriaBuilder) -> {

            if (precioMin == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.greaterThanOrEqualTo(
                    root.get("precio"),
                    precioMin
            );

        };

    }

    public static Specification<Producto> precioMenorIgual(BigDecimal precioMax) {

        return (root, query, criteriaBuilder) -> {

            if (precioMax == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.lessThanOrEqualTo(
                    root.get("precio"),
                    precioMax
            );
        };

    }

    // Solo productos cuyo promedio de reseñas alcanza la mínima.
    // El promedio se calcula al vuelo (no está en la tabla producto), así que
    // se filtra con una subconsulta correlacionada: solo entran los productos
    // cuyas reseñas agrupadas superan el umbral (los sin reseñas quedan fuera).
    public static Specification<Producto> calificacionMinimaEs(Double minima) {

        return (root, query, criteriaBuilder) -> {

            if (minima == null) {
                return criteriaBuilder.conjunction();
            }

            Subquery<Long> subquery = query.subquery(Long.class);
            Root<Resena> resena = subquery.from(Resena.class);

            subquery.select(criteriaBuilder.count(resena.get("id")));
            subquery.where(criteriaBuilder.equal(
                    resena.get("producto").get("id"),
                    root.get("id")));
            subquery.groupBy(resena.get("producto").get("id"));
            subquery.having(criteriaBuilder.greaterThanOrEqualTo(
                    criteriaBuilder.avg(resena.get("calificacion")),
                    minima));

            return criteriaBuilder.exists(subquery);
        };

    }

}