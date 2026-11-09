package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.entity.Historico;
import br.edu.uninassau.alarme.repository.HistoricoRepository;
import br.edu.uninassau.alarme.security.AcessoConta;
import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
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
    public ResponseEntity<String> criarHistorico(@RequestBody Historico entrada, HttpServletRequest request) {
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
    public ResponseEntity<String> atualizarHistorico(@PathVariable Long id, @RequestBody Historico entrada,
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

    private void preencher(Historico historico, Historico entrada, Long usuarioId) {
        var tratamento = acesso.tratamento(entrada.getTratamento() == null ? null : entrada.getTratamento().getId(), usuarioId);
        historico.setDataHoraPrevista(entrada.getDataHoraPrevista());
        historico.setDataHoraRealizada(entrada.getDataHoraRealizada());
        historico.setStatus(entrada.getStatus());
        historico.setTratamento(tratamento);
    }
}