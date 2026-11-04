package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import br.edu.uninassau.alarme.service.UsuarioService;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** PUT contract exercised with the real service and BCrypt, without a database. */
@ExtendWith(MockitoExtension.class)
class UsuarioAtualizacaoContractTest {
    private static final String OLD_PASSWORD = "anterior-ficticia";
    private static final String NEW_PASSWORD = "nova-ficticia";

    @Mock
    private UsuarioRepository repository;
    private UsuarioController controller;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private MockMvc mvc;
    private Usuario stored;
    private String originalHash;

    @BeforeEach
    void setUp() {
        controller = new UsuarioController(repository, new UsuarioService(repository, encoder));
        lenient().when(repository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
        originalHash = encoder.encode(OLD_PASSWORD);
        stored = new Usuario(1L, "Ana", "ana@example.com", originalHash, "America/Fortaleza");
        stored.setPerfis(List.of());
    }

    @Test
    void senhaAusentePreservaHashArmazenado() throws Exception {
        existingUser();
        MvcResult result = update(1L, null);
        assertAll(
                () -> assertEquals(200, result.getResponse().getStatus()),
                () -> assertEquals("Usuario atualizado com Sucesso!!", result.getResponse().getContentAsString()),
                () -> assertTrue(Objects.equals(originalHash, stored.getSenha()), "O hash existente deve ser preservado"));
        verify(repository).save(any(Usuario.class));
    }

    @Test
    void novaSenhaEArmazenadaComoBCryptVerificavel() throws Exception {
        existingUser();
        MvcResult result = update(1L, NEW_PASSWORD);
        assertAll(
                () -> assertEquals(200, result.getResponse().getStatus()),
                () -> assertTrue(isBcryptFor(NEW_PASSWORD), "A nova senha deve ser persistida como BCrypt verificável"));
        verify(repository).save(argThat(user -> isBcrypt(user.getSenha())
                && encoder.matches(NEW_PASSWORD, user.getSenha())));
    }

    @Test
    void trocaInvalidaSenhaAnteriorEMantemLoginComNovaSenha() throws Exception {
        existingUser();
        when(repository.findByEmail("ana@example.com")).thenAnswer(invocation -> Optional.of(stored));

        assertEquals(200, update(1L, NEW_PASSWORD).getResponse().getStatus());
        assertAll(
                () -> assertEquals(401, login(OLD_PASSWORD).getResponse().getStatus()),
                () -> assertEquals(200, login(NEW_PASSWORD).getResponse().getStatus()));
    }

    @Test
    void senhaVaziaExplicitaRetorna400SemSalvar() throws Exception {
        invalidPasswordIsRejected("");
    }

    @Test
    void senhaAcimaDe72BytesUtf8Retorna400SemTruncarOuSalvar() throws Exception {
        String input = "é".repeat(37);
        assertEquals(74, input.getBytes(StandardCharsets.UTF_8).length);
        invalidPasswordIsRejected(input);
    }

    @Test
    void senhaComExatamente72BytesUtf8EAceitaComoBCrypt() throws Exception {
        existingUser();
        String input = "é".repeat(36);
        assertEquals(72, input.getBytes(StandardCharsets.UTF_8).length);
        MvcResult result = update(1L, input);
        assertAll(
                () -> assertEquals(200, result.getResponse().getStatus()),
                () -> assertTrue(isBcryptFor(input), "O limite deve ser em bytes UTF-8, sem rejeitar 72 bytes"));
    }

    @Test
    void usuarioInexistenteContinuaRetornando404() throws Exception {
        when(repository.findById(999L)).thenReturn(Optional.empty());
        MvcResult result = update(999L, NEW_PASSWORD);
        assertEquals(404, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().isEmpty());
        verify(repository, never()).save(any(Usuario.class));
    }

    @Test
    void respostaDeAtualizacaoNaoExpoeCampoSenhaNemValoresSensíveis() throws Exception {
        existingUser();
        assertEquals(200, update(1L, NEW_PASSWORD).getResponse().getStatus());
    }

    private void existingUser() {
        when(repository.findById(1L)).thenReturn(Optional.of(stored));
    }

    private void invalidPasswordIsRejected(String input) throws Exception {
        // Validation may happen before or after loading the user.
        lenient().when(repository.findById(1L)).thenReturn(Optional.of(stored));
        MvcResult result = update(1L, input);
        assertAll(
                () -> assertEquals(400, result.getResponse().getStatus()),
                () -> verify(repository, never()).save(any(Usuario.class)),
                () -> assertTrue(Objects.equals(originalHash, stored.getSenha()), "Entrada inválida não deve alterar o hash"));
    }

    private MvcResult update(long id, String password) throws Exception {
        // All inputs are fixed test fixtures; no user-supplied JSON fragments.
        String passwordField = password == null ? "" : ",\"senha\":\"" + password + "\"";
        MvcResult result = mvc.perform(put("/usuarios/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .characterEncoding(StandardCharsets.UTF_8)
                .content("{\"nome\":\"Ana atualizada\",\"email\":\"ana@example.com\","
                        + "\"fusoHorario\":\"America/Fortaleza\"" + passwordField + "}"))
                .andReturn();
        assertNoSecrets(result, password);
        return result;
    }

    private MvcResult login(String password) throws Exception {
        MvcResult result = mvc.perform(post("/usuarios/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@example.com\",\"senha\":\"" + password + "\"}"))
                .andReturn();
        assertNoSecrets(result, password);
        return result;
    }

    private void assertNoSecrets(MvcResult result, String submitted) throws Exception {
        String response = result.getResponse().getContentAsString();
        // Boolean assertions avoid embedding body, password or hash in failure output.
        assertFalse(response.contains("\"senha\""), "Resposta não deve conter o campo senha");
        assertFalse(response.contains(originalHash), "Resposta não deve expor o hash original");
        assertFalse(response.contains(OLD_PASSWORD), "Resposta não deve expor a senha anterior");
        assertFalse(response.contains(NEW_PASSWORD), "Resposta não deve expor a nova senha");
        assertFalse(response.contains("$2a$") || response.contains("$2b$") || response.contains("$2y$"),
                "Resposta não deve expor hashes BCrypt");
        if (submitted != null && !submitted.isEmpty()) {
            assertFalse(response.contains(submitted), "Resposta não deve ecoar a entrada sensível");
        }
    }

    private boolean isBcryptFor(String password) {
        return isBcrypt(stored.getSenha()) && encoder.matches(password, stored.getSenha());
    }

    private boolean isBcrypt(String value) {
        return value != null && value.matches("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}");
    }
}
