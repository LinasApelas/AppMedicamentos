package br.edu.uninassau.alarme.security;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.regex.Pattern;

/**
 * Explicit, read-only JDBC diagnostic. Intentionally not a Spring bean, endpoint,
 * runner or migration. No individual values or identifiers leave this class.
 */
public final class PasswordStorageDiagnostic {
    private static final Pattern BCRYPT_STRUCTURE = Pattern.compile(
            "\\A\\$2[aby]\\$(?:0[4-9]|[12][0-9]|3[01])\\$[./A-Za-z0-9]{53}\\z");

    public enum Capacity { SUFFICIENT, INSUFFICIENT, UNKNOWN }

    public record Report(long total, long nullValues, long emptyValues,
                         long bcryptCandidates, long indeterminateValues,
                         long indeterminateOver72Utf8Bytes,
                         int columnPrecision, Capacity rawBcryptCapacity) { }

    public Report inspect(DataSource source) {
        try (Connection connection = source.getConnection()) {
            // Database privileges must enforce read-only access in production.
            // setReadOnly is only a driver hint on some databases (including H2).
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            try {
                try (var statement = connection.prepareStatement("SELECT senha FROM usuario",
                        ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)) {
                    statement.setFetchSize(500);
                    try (var rows = statement.executeQuery()) {
                        var metadata = rows.getMetaData();
                        int precision = metadata.getPrecision(1);
                        int type = metadata.getColumnType(1);
                        Capacity capacity = capacity(type, precision);
                        long total = 0, nulls = 0, empty = 0, candidates = 0, unknown = 0, over72 = 0;
                        while (rows.next()) {
                            total++;
                            String value = rows.getString(1);
                            if (value == null) {
                                nulls++;
                            } else if (value.isEmpty()) {
                                empty++;
                            } else if (BCRYPT_STRUCTURE.matcher(value).matches()) {
                                // Structural compatibility is NOT proof of origin or validity.
                                candidates++;
                            } else {
                                unknown++;
                                if (value.getBytes(StandardCharsets.UTF_8).length > 72) {
                                    over72++;
                                }
                            }
                        }
                        return new Report(total, nulls, empty, candidates, unknown, over72,
                                precision, capacity);
                    }
                }
            } finally {
                connection.rollback();
            }
        } catch (SQLException exception) {
            // Driver messages/causes may contain connection details or data.
            throw new IllegalStateException("Não foi possível concluir o diagnóstico de senhas.");
        }
    }

    private static Capacity capacity(int type, int precision) {
        if (type != Types.VARCHAR && type != Types.NVARCHAR
                && type != Types.LONGVARCHAR && type != Types.LONGNVARCHAR) {
            return Capacity.UNKNOWN;
        }
        if (precision <= 0) {
            return Capacity.UNKNOWN;
        }
        // Raw BCrypt uses 60 characters; this does not cover a {bcrypt} prefix.
        return precision >= 60 ? Capacity.SUFFICIENT : Capacity.INSUFFICIENT;
    }
}
