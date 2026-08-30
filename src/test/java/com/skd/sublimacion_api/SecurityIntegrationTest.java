package com.skd.sublimacion_api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.entity.Usuario;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(TestMockConfiguration.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private Usuario usuarioDe(String username, Rol rol, Long id) {
        return Usuario.builder()
                .id(id)
                .username(username)
                .nombre(username)
                .correo(username + "@test.com")
                .contrasenaHash("x")
                .rol(rol)
                .build();
    }

    private UsernamePasswordAuthenticationToken auth(UserDetails principal) {
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void disenador_BloqueadoEnCompra() throws Exception {
        mockMvc.perform(get("/api/pedidos")
                        .with(user("d").roles("disenador")))
                .andExpect(status().isForbidden());
    }

    @Test
    void disenador_BloqueadoEnFacturas() throws Exception {
        mockMvc.perform(get("/api/facturas")
                        .with(user("d").roles("disenador")))
                .andExpect(status().isForbidden());
    }

    @Test
    void cliente_PuedeVerPedidos() throws Exception {
        mockMvc.perform(get("/api/pedidos/usuario")
                        .with(authentication(auth(usuarioDe("cliente1", Rol.cliente, 1L)))))
                .andExpect(status().isOk());
    }

    @Test
    void admin_PuedeVerSolicitudesDiseno() throws Exception {
        mockMvc.perform(get("/api/admin/solicitudes-diseno?size=10")
                        .with(authentication(auth(usuarioDe("admin1", Rol.admin, 2L)))))
                .andExpect(status().isOk());
    }
}