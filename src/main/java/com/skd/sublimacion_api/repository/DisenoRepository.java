package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.EstadoPublicacionDiseno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DisenoRepository extends JpaRepository<Diseno, Long> {
    List<Diseno> findByUsuarioId(Long usuarioId);

    long countByUsuarioIdAndCreatedAtAfter(Long usuarioId, LocalDateTime desde);

    // ---- Publicación pública (galería de diseños) ----

    long countByEstadoPublicacion(EstadoPublicacionDiseno estado);

    Page<Diseno> findByEstadoPublicacion(EstadoPublicacionDiseno estado, Pageable pageable);

    Page<Diseno> findByTituloContainingIgnoreCase(String titulo, Pageable pageable);

    Page<Diseno> findByEstadoPublicacionAndTituloContainingIgnoreCase(
            EstadoPublicacionDiseno estado, String titulo, Pageable pageable);

    // Todos los diseños que el usuario envió a moderación (para mostrarlos en "Mis diseños").
    List<Diseno> findByUsuarioIdAndEstadoPublicacionIsNotNull(Long usuarioId);

    // ---- Popularidad ----

    // Diseños publicados ordenados por número de "me gusta" (descendente).
    @Query("""
            select d from Diseno d
            where d.estadoPublicacion = :estado
            order by (select count(m) from DisenoMeGusta m where m.diseno = d) desc
            """)
    List<Diseno> findTopByMeGusta(@Param("estado") EstadoPublicacionDiseno estado, Pageable pageable);

    // Diseños publicados ordenados por número de usos (descendente).
    List<Diseno> findByEstadoPublicacionOrderByVecesUsadoDesc(
            EstadoPublicacionDiseno estado, Pageable pageable);

    // Consulta con subconsulta para paginar la galería ordenada por me gusta.
    @Query(value = """
            select d from Diseno d
            where d.estadoPublicacion = :estado
            order by (select count(m) from DisenoMeGusta m where m.diseno = d) desc
            """,
            countQuery = """
            select count(d) from Diseno d
            where d.estadoPublicacion = :estado
            """)
    Page<Diseno> listarPublicosPorMeGusta(
            @Param("estado") EstadoPublicacionDiseno estado, Pageable pageable);

    // Consulta con subconsulta para paginar la galería ordenada por usos.
    @Query(value = """
            select d from Diseno d
            where d.estadoPublicacion = :estado
            order by d.vecesUsado desc
            """,
            countQuery = """
            select count(d) from Diseno d
            where d.estadoPublicacion = :estado
            """)
    Page<Diseno> listarPublicosPorUsos(
            @Param("estado") EstadoPublicacionDiseno estado, Pageable pageable);
}
