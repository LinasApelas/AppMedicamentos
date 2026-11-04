package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Contract tests without a Spring application context or a database connection. */
@ExtendWith(MockitoExtension.class)
class UsuarioControllerTest {

    @Mock
    private UsuarioRepository repository;

    @InjectMocks
    private UsuarioController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void cadastroAceitaSenhaJsonERetornaMensagemAtualCom201() throws Exception {
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
        assertEquals("senha-teste", recebido.getSenha());
        assertEquals("America/Fortaleza", recebido.getFusoHorario());
    }

    @Test
    void loginValidoAceitaSenhaJsonERetornaUsuarioSemSenha() throws Exception {
        when(repository.findByEmailAndSenha("ana@example.com", "senha-teste"))
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

        verify(repository).findByEmailAndSenha("ana@example.com", "senha-teste");
    }

    @Test
    void loginInvalidoRetorna401SemCorpo() throws Exception {
        when(repository.findByEmailAndSenha("ana@example.com", "incorreta"))
                .thenReturn(Optional.empty());

        mvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ana@example.com","senha":"incorreta"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(""));

        verify(repository).findByEmailAndSenha("ana@example.com", "incorreta");
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
        Usuario usuario = new Usuario(1L, "Ana", "ana@example.com", "senha-teste", "America/Fortaleza");
        usuario.setPerfis(List.of());
        return usuario;
    }
}
