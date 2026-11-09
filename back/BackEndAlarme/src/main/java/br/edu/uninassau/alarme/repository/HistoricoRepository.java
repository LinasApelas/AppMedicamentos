package br.edu.uninassau.alarme.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.edu.uninassau.alarme.entity.Historico;
import java.util.List;
import java.util.Optional;

public interface HistoricoRepository extends JpaRepository<Historico, Long> {
    List<Historico> findByTratamentoPerfilUsuarioIdAndTratamentoMedicamentoUsuarioId(Long usuarioId, Long medicamentoUsuarioId);
    Optional<Historico> findByIdAndTratamentoPerfilUsuarioIdAndTratamentoMedicamentoUsuarioId(Long id, Long usuarioId, Long medicamentoUsuarioId);
}
