package br.edu.uninassau.alarme.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import br.edu.uninassau.alarme.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    @Query("""
            select count(u) > 0 from Usuario u where u.id = :id and (
                exists (select p.id from Perfil p where p.usuario.id = u.id)
                or exists (select m.id from Medicamento m where m.usuario.id = u.id)
            )
            """)
    boolean possuiVinculos(@Param("id") Long id);

}
