package br.edu.uninassau.alarme.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.edu.uninassau.alarme.entity.Perfil;
import java.util.List;
import java.util.Optional;

public interface PerfilRepository extends JpaRepository<Perfil, Long> {
    List<Perfil> findByUsuarioId(Long usuarioId);
    Optional<Perfil> findByIdAndUsuarioId(Long id, Long usuarioId);
}
