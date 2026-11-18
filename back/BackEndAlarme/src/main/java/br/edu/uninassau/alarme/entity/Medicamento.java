package br.edu.uninassau.alarme.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicamento")
public class Medicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(name = "unidade_medida")
    private String unidadeMedida;

    private String descricao;
    @Column(name = "nivel_aviso", nullable = false, length = 20)
    @org.hibernate.annotations.ColumnDefault("'NOTIFICACAO'")
    private String nivelAviso = "NOTIFICACAO";
    private String dosagem;
    public String getNivelAviso() { return nivelAviso; }
    public void setNivelAviso(String valor) {
        if (valor != null && !valor.equals("NOTIFICACAO") && !valor.equals("ALARME"))
            throw new IllegalArgumentException("Nível de aviso inválido");
        nivelAviso = valor == null ? "NOTIFICACAO" : valor;
    }
    public String getDosagem() { return dosagem; }
    public void setDosagem(String valor) { dosagem = valor; }
    @OneToMany(mappedBy = "medicamento", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @JsonIgnore
    private List<Historico> registrosLembretes = new ArrayList<>();
    public void adicionarRegistroLembrete(Historico historico) {
        registrosLembretes.add(historico);
        historico.setMedicamento(this);
    }

    // Nullable preserves existing rows; unowned legacy data is not assigned by guessing.
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    @OneToMany(mappedBy = "medicamento", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Tratamento> tratamentos = new ArrayList<>();

    public Medicamento() {}

    public Medicamento(Long id, String nome, String unidadeMedida, String descricao) {
        this.id = id;
        this.nome = nome;
        this.unidadeMedida = unidadeMedida;
        this.descricao = descricao;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}
