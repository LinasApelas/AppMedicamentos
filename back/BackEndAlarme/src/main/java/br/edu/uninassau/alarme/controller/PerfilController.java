package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Perfil;
import br.edu.uninassau.alarme.repository.PerfilRepository;
import br.edu.uninassau.alarme.repository.TratamentoRepository;
import br.edu.uninassau.alarme.security.AcessoConta;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/perfis")
@Transactional
public class PerfilController {
    private final PerfilRepository repository;
    private final AcessoConta acesso;
    private final TratamentoRepository tratamentos;

    public PerfilController(PerfilRepository repository, AcessoConta acesso, TratamentoRepository tratamentos) {
        this.repository = repository;
        this.acesso = acesso;
        this.tratamentos = tratamentos;
    }

    @PostMapping
    public ResponseEntity<String> criarPerfil(@RequestBody Perfil entrada, HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Perfil perfil = new Perfil(null, entrada.getNome(), entrada.getCorAvatar(), acesso.usuario(usuarioId));
        repository.save(perfil);
        return ResponseEntity.status(201).body("Perfil criado com sucesso!");
    }

    @GetMapping
    public ResponseEntity<List<Perfil>> listarPerfis(HttpServletRequest request) {
        return ResponseEntity.ok(repository.findByUsuarioId(SessaoUsuario.exigirId(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarPerfil(@PathVariable Long id, @RequestBody Perfil entrada,
                                                  HttpServletRequest request) {
        Perfil perfil = acesso.perfil(id, SessaoUsuario.exigirId(request));
        perfil.setNome(entrada.getNome());
        perfil.setCorAvatar(entrada.getCorAvatar());
        repository.save(perfil);
        return ResponseEntity.ok("Perfil atualizado com Sucesso!!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarPerfil(@PathVariable Long id, HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Perfil perfil = acesso.perfil(id, usuarioId);
        if (tratamentos.perfilPossuiVinculoDeOutraConta(id, usuarioId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
        repository.delete(perfil);
        return ResponseEntity.ok("Perfil deletado com Sucesso!!");
    }
}
