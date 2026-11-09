package br.edu.uninassau.alarme.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.edu.uninassau.alarme.entity.Tratamento;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TratamentoRepository extends JpaRepository<Tratamento, Long> {
    List<Tratamento> findByPerfilUsuarioIdAndMedicamentoUsuarioId(Long usuarioId, Long medicamentoUsuarioId);
    Optional<Tratamento> findByIdAndPerfilUsuarioIdAndMedicamentoUsuarioId(Long id, Long usuarioId, Long medicamentoUsuarioId);

    @Query("select count(t) > 0 from Tratamento t left join t.perfil p left join p.usuario u "
            + "where t.medicamento.id = :medicamentoId and (u.id is null or u.id <> :usuarioId)")
    boolean possuiVinculoDeOutraConta(Long medicamentoId, Long usuarioId);

    @Query("select count(t) > 0 from Tratamento t left join t.medicamento m left join m.usuario u "
            + "where t.perfil.id = :perfilId and (u.id is null or u.id <> :usuarioId)")
    boolean perfilPossuiVinculoDeOutraConta(Long perfilId, Long usuarioId);

    @Query("select count(t) > 0 from Tratamento t left join t.perfil p left join p.usuario pu "
            + "left join t.medicamento m left join m.usuario mu "
            + "where (pu.id = :usuarioId and (mu.id is null or mu.id <> :usuarioId)) "
            + "or (mu.id = :usuarioId and (pu.id is null or pu.id <> :usuarioId))")
    boolean usuarioPossuiVinculoDeOutraConta(Long usuarioId);
}
