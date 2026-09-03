package com.skd.sublimacion_api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skd.sublimacion_api.repository.RegistroCodigoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(TestMockConfiguration.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RegistroIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RegistroCodigoRepository registroCodigoRepository;

    @Test
    void registrarConRolAdmin_CreaCliente() throws Exception {
        String correo = "testadminx@skd.com";

        // 1. Solicitar código de verificación
        mockMvc.perform(post("/api/auth/enviar-codigo-registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\"}"))
                .andExpect(status().isOk());

        String codigo = registroCodigoRepository
                .findTopByCorreoOrderByCreadoEnDesc(correo)
                .orElseThrow().getCodigo();

        // 2. Registrar con código (el rol admin debe ignorarse)
        String body = """
            {"nombre":"Malicioso","username":"test_admin_x","correo":"testadminx@skd.com","password":"123456","rol":"admin","codigo":"CODIGO"}
            """.replace("CODIGO", codigo);

        String response = mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(response).contains("cliente");
        assertThat(response).doesNotContain("\"rol\":\"admin\"");
        assertThat(response).contains("\"verificado\":true");
    }
}