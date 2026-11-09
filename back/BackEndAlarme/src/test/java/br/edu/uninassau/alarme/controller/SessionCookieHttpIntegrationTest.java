package br.edu.uninassau.alarme.controller;

import br.edu.uninassau.alarme.BackEnd3NaApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Container-level checks using an isolated H2 database; never connects to AppAlarme. */
@SpringBootTest(classes = BackEnd3NaApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:session-http-test;DB_CLOSE_DELAY=-1")
@ActiveProfiles("test")
class SessionCookieHttpIntegrationTest {
    @LocalServerPort private int port;

    @Test
    void cookiePersistenteRestauraContaEmNovoClienteELogoutRevogaSessao() throws Exception {
        String email = "http-session-" + UUID.randomUUID() + "@example.com";
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient originalClient = client(cookies);
        HttpResponse<String> cadastro = send(originalClient, "POST", "/usuarios",
                "{\"nome\":\"Conta HTTP\",\"email\":\"" + email + "\",\"senha\":\"senha-ficticia-http\"}");
        assertEquals(201, cadastro.statusCode());

        HttpResponse<String> login = send(originalClient, "POST", "/usuarios/login",
                "{\"email\":\"" + email + "\",\"senha\":\"senha-ficticia-http\"}");
        assertEquals(200, login.statusCode());
        List<String> cookieHeaders = login.headers().allValues("set-cookie");
        assertTrue(cookieHeaders.stream().anyMatch(value -> value.startsWith("JSESSIONID=")),
                "Container deve emitir o cookie de sessão padrão");
        assertTrue(cookieHeaders.stream().anyMatch(value -> value.toLowerCase().contains("httponly")),
                "Cookie de sessão deve ser HttpOnly");
        assertTrue(cookieHeaders.stream().anyMatch(value -> value.toLowerCase().contains("max-age=")),
                "Cookie deve ter duração persistente para sobreviver ao fechamento do app");
        assertTrue(cookieHeaders.stream().anyMatch(value -> value.toLowerCase().contains("samesite=lax")),
                "Cookie deve restringir envio cross-site");

        HttpCookie sessionCookie = cookies.getCookieStore().getCookies().stream()
                .filter(cookie -> cookie.getName().equals("JSESSIONID")).findFirst().orElseThrow();
        assertTrue(sessionCookie.getMaxAge() > 0, "Duração positiva permite persistência no cliente");
        String oldCookie = sessionCookie.getName() + "=" + sessionCookie.getValue();

        // A new HTTP client reuses the cookie jar, just as the app does after JS initialization.
        HttpClient reopenedClient = client(cookies);
        HttpResponse<String> restored = send(reopenedClient, "GET", "/usuarios/me", null);
        assertEquals(200, restored.statusCode());
        assertTrue(restored.body().contains(email), "Restauração deve identificar a conta original");
        assertFalse(restored.body().contains("\"senha\""), "Restauração não deve expor senha");
        assertEquals(401, send(client(new CookieManager()), "GET", "/usuarios/me", null).statusCode());

        assertEquals(204, send(reopenedClient, "POST", "/usuarios/logout", null).statusCode());
        assertEquals(401, send(reopenedClient, "GET", "/usuarios/me", null).statusCode());
        HttpRequest replay = HttpRequest.newBuilder(uri("/usuarios/me"))
                .timeout(Duration.ofSeconds(10)).header("Cookie", oldCookie).GET().build();
        HttpResponse<String> invalidated = HttpClient.newHttpClient().send(replay, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, invalidated.statusCode(), "O cookie antigo deve perder acesso também no servidor");
    }

    private HttpClient client(CookieManager cookies) {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).cookieHandler(cookies).build();
    }

    private HttpResponse<String> send(HttpClient client, String method, String path, String json) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(10));
        if (!method.equals("GET")) builder.header("X-SyncMed-Client", "1");
        if (json != null) builder.header("Content-Type", "application/json");
        builder.method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json));
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
