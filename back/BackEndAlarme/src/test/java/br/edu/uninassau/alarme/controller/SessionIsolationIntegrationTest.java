package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.BackEnd3NaApplication;
import br.edu.uninassau.alarme.entity.Historico;
import br.edu.uninassau.alarme.entity.Medicamento;
import br.edu.uninassau.alarme.entity.Perfil;
import br.edu.uninassau.alarme.entity.Tratamento;
import br.edu.uninassau.alarme.entity.Usuario;
import br.edu.uninassau.alarme.repository.HistoricoRepository;
import br.edu.uninassau.alarme.repository.MedicamentoRepository;
import br.edu.uninassau.alarme.repository.PerfilRepository;
import br.edu.uninassau.alarme.repository.TratamentoRepository;
import br.edu.uninassau.alarme.repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real MVC, BCrypt and repositories; the test profile uses only an in-memory H2 database. */
@SpringBootTest(classes = BackEnd3NaApplication.class)
@ActiveProfiles("test")
@Transactional
class SessionIsolationIntegrationTest {
    private static final String PASSWORD = "senha-ficticia-integracao";
    private static final String CLIENT_HEADER = "X-SyncMed-Client";

    @Autowired private WebApplicationContext context;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private PerfilRepository perfis;
    @Autowired private MedicamentoRepository medicamentos;
    @Autowired private TratamentoRepository tratamentos;
    @Autowired private HistoricoRepository historicos;
    @Autowired private PasswordEncoder encoder;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void cadastroELoginRestauramSomenteContaAutenticadaMantendoBCrypt() throws Exception {
        cadastrar("usuario teste bcrypt", "teste.bcrypt@example.com");
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        assertTrue(encoder.matches(PASSWORD, a.getSenha()), "Cadastro deve armazenar BCrypt verificável");
        assertFalse(PASSWORD.equals(a.getSenha()), "Senha não pode ser armazenada em texto puro");

        MockHttpSession session = login(a.getEmail());
        // New requests carrying the same server session model a JS reload/app reopen.
        for (int reload = 0; reload < 3; reload++) {
            MvcResult result = mvc.perform(get("/usuarios/me").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(a.getId()))
                    .andExpect(jsonPath("$.email").value(a.getEmail()))
                    .andReturn();
            assertNoSecrets(result);
        }
        mvc.perform(get("/usuarios").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(a.getId()));
        mvc.perform(get("/usuarios/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutInvalidaSessaoELoginSeguinteIdentificaContaB() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionA = login(a.getEmail());
        String oldSessionId = sessionA.getId();

        mvc.perform(mutation(post("/usuarios/logout"), sessionA, null))
                .andExpect(status().isNoContent());
        assertTrue(sessionA.isInvalid(), "Logout deve invalidar a sessão no servidor");
        mvc.perform(get("/usuarios/me").cookie(new Cookie("JSESSIONID", oldSessionId)))
                .andExpect(status().isUnauthorized());

        MockHttpSession sessionB = login(b.getEmail());
        mvc.perform(get("/usuarios/me").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId()));
        mvc.perform(mutation(post("/usuarios/logout"), null, null))
                .andExpect(status().isNoContent());
    }

    @Test
    void loginDeOutraContaSubstituiSessaoAnteriorSemReaproveitarIdentificador() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession oldSession = login(a.getEmail());
        String oldId = oldSession.getId();
        MvcResult response = mvc.perform(mutation(post("/usuarios/login"), oldSession,
                        loginJson(b.getEmail(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId()))
                .andReturn();
        MockHttpSession newSession = (MockHttpSession) response.getRequest().getSession(false);
        assertNotNull(newSession);
        assertTrue(oldSession.isInvalid(), "Login deve invalidar a identidade anterior");
        assertFalse(oldId.equals(newSession.getId()), "Login deve trocar o identificador de sessão");
        mvc.perform(get("/usuarios/me").session(newSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId()));
    }

    @Test
    void senhaIncorretaOuHashSubmetidoNaoCriaSessao() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        for (String invalidPassword : new String[] { "senha-incorreta-ficticia", a.getSenha() }) {
            MvcResult response = mvc.perform(mutation(post("/usuarios/login"), null,
                            loginJson(a.getEmail(), invalidPassword)))
                    .andExpect(status().isUnauthorized())
                    .andReturn();
            assertNull(response.getRequest().getSession(false));
            assertNoSecrets(response);
        }
    }

    @Test
    void rotasPrivadasExigemSessaoMesmoComIdsOuEmailInformadosPeloCliente() throws Exception {
        Usuario a = cadastrar("usuario teste bcrypt", "teste.bcrypt@example.com");
        for (String endpoint : new String[] { "/usuarios", "/usuarios/me", "/perfis", "/medicamentos", "/tratamentos", "/historicos" }) {
            mvc.perform(get(endpoint).param("usuarioId", a.getId().toString())
                            .header("X-Usuario-Id", a.getId()).param("email", a.getEmail()))
                    .andExpect(status().isUnauthorized());
        }
        for (String endpoint : new String[] { "/usuarios", "/perfis", "/medicamentos", "/tratamentos", "/historicos" }) {
            mvc.perform(mutation(put(endpoint + "/{id}", a.getId()), null, "{}"))
                    .andExpect(status().isUnauthorized());
            mvc.perform(mutation(delete(endpoint + "/{id}", a.getId()), null, null))
                    .andExpect(status().isUnauthorized());
        }
        for (String endpoint : new String[] { "/perfis", "/medicamentos", "/tratamentos", "/historicos" }) {
            mvc.perform(mutation(post(endpoint), null, "{}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void cabecalhoDeContaApenasConfereSessaoENaoAutenticaOuTrocaIdentidade() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionB = login(b.getEmail());

        mvc.perform(get("/medicamentos").session(sessionB).header("X-SyncMed-User", a.getId()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/medicamentos").header("X-SyncMed-User", a.getId()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/medicamentos").session(sessionB).header("X-SyncMed-User", b.getId()))
                .andExpect(status().isOk());
        mvc.perform(get("/usuarios/me").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId()));
    }

    @Test
    void listasEAlteracoesNaoPermitemAcessoAosDadosDeOutraConta() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionA = login(a.getEmail());
        MockHttpSession sessionB = login(b.getEmail());
        Graph graphA = criarGraph(sessionA, "A");
        Graph graphB = criarGraph(sessionB, "B");

        String[] endpoints = { "/perfis", "/medicamentos", "/tratamentos", "/historicos" };
        Long[] idsA = { graphA.perfil().getId(), graphA.medicamento().getId(), graphA.tratamento().getId(), graphA.historico().getId() };
        Long[] idsB = { graphB.perfil().getId(), graphB.medicamento().getId(), graphB.tratamento().getId(), graphB.historico().getId() };
        for (int i = 0; i < endpoints.length; i++) {
            MvcResult response = mvc.perform(get(endpoints[i]).session(sessionB))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(idsB[i]))
                    .andReturn();
            assertNoSecrets(response);
            mvc.perform(mutation(put(endpoints[i] + "/{id}", idsA[i]), sessionB, "{}"))
                    .andExpect(status().isNotFound());
            mvc.perform(mutation(delete(endpoints[i] + "/{id}", idsA[i]), sessionB, null))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(mutation(put("/usuarios/{id}", a.getId()), sessionB, "{}"))
                .andExpect(status().isNotFound());
        mvc.perform(mutation(delete("/usuarios/{id}", a.getId()), sessionB, null))
                .andExpect(status().isNotFound());
        assertTrue(usuarios.existsById(a.getId()));
        assertTrue(perfis.existsById(graphA.perfil().getId()));
        assertTrue(medicamentos.existsById(graphA.medicamento().getId()));
        assertTrue(tratamentos.existsById(graphA.tratamento().getId()));
        assertTrue(historicos.existsById(graphA.historico().getId()));
    }

    @Test
    void cadastroDeRecursosIgnoraIdsForjadosEVinculaProprietarioDaSessao() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionA = login(a.getEmail());
        MockHttpSession sessionB = login(b.getEmail());
        Graph graphA = criarGraph(sessionA, "A");

        mvc.perform(mutation(post("/perfis"), sessionB,
                        "{\"id\":%d,\"nome\":\"Perfil novo B\",\"usuarioId\":%d,\"usuario\":{\"id\":%d}}"
                                .formatted(graphA.perfil().getId(), a.getId(), a.getId())))
                .andExpect(status().isCreated());
        Perfil perfilB = perfis.findAll().stream().filter(p -> p.getNome().equals("Perfil novo B")).findFirst().orElseThrow();
        assertEquals(b.getId(), perfilB.getUsuario().getId());
        assertNotEquals(graphA.perfil().getId(), perfilB.getId());

        mvc.perform(mutation(post("/medicamentos"), sessionB,
                        "{\"id\":%d,\"nome\":\"Medicamento novo B\",\"usuario\":{\"id\":%d}}"
                                .formatted(graphA.medicamento().getId(), a.getId())))
                .andExpect(status().isCreated());
        Medicamento medicamentoB = medicamentos.findAll().stream()
                .filter(m -> m.getNome().equals("Medicamento novo B")).findFirst().orElseThrow();
        assertEquals(b.getId(), medicamentoB.getUsuario().getId());
        assertNotEquals(graphA.medicamento().getId(), medicamentoB.getId());
        assertEquals("Perfil A", perfis.findById(graphA.perfil().getId()).orElseThrow().getNome());
        assertEquals("Medicamento A", medicamentos.findById(graphA.medicamento().getId()).orElseThrow().getNome());

        mvc.perform(mutation(put("/perfis/{id}", perfilB.getId()), sessionB,
                        "{\"nome\":\"Perfil B atualizado\",\"usuarioId\":%d,\"usuario\":{\"id\":%d}}".formatted(a.getId(), a.getId())))
                .andExpect(status().isOk());
        assertEquals(b.getId(), perfis.findById(perfilB.getId()).orElseThrow().getUsuario().getId());
    }

    @Test
    void tratamentosEHistoricosRejeitamReferenciasDeOutraConta() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionA = login(a.getEmail());
        MockHttpSession sessionB = login(b.getEmail());
        Graph graphA = criarGraph(sessionA, "A");
        Graph graphB = criarGraph(sessionB, "B");

        for (String payload : new String[] {
                tratamentoJson(graphA.perfil().getId(), graphB.medicamento().getId()),
                tratamentoJson(graphB.perfil().getId(), graphA.medicamento().getId()) }) {
            mvc.perform(mutation(post("/tratamentos"), sessionB, payload)).andExpect(status().isNotFound());
            mvc.perform(mutation(put("/tratamentos/{id}", graphB.tratamento().getId()), sessionB, payload))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(mutation(post("/historicos"), sessionB, historicoJson(graphA.tratamento().getId())))
                .andExpect(status().isNotFound());
        mvc.perform(mutation(put("/historicos/{id}", graphB.historico().getId()), sessionB,
                        historicoJson(graphA.tratamento().getId())))
                .andExpect(status().isNotFound());
        assertEquals(2, tratamentos.count());
        assertEquals(2, historicos.count());
        assertEquals(graphB.perfil().getId(), tratamentos.findById(graphB.tratamento().getId()).orElseThrow().getPerfil().getId());
        assertEquals(graphB.tratamento().getId(), historicos.findById(graphB.historico().getId()).orElseThrow().getTratamento().getId());
    }

    @Test
    void idEnviadoNoCadastroNaoSobrescreveOutraConta() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        mvc.perform(mutation(post("/usuarios"), null,
                        "{\"id\":%d,\"nome\":\"Conta B\",\"email\":\"conta.b@example.com\",\"senha\":\"%s\"}"
                                .formatted(a.getId(), PASSWORD)))
                .andExpect(status().isCreated());
        Usuario b = usuarios.findByEmail("conta.b@example.com").orElseThrow();
        assertNotEquals(a.getId(), b.getId());
        assertEquals("Conta A", usuarios.findById(a.getId()).orElseThrow().getNome());
        assertTrue(encoder.matches(PASSWORD, b.getSenha()), "A nova conta deve continuar usando BCrypt");
    }

