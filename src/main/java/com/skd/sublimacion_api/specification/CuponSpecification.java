package com.skd.sublimacion_api.specification;

import com.skd.sublimacion_api.entity.Cupon;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class CuponSpecification {

    public static Specification<Cupon> codigoContiene(String codigo) {

        return (root, query, criteriaBuilder) -> {

            if (codigo == null || codigo.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.like(
                    criteriaBuilder.upper(root.get("codigo")),
                    "%" + codigo.toUpperCase() + "%");
        };
    }

    public static Specification<Cupon> activoEs(Boolean activo) {

        return (root, query, criteriaBuilder) -> {

            if (activo == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(root.get("activo"), activo);
        };
    }

    public static Specification<Cupon> fechaInicioDesde(LocalDate fechaInicio) {

        return (root, query, criteriaBuilder) -> {

            if (fechaInicio == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.greaterThanOrEqualTo(
                    root.get("fechaInicio"),
                    fechaInicio);
        };
    }

    public static Specification<Cupon> fechaFinHasta(LocalDate fechaFin) {

        return (root, query, criteriaBuilder) -> {

            if (fechaFin == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.lessThanOrEqualTo(
                    root.get("fechaFin"),
                    fechaFin);
        };
    }

}