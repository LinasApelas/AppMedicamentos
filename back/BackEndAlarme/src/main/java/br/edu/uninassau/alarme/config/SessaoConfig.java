package br.edu.uninassau.alarme.config;

import br.edu.uninassau.alarme.security.SessaoUsuario;
import jakarta.servlet.SessionTrackingMode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Set;

@Configuration
public class SessaoConfig implements WebMvcConfigurer {
    private final String[] origins;
    private final boolean secureCookie;

    public SessaoConfig(
            @Value("${syncmed.cors.allowed-origins:http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006}") String[] origins,
            @Value("${syncmed.session.cookie-secure:false}") boolean secureCookie) {
        this.origins = origins;
        this.secureCookie = secureCookie;
    }

    @Bean
    ServletContextInitializer sessionCookies() {
        return context -> {
            context.setSessionTrackingModes(Set.of(SessionTrackingMode.COOKIE));
            context.setSessionTimeout(SessaoUsuario.DURACAO_SEGUNDOS / 60);
            var cookie = context.getSessionCookieConfig();
            cookie.setName("JSESSIONID");
            cookie.setHttpOnly(true);
            cookie.setSecure(secureCookie);
            cookie.setMaxAge(SessaoUsuario.DURACAO_SEGUNDOS);
            cookie.setAttribute("SameSite", "Lax");
        };
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "X-SyncMed-Client", "X-SyncMed-User")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                response.setHeader("Cache-Control", "no-store");
                String method = request.getMethod();
                if ("OPTIONS".equals(method)) return true;
                // Browsers cannot attach this header cross-origin without a successful CORS preflight.
                if (!Set.of("GET", "HEAD").contains(method)
                        && !"1".equals(request.getHeader("X-SyncMed-Client"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                }
                String path = request.getServletPath();
                if (path.isEmpty()) path = request.getRequestURI().substring(request.getContextPath().length());
                boolean publicAction = "POST".equals(method) && Set.of(
                        "/usuarios", "/usuarios/login", "/usuarios/logout").contains(path);
                if (!publicAction) SessaoUsuario.exigirId(request);
                return true;
            }
        }).addPathPatterns("/usuarios", "/usuarios/**", "/perfis", "/perfis/**",
                "/medicamentos", "/medicamentos/**", "/tratamentos", "/tratamentos/**",
                "/historicos", "/historicos/**");
    }
}