    @Test
    void exclusaoNaoApagaEmCascataTratamentoLegadoDeOutraConta() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        Usuario b = cadastrar("Conta B", "conta.b@example.com");
        MockHttpSession sessionA = login(a.getEmail());
        Graph graphA = criarGraph(sessionA, "A");
        Perfil perfilB = perfis.saveAndFlush(new Perfil(null, "Perfil B legado", null, b));
        // Simulates an inconsistent relationship created before owner validation existed.
        Tratamento legacy = tratamentos.saveAndFlush(new Tratamento(null, LocalDate.of(2026, 11, 9),
                null, 8, null, "NORMAL", true, perfilB, graphA.medicamento()));
        Historico history = historicos.saveAndFlush(new Historico(null, LocalDateTime.of(2026, 11, 9, 8, 0),
                null, "PENDENTE", legacy));

        mvc.perform(mutation(delete("/medicamentos/{id}", graphA.medicamento().getId()), sessionA, null))
                .andExpect(status().isConflict());
        assertTrue(medicamentos.existsById(graphA.medicamento().getId()));
        assertTrue(tratamentos.existsById(legacy.getId()));
        assertTrue(historicos.existsById(history.getId()));
    }

    @Test
    void registrosLegadosSemDonoSaoPreservadosSemSerAtribuidosAutomaticamente() throws Exception {
        Perfil legacyProfile = perfis.saveAndFlush(new Perfil(null, "Perfil legado", null, null));
        Medicamento legacyMedicine = medicamentos.saveAndFlush(new Medicamento(null, "Medicamento legado", "dose", null));
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        MockHttpSession session = login(a.getEmail());
        mvc.perform(get("/perfis").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/medicamentos").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(mutation(delete("/perfis/{id}", legacyProfile.getId()), session, null)).andExpect(status().isNotFound());
        mvc.perform(mutation(delete("/medicamentos/{id}", legacyMedicine.getId()), session, null)).andExpect(status().isNotFound());
        assertTrue(perfis.existsById(legacyProfile.getId()));
        assertTrue(medicamentos.existsById(legacyMedicine.getId()));
        assertNull(medicamentos.findById(legacyMedicine.getId()).orElseThrow().getUsuario());
    }

    @Test
    void mutacoesExigemCabecalhoDoAplicativoMesmoQuandoExisteSessao() throws Exception {
        Usuario a = cadastrar("Conta A", "conta.a@example.com");
        MockHttpSession session = login(a.getEmail());
        mvc.perform(post("/usuarios/login").contentType(MediaType.APPLICATION_JSON).content(loginJson(a.getEmail(), PASSWORD)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/usuarios/logout").session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/medicamentos").session(session).contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Recusado\"}"))
                .andExpect(status().isForbidden());
        assertEquals(0, medicamentos.count());
    }

    @Test
    void corsPermiteCredenciaisSomenteParaOrigensConfiguradas() throws Exception {
        mvc.perform(options("/usuarios/login")
                        .header("Origin", "http://localhost:8081")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-syncmed-client,x-syncmed-user"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(options("/usuarios/login")
                        .header("Origin", "https://origem-nao-autorizada.example")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-syncmed-client"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    private Usuario cadastrar(String nome, String email) throws Exception {
        MvcResult result = mvc.perform(mutation(post("/usuarios"), null,
                        "{\"nome\":\"%s\",\"email\":\"%s\",\"senha\":\"%s\",\"fusoHorario\":\"America/Fortaleza\"}"
                                .formatted(nome, email, PASSWORD)))
                .andExpect(status().isCreated()).andReturn();
        assertNoSecrets(result);
        assertNull(result.getRequest().getSession(false), "Cadastro conserva o fluxo de login explícito");
        return usuarios.findByEmail(email).orElseThrow();
    }

    private MockHttpSession login(String email) throws Exception {
        MvcResult result = mvc.perform(mutation(post("/usuarios/login"), null, loginJson(email, PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email)).andReturn();
        assertNoSecrets(result);
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "BCrypt válido deve criar uma sessão no servidor");
        return session;
    }

    private Graph criarGraph(MockHttpSession session, String suffix) throws Exception {
        mvc.perform(mutation(post("/perfis"), session, "{\"nome\":\"Perfil %s\"}".formatted(suffix)))
                .andExpect(status().isCreated());
        Perfil perfil = perfis.findAll().stream().filter(p -> p.getNome().equals("Perfil " + suffix)).findFirst().orElseThrow();
        mvc.perform(mutation(post("/medicamentos"), session, "{\"nome\":\"Medicamento %s\",\"unidadeMedida\":\"dose\"}".formatted(suffix)))
                .andExpect(status().isCreated());
        Medicamento medicamento = medicamentos.findAll().stream().filter(m -> m.getNome().equals("Medicamento " + suffix)).findFirst().orElseThrow();
        mvc.perform(mutation(post("/tratamentos"), session, tratamentoJson(perfil.getId(), medicamento.getId())))
                .andExpect(status().isCreated());
        Tratamento tratamento = tratamentos.findAll().stream().filter(t -> t.getPerfil().getId().equals(perfil.getId())).findFirst().orElseThrow();
        mvc.perform(mutation(post("/historicos"), session, historicoJson(tratamento.getId())))
                .andExpect(status().isCreated());
        Historico historico = historicos.findAll().stream().filter(h -> h.getTratamento().getId().equals(tratamento.getId())).findFirst().orElseThrow();
        return new Graph(perfil, medicamento, tratamento, historico);
    }

    private static String loginJson(String email, String password) {
        return "{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(email, password);
    }

    private static String tratamentoJson(Long perfilId, Long medicamentoId) {
        return "{\"dataInicio\":\"2026-11-09\",\"intervaloHoras\":8,\"nivelPrioridade\":\"NORMAL\",\"status\":true,\"perfil\":{\"id\":%d},\"medicamento\":{\"id\":%d}}"
                .formatted(perfilId, medicamentoId);
    }

    private static String historicoJson(Long tratamentoId) {
        return "{\"dataHoraPrevista\":\"2026-11-09T08:00:00\",\"status\":\"PENDENTE\",\"tratamento\":{\"id\":%d}}".formatted(tratamentoId);
    }

    private static MockHttpServletRequestBuilder mutation(MockHttpServletRequestBuilder request, MockHttpSession session, String json) {
        request.header(CLIENT_HEADER, "1");
        if (session != null) request.session(session);
        if (json != null) request.contentType(MediaType.APPLICATION_JSON).content(json);
        return request;
    }

    private static void assertNoSecrets(MvcResult result) throws Exception {
        String response = result.getResponse().getContentAsString();
        assertFalse(response.contains("\"senha\""), "Resposta não deve conter campo senha");
        assertFalse(response.contains(PASSWORD), "Resposta não deve ecoar a senha");
        assertFalse(response.contains("$2a$") || response.contains("$2b$") || response.contains("$2y$"),
                "Resposta não deve conter hashes BCrypt");
    }

    private record Graph(Perfil perfil, Medicamento medicamento, Tratamento tratamento, Historico historico) { }
}
