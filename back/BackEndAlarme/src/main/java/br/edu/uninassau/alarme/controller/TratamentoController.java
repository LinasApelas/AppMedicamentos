package br.edu.uninassau.alarme.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import br.edu.uninassau.alarme.entity.Tratamento;
import br.edu.uninassau.alarme.repository.TratamentoRepository;

@RestController
@RequestMapping("/tratamentos")
@CrossOrigin(origins = "*")
public class TratamentoController {

    @Autowired
    private TratamentoRepository tratamentoRepository;

    @PostMapping
    public ResponseEntity<String> criarTratamento(@RequestBody Tratamento tratamento) {
        tratamentoRepository.save(tratamento);
        return ResponseEntity.status(201).body("Tratamento agendado com sucesso!");
    }

    @GetMapping
    public ResponseEntity<List<Tratamento>> listarTratamentos() {
        return ResponseEntity.ok(tratamentoRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarTratamento(@PathVariable Long id, @RequestBody Tratamento atualizarTratamento) {
        return tratamentoRepository.findById(id).map(tratamento -> {
            tratamento.setDataInicio(atualizarTratamento.getDataInicio());
            tratamento.setDataFim(atualizarTratamento.getDataFim());
            tratamento.setIntervaloHoras(atualizarTratamento.getIntervaloHoras());
            tratamento.setSomAlarme(atualizarTratamento.getSomAlarme());
            tratamento.setNivelPrioridade(atualizarTratamento.getNivelPrioridade());
            tratamento.setStatus(atualizarTratamento.getStatus());
            tratamento.setPerfil(atualizarTratamento.getPerfil());
            tratamento.setMedicamento(atualizarTratamento.getMedicamento());
            tratamentoRepository.save(tratamento);
            return ResponseEntity.ok("Tratamento atualizado com Sucesso!!");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarTratamento(@PathVariable Long id) {
        if (tratamentoRepository.existsById(id)) {
            tratamentoRepository.deleteById(id);
            return ResponseEntity.ok("Tratamento deletado com Sucesso!!");
        }
        return ResponseEntity.status(404).body("Tratamento não encontrado!");
    }
}
