package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Tratamento;
import br.edu.uninassau.alarme.repository.TratamentoRepository;
import br.edu.uninassau.alarme.security.AcessoConta;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/tratamentos")
@Transactional
public class TratamentoController {
    private final TratamentoRepository repository;
    private final AcessoConta acesso;

    public TratamentoController(TratamentoRepository repository, AcessoConta acesso) {
        this.repository = repository;
        this.acesso = acesso;
    }

    @PostMapping
    public ResponseEntity<String> criarTratamento(@RequestBody Tratamento entrada, HttpServletRequest request) {
        Tratamento tratamento = new Tratamento();
        preencher(tratamento, entrada, SessaoUsuario.exigirId(request));
        repository.save(tratamento);
        return ResponseEntity.status(201).body("Tratamento agendado com sucesso!");
    }

    @GetMapping
    public ResponseEntity<List<Tratamento>> listarTratamentos(HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        return ResponseEntity.ok(repository.findByPerfilUsuarioIdAndMedicamentoUsuarioId(usuarioId, usuarioId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarTratamento(@PathVariable Long id, @RequestBody Tratamento entrada,
                                                      HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Tratamento tratamento = acesso.tratamento(id, usuarioId);
        preencher(tratamento, entrada, usuarioId);
        repository.save(tratamento);
        return ResponseEntity.ok("Tratamento atualizado com Sucesso!!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarTratamento(@PathVariable Long id, HttpServletRequest request) {
        repository.delete(acesso.tratamento(id, SessaoUsuario.exigirId(request)));
        return ResponseEntity.ok("Tratamento deletado com Sucesso!!");
    }

    private void preencher(Tratamento tratamento, Tratamento entrada, Long usuarioId) {
        // Resolve both references before modifying the managed entity.
        var perfil = acesso.perfil(entrada.getPerfil() == null ? null : entrada.getPerfil().getId(), usuarioId);
        var medicamento = acesso.medicamento(entrada.getMedicamento() == null ? null : entrada.getMedicamento().getId(), usuarioId);
        tratamento.setDataInicio(entrada.getDataInicio());
        tratamento.setDataFim(entrada.getDataFim());
        tratamento.setIntervaloHoras(entrada.getIntervaloHoras());
        tratamento.setSomAlarme(entrada.getSomAlarme());
        tratamento.setNivelPrioridade(entrada.getNivelPrioridade());
        tratamento.setStatus(entrada.getStatus());
        tratamento.setPerfil(perfil);
        tratamento.setMedicamento(medicamento);
    }
}