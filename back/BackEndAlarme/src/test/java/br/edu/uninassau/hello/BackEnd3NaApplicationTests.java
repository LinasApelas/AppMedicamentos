package br.edu.uninassau.hello;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import br.edu.uninassau.alarme.BackEnd3NaApplication;

@SpringBootTest(classes = BackEnd3NaApplication.class)
@ActiveProfiles("test")
class BackEnd3NaApplicationTests {

	@Test
	void contextLoads() {
	}

}
