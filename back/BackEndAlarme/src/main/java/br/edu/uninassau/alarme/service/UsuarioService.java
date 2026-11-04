package br.edu.uninassau.alarme.service;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional
public class UsuarioService {
    private static final Pattern BCRYPT = Pattern.compile(
            "\\A\\$2[aby]\\$(?:0[4-9]|[12][0-9]|3[01])\\$[./A-Za-z0-9]{53}\\z");

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    public UsuarioResposta cadastrar(Usuario entrada) {
        if (entrada == null) {
            throw invalidInput();
        }
        validatePassword(entrada.getSenha());
        // Do not persist a client-provided id, relationships or an unencoded password.
        Usuario novo = new Usuario(null, entrada.getNome(), entrada.getEmail(),
                encoder.encode(entrada.getSenha()), entrada.getFusoHorario());
        return response(repository.save(novo));
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioResposta> autenticar(String email, String senha) {
        if (email == null || email.isBlank() || !validPassword(senha)) {
            return Optional.empty();
        }
        return repository.findByEmail(email)
                .filter(usuario -> matches(senha, usuario.getSenha()))
                .map(UsuarioService::response);
    }

    public Optional<UsuarioResposta> atualizar(Long id, Usuario entrada) {
        if (entrada == null) {
            throw invalidInput();
        }
        // Null means omitted; an explicitly empty string is invalid.
        String senha = entrada.getSenha();
        if (senha != null) {
            validatePassword(senha);
        }
        return repository.findById(id).map(usuario -> {
            // Encode before touching the managed entity: encoding failure must not mutate it.
            String hash = senha == null ? usuario.getSenha() : encoder.encode(senha);
            usuario.setNome(entrada.getNome());
            usuario.setEmail(entrada.getEmail());
            usuario.setFusoHorario(entrada.getFusoHorario());
            usuario.setSenha(hash);
            return response(repository.save(usuario));
        });
    }

    private boolean matches(String senha, String stored) {
        // Content cannot prove provenance; this is validation, not legacy migration.
        // No fallback to plaintext and no equality comparison with a submitted hash.
        if (stored == null || !BCRYPT.matcher(stored).matches()) {
            return false;
        }
        try {
            return encoder.matches(senha, stored);
        } catch (IllegalArgumentException exception) {
            // Malformed stored credentials must not escape as a server error.
            return false;
        }
    }

    private static boolean validPassword(String senha) {
        return senha != null && !senha.isEmpty()
                && senha.getBytes(StandardCharsets.UTF_8).length <= 72;
    }

    private static void validatePassword(String senha) {
        if (!validPassword(senha)) {
            throw invalidInput();
        }
    }

    private static IllegalArgumentException invalidInput() {
        return new IllegalArgumentException("Senha obrigatória, não vazia e com no máximo 72 bytes UTF-8.");
    }

    private static UsuarioResposta response(Usuario usuario) {
        List<PerfilResposta> perfis = usuario.getPerfis() == null ? null : usuario.getPerfis().stream()
                .map(perfil -> new PerfilResposta(perfil.getId(), perfil.getNome(), perfil.getCorAvatar()))
                .toList();
        return new UsuarioResposta(usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getFusoHorario(), perfis);
    }

    public record UsuarioResposta(Long id, String nome, String email, String fusoHorario,
                                 List<PerfilResposta> perfis) { }

    public record PerfilResposta(Long id, String nome, String corAvatar) { }
}
