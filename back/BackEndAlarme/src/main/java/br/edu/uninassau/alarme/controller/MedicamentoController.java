package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Medicamento;
import br.edu.uninassau.alarme.repository.MedicamentoRepository;
import br.edu.uninassau.alarme.repository.TratamentoRepository;
import br.edu.uninassau.alarme.security.AcessoConta;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/medicamentos")
@Transactional
public class MedicamentoController {
    private final MedicamentoRepository repository;
    private final TratamentoRepository tratamentos;
    private final AcessoConta acesso;

    public MedicamentoController(MedicamentoRepository repository, TratamentoRepository tratamentos, AcessoConta acesso) {
        this.repository = repository;
        this.tratamentos = tratamentos;
        this.acesso = acesso;
    }

    @PostMapping
    public ResponseEntity<Medicamento> criar(@RequestBody Medicamento entrada, HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Medicamento medicamento = new Medicamento(null, entrada.getNome(), entrada.getUnidadeMedida(), entrada.getDescricao());
        medicamento.setUsuario(acesso.usuario(usuarioId));
        return ResponseEntity.status(201).body(repository.save(medicamento));
    }

    @GetMapping
    public ResponseEntity<List<Medicamento>> listar(HttpServletRequest request) {
        return ResponseEntity.ok(repository.findByUsuarioId(SessaoUsuario.exigirId(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarMedicamento(@PathVariable Long id, @RequestBody Medicamento entrada,
                                                       HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Medicamento medicamento = acesso.medicamento(id, usuarioId);
        verificarVinculos(id, usuarioId);
        medicamento.setNome(entrada.getNome());
        medicamento.setUnidadeMedida(entrada.getUnidadeMedida());
        medicamento.setDescricao(entrada.getDescricao());
        repository.save(medicamento);
        return ResponseEntity.ok("Medicamento atualizado com Sucesso!!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarMedicamento(@PathVariable Long id, HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Medicamento medicamento = acesso.medicamento(id, usuarioId);
        verificarVinculos(id, usuarioId);
        repository.delete(medicamento);
        return ResponseEntity.ok("Medicamento deletado com Sucesso!!");
    }

    private void verificarVinculos(Long medicamentoId, Long usuarioId) {
        // A legacy shared relationship must never let a cascade affect another account.
        if (tratamentos.possuiVinculoDeOutraConta(medicamentoId, usuarioId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
    }
}