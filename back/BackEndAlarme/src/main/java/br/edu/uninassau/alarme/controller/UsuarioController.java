package br.edu.uninassau.alarme.controller;

import java.nio.charset.StandardCharsets;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import br.edu.uninassau.alarme.service.UsuarioService;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*") // Permite requisições de diferentes origens (útil para desenvolvimento)
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioRepository usuarioRepository, UsuarioService usuarioService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<String> criarUsuario(@RequestBody Usuario usuario) {
        usuarioService.cadastrar(usuario);
        return ResponseEntity.status(201).body("Usuário criado com sucesso no banco de dados!");
    }

    // NOVO ENDPOINT DE LOGIN
    @PostMapping("/login")
    public ResponseEntity<UsuarioService.UsuarioResposta> fazerLogin(@RequestBody Usuario dadosLogin) {
        String senha = dadosLogin.getSenha();
        if (senha != null && (senha.isEmpty() || senha.getBytes(StandardCharsets.UTF_8).length > 72)) {
            return ResponseEntity.badRequest().build();
        }
        return usuarioService.autenticar(dadosLogin.getEmail(), senha)
                .map(usuario -> ResponseEntity.ok(usuario))
                .orElse(ResponseEntity.status(401).body(null));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        List<Usuario> lista = usuarioRepository.findAll();
        return ResponseEntity.ok(lista);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarUsuario(@PathVariable Long id, @RequestBody Usuario atualizarUsuario) {
        return usuarioService.atualizar(id, atualizarUsuario)
                .map(usuario -> ResponseEntity.ok("Usuario atualizado com Sucesso!!"))
                .orElse(ResponseEntity.notFound().build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Void> entradaInvalida() {
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarUsuario(@PathVariable Long id) {
        if (usuarioRepository.existsById(id)) {
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok("Usuario deletado com Sucesso!!");
        }
        return ResponseEntity.status(404).body("Usuario não encontrado!");
    }
}
