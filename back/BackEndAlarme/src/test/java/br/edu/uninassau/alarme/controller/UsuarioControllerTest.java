package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import br.edu.uninassau.alarme.service.UsuarioService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Contract tests without a Spring application context or a database connection. */
@ExtendWith(MockitoExtension.class)
class UsuarioControllerTest {

    @Mock
    private UsuarioRepository repository;

    private UsuarioController controller;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        controller = new UsuarioController(repository, new UsuarioService(repository, encoder));
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void cadastroAceitaSenhaJsonERetornaMensagemAtualCom201() throws Exception {
        when(repository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        mvc.perform(post("/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content("""
                                {"nome":"Ana","email":"ana@example.com","senha":"senha-teste",
                                 "fusoHorario":"America/Fortaleza"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(content().string("Usuário criado com sucesso no banco de dados!"));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        Usuario recebido = captor.getValue();
        assertEquals("Ana", recebido.getNome());
        assertEquals("ana@example.com", recebido.getEmail());
        assertTrue(encoder.matches("senha-teste", recebido.getSenha()), "Senha deve ser persistida como BCrypt");
        assertFalse("senha-teste".equals(recebido.getSenha()), "Não persistir senha original");
        assertEquals("America/Fortaleza", recebido.getFusoHorario());
    }

    @Test
    void loginValidoAceitaSenhaJsonERetornaUsuarioSemSenha() throws Exception {
        when(repository.findByEmail("ana@example.com"))
                .thenReturn(Optional.of(usuario()));

        mvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ana@example.com","senha":"senha-teste"}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Ana"))
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.fusoHorario").value("America/Fortaleza"))
                .andExpect(jsonPath("$.perfis").isArray())
                .andExpect(jsonPath("$..senha").doesNotExist());

        verify(repository).findByEmail("ana@example.com");
    }

    @Test
    void loginInvalidoRetorna401SemCorpo() throws Exception {
        when(repository.findByEmail("ana@example.com"))
                .thenReturn(Optional.of(usuario()));

        mvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ana@example.com","senha":"incorreta"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(""));

        verify(repository).findByEmail("ana@example.com");
    }

    @Test
    void listagemRetornaUsuariosSemSenha() throws Exception {
        when(repository.findAll()).thenReturn(List.of(usuario()));

        mvc.perform(get("/usuarios"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nome").value("Ana"))
                .andExpect(jsonPath("$..senha").doesNotExist());

        verify(repository).findAll();
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario(1L, "Ana", "ana@example.com", encoder.encode("senha-teste"), "America/Fortaleza");
        usuario.setPerfis(List.of());
        return usuario;
    }
}
