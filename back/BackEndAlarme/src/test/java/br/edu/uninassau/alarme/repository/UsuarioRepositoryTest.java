package br.edu.uninassau.alarme.repository;

import br.edu.uninassau.alarme.BackEnd3NaApplication;
import br.edu.uninassau.alarme.entity.Usuario;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BackEnd3NaApplication.class)
@ActiveProfiles("test")
@Transactional
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void encontraUsuarioPorEmailEntreUsuariosDistintos() {
        repository.save(new Usuario(null, "Outra", "outra@example.com", "outra-senha", "America/Fortaleza"));
        Usuario salvo = repository.saveAndFlush(
                new Usuario(null, "Ana", "ana@example.com", "senha-teste", "America/Fortaleza"));
        Long id = salvo.getId();
        entityManager.clear();

        Usuario encontrado = repository.findByEmail("ana@example.com").orElseThrow();
        assertEquals(id, encontrado.getId());
        assertEquals("Ana", encontrado.getNome());
        assertEquals("ana@example.com", encontrado.getEmail());
    }

    @Test
    void retornaOptionalVazioParaEmailNaoCadastrado() {
        repository.saveAndFlush(new Usuario(null, "Ana", "ana@example.com", "senha-teste", "America/Fortaleza"));
        entityManager.clear();
        assertTrue(repository.findByEmail("ausente@example.com").isEmpty());
    }
}
