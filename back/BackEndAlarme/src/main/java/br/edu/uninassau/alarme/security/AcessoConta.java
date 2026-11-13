package br.edu.uninassau.alarme.security;

import br.edu.uninassau.alarme.entity.*;
import br.edu.uninassau.alarme.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Resolve every relationship inside the authenticated account before writing it. */
@Component
public class AcessoConta {
    private final UsuarioRepository usuarios;
    private final PerfilRepository perfis;
    private final MedicamentoRepository medicamentos;
    private final TratamentoRepository tratamentos;
    private final HistoricoRepository historicos;

    public AcessoConta(UsuarioRepository usuarios, PerfilRepository perfis, MedicamentoRepository medicamentos,
                      TratamentoRepository tratamentos, HistoricoRepository historicos) {
        this.usuarios = usuarios;
        this.perfis = perfis;
        this.medicamentos = medicamentos;
        this.tratamentos = tratamentos;
        this.historicos = historicos;
    }

    public Usuario usuario(Long id) {
        return usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public Perfil perfil(Long id, Long usuarioId) {
        if (id == null) throw naoEncontrado();
        return perfis.findByIdAndUsuarioId(id, usuarioId).orElseThrow(AcessoConta::naoEncontrado);
    }

    public Medicamento medicamento(Long id, Long usuarioId) {
        if (id == null) throw naoEncontrado();
        return medicamentos.findByIdAndUsuarioId(id, usuarioId).orElseThrow(AcessoConta::naoEncontrado);
    }

    public Tratamento tratamento(Long id, Long usuarioId) {
        if (id == null) throw naoEncontrado();
        return tratamentos.findByIdAndPerfilUsuarioIdAndMedicamentoUsuarioId(id, usuarioId, usuarioId)
                .orElseThrow(AcessoConta::naoEncontrado);
    }

    public Historico historico(Long id, Long usuarioId) {
        if (id == null) throw naoEncontrado();
        return historicos.findByIdAndTratamentoPerfilUsuarioIdAndTratamentoMedicamentoUsuarioId(id, usuarioId, usuarioId)
                .orElseThrow(AcessoConta::naoEncontrado);
    }

    public void verificarExclusaoUsuario(Long usuarioId) {
        // Preserve ambiguous legacy relationships, including database-level cascades.
        if (tratamentos.usuarioPossuiVinculoDeOutraConta(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
    }

    private static ResponseStatusException naoEncontrado() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
}
