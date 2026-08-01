package com.skd.sublimacion_api.specification;

import com.skd.sublimacion_api.entity.Producto;

import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;

public class ProductoSpecification {

    private ProductoSpecification() {
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

}