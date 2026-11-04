package br.edu.uninassau.alarme.service;

import br.edu.uninassau.alarme.entity.Perfil;
import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {
    private static final String OLD = "anterior-ficticia";
    private static final String NEW = "nova-ficticia";
    @Mock
    private UsuarioRepository repository;
    private PasswordEncoder encoder;
    private UsuarioService service;

    @BeforeEach
    void setUp() {
        encoder = new BCryptPasswordEncoder();
        service = new UsuarioService(repository, encoder);
    }

    @Test
    void cadastroPersisteSomenteHashSemConfiarNoIdOuRelacionamentosDoCliente() {
        stubSave();
        Usuario input = user(NEW);
        var output = service.cadastrar(input);
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        Usuario saved = captor.getValue();
        assertNull(saved.getId());
        assertNull(saved.getPerfis());
        assertTrue(encoder.matches(NEW, saved.getSenha()), "Hash persistido deve verificar a senha");
        assertFalse(Objects.equals(NEW, saved.getSenha()), "Não persistir a senha original");
        assertEquals("Ana", output.nome());
        noSecrets(output, NEW, saved.getSenha());
    }

    @ParameterizedTest(name = "cadastro rejeita entrada inválida #{index}")
    @NullAndEmptySource
    void cadastroRejeitaSenhaAusenteOuVazia(String password) {
        assertThrows(IllegalArgumentException.class, () -> service.cadastrar(user(password)));
        verifyNoInteractions(repository);
    }

    @Test
    void cadastroRejeitaMaisDe72BytesSemTruncar() {
        assertThrows(IllegalArgumentException.class, () -> service.cadastrar(user("é".repeat(37))));
        verifyNoInteractions(repository);
    }

    @Test
    void cadastroAceita72BytesEPreservaEspacos() {
        stubSave();
        String password = " " + "é".repeat(35) + " ";
        service.cadastrar(user(password));
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        assertTrue(encoder.matches(password, captor.getValue().getSenha()));
        assertFalse(encoder.matches(password.trim(), captor.getValue().getSenha()));
    }

    @Test
    void loginCorretoRetornaProjecaoSemSegredosIncluindoPerfis() {
        Usuario stored = user(encoder.encode(OLD));
        stored.setPerfis(List.of(new Perfil(2L, "Principal", "azul", stored)));
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(stored));
        var result = service.autenticar("ana@example.com", OLD).orElseThrow();
        assertEquals(1L, result.id());
        assertEquals(1, result.perfis().size());
        assertEquals("Principal", result.perfis().get(0).nome());
        noSecrets(result, OLD, stored.getSenha());
        verify(repository).findByEmail("ana@example.com");
        verifyNoMoreInteractions(repository);
        verify(repository, never()).save(any());
    }

    @Test
    void loginIncorretoNaoAutentica() {
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(user(encoder.encode(OLD))));
        assertTrue(service.autenticar("ana@example.com", NEW).isEmpty());
    }

    @Test
    void emailInexistenteNaoAutentica() {
        when(repository.findByEmail("ausente@example.com")).thenReturn(Optional.empty());
        assertTrue(service.autenticar("ausente@example.com", OLD).isEmpty());
    }

    @ParameterizedTest(name = "login rejeita credencial armazenada inválida #{index}")
    @NullAndEmptySource
    @ValueSource(strings = {"legado-ficticio", "$2a$10$incompleto"})
    void credencialArmazenadaInvalidaOuLegadaNaoAutentica(String stored) {
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(user(stored)));
        // The same plaintext value still must not authenticate a legacy record.
        String submitted = stored == null || stored.isEmpty() ? OLD : stored;
        assertTrue(service.autenticar("ana@example.com", submitted).isEmpty());
    }

    @Test
    void erroDeFormatoDoEncoderNaoEscapaDaAutenticacao() {
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);
        String hash = encoder.encode(OLD);
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(user(hash)));
        when(mockEncoder.matches(anyString(), anyString())).thenThrow(new IllegalArgumentException());
        var local = new UsuarioService(repository, mockEncoder);
        assertTrue(local.autenticar("ana@example.com", OLD).isEmpty());
    }

    @Test
    void hashSubmetidoNaoServeComoProvaDeAutenticacao() {
        String hash = encoder.encode(OLD);
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(user(hash)));
        assertTrue(service.autenticar("ana@example.com", hash).isEmpty());
    }

    @Test
    void cadastroNaoConfiaEmHashEnviadoComoValorJaCodificado() {
        stubSave();
        String submitted = encoder.encode(OLD);
        service.cadastrar(user(submitted));
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        assertFalse(Objects.equals(submitted, captor.getValue().getSenha()));
        assertTrue(encoder.matches(submitted, captor.getValue().getSenha()));
    }

    @ParameterizedTest(name = "login rejeita senha de entrada inválida #{index}")
    @NullAndEmptySource
    void loginRejeitaSenhaAusenteOuVazia(String password) {
        assertTrue(service.autenticar("ana@example.com", password).isEmpty());
        verifyNoInteractions(repository);
    }

    @Test
    void loginRejeitaEntradaLongaOuEmailAusente() {
        assertTrue(service.autenticar("ana@example.com", "é".repeat(37)).isEmpty());
        assertTrue(service.autenticar(null, OLD).isEmpty());
        assertTrue(service.autenticar("", OLD).isEmpty());
        verifyNoInteractions(repository);
    }

    @Test
    void atualizacaoSemSenhaPreservaHash() {
        stubSave();
        String hash = encoder.encode(OLD);
        Usuario stored = user(hash);
        when(repository.findById(1L)).thenReturn(Optional.of(stored));
        var output = service.atualizar(1L, user(null)).orElseThrow();
        assertTrue(Objects.equals(hash, stored.getSenha()));
        noSecrets(output, OLD, hash);
        verify(repository).save(stored);
    }

    @Test
    void trocaDeSenhaPersisteHashEInvalidaCredencialAnterior() {
        stubSave();
        Usuario stored = user(encoder.encode(OLD));
        when(repository.findById(1L)).thenReturn(Optional.of(stored));
        when(repository.findByEmail("ana@example.com")).thenReturn(Optional.of(stored));
        var output = service.atualizar(1L, user(NEW)).orElseThrow();
        assertTrue(encoder.matches(NEW, stored.getSenha()));
        assertTrue(service.autenticar("ana@example.com", OLD).isEmpty());
        assertTrue(service.autenticar("ana@example.com", NEW).isPresent());
        noSecrets(output, NEW, stored.getSenha());
        verify(repository, times(2)).findByEmail("ana@example.com");
    }

    @Test
    void atualizacaoRejeitaVaziaOuAcimaDoLimiteAntesDePersistir() {
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(1L, user("")));
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(1L, user("é".repeat(37))));
        verifyNoInteractions(repository);
    }

    @Test
    void atualizacaoAceitaExatamente72BytesSemTrim() {
        stubSave();
        Usuario stored = user(encoder.encode(OLD));
        when(repository.findById(1L)).thenReturn(Optional.of(stored));
        String password = " " + "é".repeat(35) + " ";
        service.atualizar(1L, user(password));
        assertTrue(encoder.matches(password, stored.getSenha()));
        assertFalse(encoder.matches(password.trim(), stored.getSenha()));
    }

    @Test
    void usuarioInexistenteNaoSalva() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertTrue(service.atualizar(99L, user(NEW)).isEmpty());
        verify(repository, never()).save(any());
    }

    @Test
    void falhaNaCodificacaoNaoAlteraEntidadeExistente() {
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);
        Usuario stored = user(encoder.encode(OLD));
        String original = stored.getSenha();
        when(repository.findById(1L)).thenReturn(Optional.of(stored));
        when(mockEncoder.encode(anyString())).thenThrow(new IllegalStateException());
        assertThrows(IllegalStateException.class,
                () -> new UsuarioService(repository, mockEncoder).atualizar(1L, user(NEW)));
        assertTrue(Objects.equals(original, stored.getSenha()));
        verify(repository, never()).save(any());
    }

    @Test
    void objetoDeEntradaAusenteERejeitadoSemPersistir() {
        assertThrows(IllegalArgumentException.class, () -> service.cadastrar(null));
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(1L, null));
        verifyNoInteractions(repository);
    }

    private Usuario user(String password) {
        return new Usuario(1L, "Ana", "ana@example.com", password, "America/Fortaleza");
    }

    private void stubSave() {
        when(repository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void noSecrets(Object output, String password, String hash) {
        String json = JsonMapper.builder().build().writeValueAsString(output);
        assertFalse(json.contains("\"senha\""), "Não retornar campo senha");
        assertFalse(json.contains(password), "Não retornar senha original");
        assertFalse(json.contains(hash), "Não retornar hash");
        assertFalse(output.toString().contains(hash), "Projeção não deve conter hash");
    }
}
