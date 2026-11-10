package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Historico;
import br.edu.uninassau.alarme.repository.HistoricoRepository;
import br.edu.uninassau.alarme.security.AcessoConta;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/historicos")
@Transactional
public class HistoricoController {
    private final HistoricoRepository repository;
    private final AcessoConta acesso;

    public HistoricoController(HistoricoRepository repository, AcessoConta acesso) {
        this.repository = repository;
        this.acesso = acesso;
    }

    @PostMapping
    public ResponseEntity<String> criarHistorico(@RequestBody HistoricoEntrada entrada, HttpServletRequest request) {
        Historico historico = new Historico();
        preencher(historico, entrada, SessaoUsuario.exigirId(request));
        repository.save(historico);
        return ResponseEntity.status(201).body("Registro de histórico salvo com sucesso!");
    }

    @GetMapping
    public ResponseEntity<List<Historico>> listarHistoricos(HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        return ResponseEntity.ok(repository.findByTratamentoPerfilUsuarioIdAndTratamentoMedicamentoUsuarioId(usuarioId, usuarioId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarHistorico(@PathVariable Long id, @RequestBody HistoricoEntrada entrada,
                                                     HttpServletRequest request) {
        Long usuarioId = SessaoUsuario.exigirId(request);
        Historico historico = acesso.historico(id, usuarioId);
        preencher(historico, entrada, usuarioId);
        repository.save(historico);
        return ResponseEntity.ok("Historico atualizado com Sucesso!!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarHistorico(@PathVariable Long id, HttpServletRequest request) {
        repository.delete(acesso.historico(id, SessaoUsuario.exigirId(request)));
        return ResponseEntity.ok("Historico deletado com Sucesso!!");
    }

    private void preencher(Historico historico, HistoricoEntrada entrada, Long usuarioId) {
        var tratamento = acesso.tratamento(entrada.tratamento() == null ? null : entrada.tratamento().id(), usuarioId);
        historico.setDataHoraPrevista(entrada.dataHoraPrevista());
        historico.setDataHoraRealizada(entrada.dataHoraRealizada());
        historico.setStatus(entrada.status());
        historico.setTratamento(tratamento);
    }

    // Receive a relationship ID, never deserialize or trust a client-supplied entity graph.
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record HistoricoEntrada(LocalDateTime dataHoraPrevista, LocalDateTime dataHoraRealizada,
                                   String status, ReferenciaTratamento tratamento) { }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ReferenciaTratamento(Long id) { }
}
