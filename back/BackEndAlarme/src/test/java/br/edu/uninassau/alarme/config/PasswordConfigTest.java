package br.edu.uninassau.alarme.config;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordConfigTest {

    @Test
    void beanGeraHashBCryptValidoEAceitaSenhaCorreta() {
        try (var context = new AnnotationConfigApplicationContext(PasswordConfig.class)) {
            PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
            assertInstanceOf(BCryptPasswordEncoder.class, encoder);
            String hash = encoder.encode("senha-de-teste");
            assertNotEquals("senha-de-teste", hash);
            assertTrue(hash.matches("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}"));
            assertTrue(encoder.matches("senha-de-teste", hash));
            assertTrue(new BCryptPasswordEncoder().matches("senha-de-teste", hash));
        }
    }

    @Test
    void rejeitaSenhaIncorreta() {
        PasswordEncoder encoder = new PasswordConfig().passwordEncoder();
        assertFalse(encoder.matches("senha-incorreta", encoder.encode("senha-de-teste")));
    }

    @Test
    void usaSaltAleatorioParaAMesmaSenha() {
        PasswordEncoder encoder = new PasswordConfig().passwordEncoder();
        String primeiro = encoder.encode("senha-de-teste");
        String segundo = encoder.encode("senha-de-teste");
        assertNotEquals(primeiro, segundo);
        assertTrue(encoder.matches("senha-de-teste", primeiro));
        assertTrue(encoder.matches("senha-de-teste", segundo));
    }
}
