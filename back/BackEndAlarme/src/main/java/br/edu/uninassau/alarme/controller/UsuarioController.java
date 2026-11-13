package br.edu.uninassau.alarme.controller;

import java.nio.charset.StandardCharsets;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import br.edu.uninassau.alarme.security.AcessoConta;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import br.edu.uninassau.alarme.service.UsuarioService;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final AcessoConta acesso;

    public UsuarioController(UsuarioRepository usuarioRepository, UsuarioService usuarioService, AcessoConta acesso) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.acesso = acesso;
    }

    @PostMapping
    public ResponseEntity<String> criarUsuario(@RequestBody Usuario usuario) {
        usuarioService.cadastrar(usuario);
        return ResponseEntity.status(201).body("Usuário criado com sucesso no banco de dados!");
    }

    // NOVO ENDPOINT DE LOGIN
    @PostMapping("/login")
    public ResponseEntity<UsuarioService.UsuarioResposta> fazerLogin(@RequestBody Usuario dadosLogin,
                                                                    HttpServletRequest request) {
        String senha = dadosLogin.getSenha();
        if (senha != null && (senha.isEmpty() || senha.getBytes(StandardCharsets.UTF_8).length > 72)) {
            return ResponseEntity.badRequest().build();
        }
        return usuarioService.autenticar(dadosLogin.getEmail(), senha)
                .map(usuario -> {
                    SessaoUsuario.iniciar(request, usuario.id());
                    return ResponseEntity.ok(usuario);
                })
                .orElse(ResponseEntity.status(401).body(null));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioService.UsuarioResposta> usuarioAtual(HttpServletRequest request,
                                                                      HttpServletResponse response) {
        Long id = SessaoUsuario.exigirId(request);
        return usuarioService.buscarPorId(id).map(ResponseEntity::ok).orElseGet(() -> {
            SessaoUsuario.encerrar(request, response);
            return ResponseEntity.status(401).build();
        });
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        SessaoUsuario.encerrar(request, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<UsuarioService.UsuarioResposta>> listarUsuarios(HttpServletRequest request) {
        return usuarioService.buscarPorId(SessaoUsuario.exigirId(request))
                .map(usuario -> ResponseEntity.ok(List.of(usuario)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarUsuario(@PathVariable Long id, @RequestBody Usuario atualizarUsuario,
                                                    HttpServletRequest request) {
        if (!id.equals(SessaoUsuario.exigirId(request))) return ResponseEntity.notFound().build();
        return usuarioService.atualizar(id, atualizarUsuario)
                .map(usuario -> ResponseEntity.ok("Usuario atualizado com Sucesso!!"))
                .orElse(ResponseEntity.notFound().build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Void> entradaInvalida() {
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<String> deletarUsuario(@PathVariable Long id, HttpServletRequest request,
                                                HttpServletResponse response) {
        if (!id.equals(SessaoUsuario.exigirId(request))) return ResponseEntity.notFound().build();
        if (usuarioRepository.existsById(id)) {
            acesso.verificarExclusaoUsuario(id);
            usuarioRepository.deleteById(id);
            SessaoUsuario.encerrar(request, response);
            return ResponseEntity.ok("Usuario deletado com Sucesso!!");
        }
        return ResponseEntity.status(404).body("Usuario não encontrado!");
    }
}
