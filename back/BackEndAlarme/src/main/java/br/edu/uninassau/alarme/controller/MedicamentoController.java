package br.edu.uninassau.alarme.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import br.edu.uninassau.alarme.entity.Medicamento;
import br.edu.uninassau.alarme.repository.MedicamentoRepository;

@RestController
@RequestMapping("/medicamentos")
@CrossOrigin(origins = "*")
public class MedicamentoController {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @PostMapping
    public ResponseEntity<Medicamento> criar(@RequestBody Medicamento medicamento) {
        return ResponseEntity.status(201).body(medicamentoRepository.save(medicamento));
    }

    @GetMapping
    public ResponseEntity<List<Medicamento>> listar() {
        return ResponseEntity.ok(medicamentoRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizarMedicamento(@PathVariable Long id, @RequestBody Medicamento atualizarMedicamento) {
        return medicamentoRepository.findById(id).map(medicamento -> {
            medicamento.setNome(atualizarMedicamento.getNome());
            medicamento.setUnidadeMedida(atualizarMedicamento.getUnidadeMedida());
            medicamento.setDescricao(atualizarMedicamento.getDescricao());
            medicamentoRepository.save(medicamento);
            return ResponseEntity.ok("Medicamento atualizado com Sucesso!!");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarMedicamento(@PathVariable Long id) {
        if (medicamentoRepository.existsById(id)) {
            medicamentoRepository.deleteById(id);
            return ResponseEntity.ok("Medicamento deletado com Sucesso!!");
        }
        return ResponseEntity.status(404).body("Medicamento não encontrado!");
    }
}

