package br.edu.uninassau.alarme.repository;

import br.edu.uninassau.alarme.entity.*;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.relational.internal.SqlStringGenerationContextImpl;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.mapping.Table;
import org.hibernate.tool.schema.extract.spi.ColumnInformation;
import org.hibernate.tool.schema.extract.spi.TableInformation;
import org.hibernate.tool.schema.internal.StandardTableMigrator;
import org.junit.jupiter.api.Test;
import java.sql.Types;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NivelAvisoSchemaTest {
    @Test
    void atualizacaoPostgresSeparaTipoEDefaultSemConectarAoBanco() {
        var registry = new StandardServiceRegistryBuilder()
            .applySetting("hibernate.dialect", PostgreSQLDialect.class.getName())
            .applySetting("hibernate.boot.allow_jdbc_metadata_access", false).build();
        try {
            var metadata = new MetadataSources(registry)
                .addAnnotatedClass(Medicamento.class).addAnnotatedClass(Historico.class)
                .addAnnotatedClass(Tratamento.class).addAnnotatedClass(Perfil.class)
                .addAnnotatedClass(Usuario.class).buildMetadata();
            var entity = metadata.getEntityBinding(Medicamento.class.getName());
            var column = entity.getTable().getColumn(Identifier.toIdentifier("nivel_aviso"));
            assertEquals("varchar(20)", column.getSqlType(metadata));
            assertEquals("'NOTIFICACAO'", column.getDefaultValue());
            // Simulates the legacy varchar(255) column reported by JDBC metadata.
            var old = mock(ColumnInformation.class);
            when(old.getTypeCode()).thenReturn(Types.VARCHAR);
            when(old.getTypeName()).thenReturn("varchar");
            when(old.getColumnSize()).thenReturn(255);
            var existing = mock(TableInformation.class);
            when(existing.getColumn(Identifier.toIdentifier("nivel_aviso"))).thenReturn(old);
            var table = new Table();
            table.setName("medicamento");
            table.addColumn(column);
            var context = SqlStringGenerationContextImpl.forTests(metadata.getDatabase().getJdbcEnvironment());
            var sql = new StandardTableMigrator(new PostgreSQLDialect()).getSqlAlterStrings(table, metadata, existing, context);
            assertTrue(sql.length > 0);
            assertTrue(String.join(";", sql).contains("set data type varchar(20)"));
            assertFalse(String.join(";", sql).contains("varchar(20) default"));
            assertTrue(metadata.getEntityBinding(Historico.class.getName()).getTable()
                .getColumn(Identifier.toIdentifier("tratamento_id")).isNullable());
        } finally { StandardServiceRegistryBuilder.destroy(registry); }
    }
}
