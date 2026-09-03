package com.skd.sublimacion_api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import com.skd.sublimacion_api.repository.UsuarioRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(TestMockConfiguration.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LoginBloqueoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void bloqueaCuentaTrasCincoIntentosFallidos() throws Exception {
        // 1. Registrar un usuario válido.
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nombre":"Bloqueable","username":"bloqueable_x","correo":"bloqueablex@skd.com","password":"123456"}
                            """))
                .andExpect(status().isOk());

        // Verificar email para que el login no falle por "no verificado" y podamos probar el bloqueo
        usuarioRepository.findByUsername("bloqueable_x").ifPresent(u -> {
            u.setVerificado(true);
            usuarioRepository.save(u);
        });

        // 2. Cinco intentos con contraseña incorrecta → 401.
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                {"username":"bloqueable_x","password":"incorrecta"}
                                """))
                    .andExpect(status().isUnauthorized());
        }

        // 3. Con la contraseña correcta ahora debe estar BLOQUEADA → 403.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"username":"bloqueable_x","password":"123456"}
                            """))
                .andExpect(status().isForbidden());
    }
}