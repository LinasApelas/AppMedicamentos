package br.edu.uninassau.alarme.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Identity is set only after BCrypt authentication; client IDs are never credentials. */
public final class SessaoUsuario {
    public static final String USUARIO_ID = "syncmed.usuarioId";
    public static final int DURACAO_SEGUNDOS = 7 * 24 * 60 * 60;

    private SessaoUsuario() { }

    public static Long exigirId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute(USUARIO_ID) instanceof Long id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        // Cookies are shared across browser tabs. This is only a consistency check;
        // the header never establishes identity or replaces the authenticated session.
        String expectedUser = request.getHeader("X-SyncMed-User");
        if (expectedUser != null && !id.toString().equals(expectedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return id;
    }

    public static void iniciar(HttpServletRequest request, Long usuarioId) {
        HttpSession anterior = request.getSession(false);
        if (anterior != null) anterior.invalidate();
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(DURACAO_SEGUNDOS);
        session.setAttribute(USUARIO_ID, usuarioId);
    }

    public static void encerrar(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        Cookie cookie = new Cookie("JSESSIONID", "");
        cookie.setPath(request.getContextPath().isEmpty() ? "/" : request.getContextPath());
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure());
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}
