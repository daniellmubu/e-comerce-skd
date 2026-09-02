package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.SuscripcionNewsletter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuscripcionNewsletterRepository extends JpaRepository<SuscripcionNewsletter, Long> {

    boolean existsByCorreo(String correo);
}