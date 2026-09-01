package com.skd.sublimacion_api.config;

import com.skd.sublimacion_api.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        // Aprobación/rechazo de cambios de datos por parte del
                        // cliente (el token del correo es la credencial).
                        .requestMatchers("/api/usuarios/cambios/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/api/productos/**").permitAll()
                        .requestMatchers("/api/imagenes/**").permitAll()
                        .requestMatchers("/api/categorias/**").permitAll()
                        .requestMatchers("/api/caracteristicas/**").permitAll()
                        // Galería de plantillas prediseñadas del personalizador
                        // (solo lectura; la gestión se hace directo en BD).
                        .requestMatchers("/api/plantillas/**").permitAll()
                        // Galería de clientes (reseñas con foto) — social proof público.
                        .requestMatchers("/api/galeria-clientes/**").permitAll()
                        // Las reseñas por producto son públicas; crearlas exige
                        // autenticación (queda cubierta por anyRequest()).
                        .requestMatchers("/api/resenas/producto/**").permitAll()
                        // Galería pública de diseños de usuarios (solo lectura).
                        // Publicar, dar me gusta y gestionar diseños propios exigen
                        // autenticación (cubierto por anyRequest()).
                        .requestMatchers("/api/disenos/publicos/**").permitAll()
                        // Formulario de contacto público (no requiere sesión).
                        .requestMatchers("/api/contacto/**").permitAll()
                        // El enum Rol define admin, disenador y cliente (en minúsculas).
                        // getAuthorities() genera "ROLE_admin" / "ROLE_disenador" /
                        // "ROLE_cliente", por eso se usa hasRole(...) (en minúsculas)
                        // para proteger cada panel.
                        // Las solicitudes de diseño las atienden tanto el admin como el
                        // rol disenador (regla específica antes de la de /api/admin/**).
                        .requestMatchers("/api/admin/solicitudes-diseno/**").hasAnyRole("disenador", "admin")
                        .requestMatchers("/api/admin/**").hasRole("admin")
                        // Endpoints del diseñador (por si el equipo lo separa en un módulo propio).
                        .requestMatchers("/api/disenador/**").hasAnyRole("disenador", "admin")
                        // Flujo de compra y cuenta del cliente: solo clientes y admins.
                        // Un diseñador es empleado de la empresa y NO debe comprar ni
                        // gestionar carrito, pedidos, pagos, facturas, cupones, favoritos,
                        // direcciones ni referidos desde la tienda.
                        .requestMatchers(
                                "/api/carritos/**",
                                "/api/detalle-carrito/**",
                                "/api/checkout/**",
                                "/api/pedidos/**",
                                "/api/cupones/**",
                                "/api/favoritos/**",
                                "/api/direcciones/**",
                                "/api/pagos/**",
                                "/api/facturas/**",
                                "/api/referidos/**",
                                "/api/resenas/**"
                        ).hasAnyRole("admin", "cliente")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}