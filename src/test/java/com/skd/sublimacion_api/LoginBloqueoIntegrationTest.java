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

import com.skd.sublimacion_api.repository.RegistroCodigoRepository;
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

    @Autowired
    private RegistroCodigoRepository registroCodigoRepository;

    @Test
    void bloqueaCuentaTrasCincoIntentosFallidos() throws Exception {
        // 0. Solicitar código de verificación
        String correo = "bloqueablex@skd.com";
        mockMvc.perform(post("/api/auth/enviar-codigo-registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\"}"))
                .andExpect(status().isOk());

        String codigo = registroCodigoRepository
                .findTopByCorreoOrderByCreadoEnDesc(correo)
                .orElseThrow().getCodigo();

        // 1. Registrar un usuario válido (ya nace verificado).
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nombre":"Bloqueable","username":"bloqueable_x","correo":"bloqueablex@skd.com","password":"123456","codigo":"CODIGO"}
                            """.replace("CODIGO", codigo)))
                .andExpect(status().isOk());

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