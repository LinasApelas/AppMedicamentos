package br.edu.uninassau.alarme.security;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordStorageDiagnosticTest {
    private final PasswordStorageDiagnostic diagnostic = new PasswordStorageDiagnostic();

    @Test
    void retornaSomenteAgregadosSemClassificarFormatoIndeterminadoComoTextoPuro() throws Exception {
        JdbcDataSource source = database("VARCHAR(255)");
        insert(source, null);
        insert(source, "");
        insert(source, "senha-ficticia");
        insert(source, new BCryptPasswordEncoder().encode("senha-ficticia"));
        insert(source, "$2a$10$incompleto");
        insert(source, "$2a$99$" + "a".repeat(53));
        insert(source, "á".repeat(37)); // 37 characters, 74 UTF-8 bytes.

        var report = diagnostic.inspect(source);
        assertEquals(7, report.total());
        assertEquals(1, report.nullValues());
        assertEquals(1, report.emptyValues());
        assertEquals(1, report.bcryptCandidates());
        assertEquals(4, report.indeterminateValues());
        assertEquals(1, report.indeterminateOver72Utf8Bytes());
        assertEquals(255, report.columnPrecision());
        assertEquals(PasswordStorageDiagnostic.Capacity.SUFFICIENT, report.rawBcryptCapacity());
        assertFalse(report.toString().contains("senha-ficticia"));
        assertFalse(report.toString().contains("$2"));
    }

    @Test
    void estruturaCompletaNaoProvaQueValorFoiCodificado() throws Exception {
        JdbcDataSource source = database("VARCHAR(255)");
        // A user could have chosen a literal string with this structure.
        insert(source, "$2a$10$" + "a".repeat(53));
        assertEquals(1, diagnostic.inspect(source).bcryptCandidates());
    }

    @Test
    void detectaColunaCurtaMesmoSemRegistros() throws Exception {
        var report = diagnostic.inspect(database("VARCHAR(59)"));
        assertEquals(0, report.total());
        assertEquals(PasswordStorageDiagnostic.Capacity.INSUFFICIENT, report.rawBcryptCapacity());
    }

    @Test
    void aceitaCapacidadeExataDeHashSemPrefixo() throws Exception {
        assertEquals(PasswordStorageDiagnostic.Capacity.SUFFICIENT,
                diagnostic.inspect(database("VARCHAR(60)")).rawBcryptCapacity());
    }

    @Test
    void naoAssumeCapacidadeDeTiposNaoTextuais() throws Exception {
        assertEquals(PasswordStorageDiagnostic.Capacity.UNKNOWN,
                diagnostic.inspect(database("VARBINARY(255)")).rawBcryptCapacity());
    }

    @Test
    void usaTransacaoSomenteLeituraRollbackENaoAlteraDados() throws Exception {
        JdbcDataSource actual = database("VARCHAR(255)");
        insert(actual, "senha-ficticia");
        DataSource source = mock(DataSource.class);
        Connection connection = spy(actual.getConnection());
        when(source.getConnection()).thenReturn(connection);

        diagnostic.inspect(source);

        verify(connection).setReadOnly(true);
        verify(connection).setAutoCommit(false);
        verify(connection).rollback();
        verify(connection, never()).commit();
        verify(connection).close();
        try (var c = actual.getConnection(); var statement = c.createStatement();
             var rows = statement.executeQuery("SELECT COUNT(*) FROM usuario WHERE senha = 'senha-ficticia'")) {
            assertTrue(rows.next());
            assertEquals(1, rows.getLong(1));
        }
    }

    @Test
    void naoExpoeDetalhesDeFalhasDoDriver() throws Exception {
        DataSource source = mock(DataSource.class);
        when(source.getConnection()).thenThrow(new SQLException("DETALHE_SENSIVEL_FICTICIO"));
        var exception = assertThrows(IllegalStateException.class, () -> diagnostic.inspect(source));
        assertFalse(exception.toString().contains("DETALHE_SENSIVEL_FICTICIO"));
        assertNull(exception.getCause());
    }

    private JdbcDataSource database(String columnType) throws Exception {
        JdbcDataSource source = new JdbcDataSource();
        source.setURL("jdbc:h2:mem:diagnostic_" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1");
        try (var c = source.getConnection(); var statement = c.createStatement()) {
            // The nullable column intentionally exercises inconsistent legacy schemas.
            statement.execute("CREATE TABLE usuario (senha " + columnType + ")");
        }
        return source;
    }

    private void insert(DataSource source, String value) throws Exception {
        try (var c = source.getConnection(); var statement = c.prepareStatement("INSERT INTO usuario (senha) VALUES (?)")) {
            statement.setString(1, value);
            statement.executeUpdate();
        }
    }
}
