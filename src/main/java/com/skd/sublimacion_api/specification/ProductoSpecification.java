package com.skd.sublimacion_api.specification;

import com.skd.sublimacion_api.entity.Producto;
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

}