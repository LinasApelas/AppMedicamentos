package br.edu.uninassau.alarme.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tratamento")
public class Tratamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim; 

    @Column(name = "intervalo_horas", nullable = false)
    private Integer intervaloHoras;

    @Column(name = "som_alarme")
    private String somAlarme;

    @Column(name = "nivel_prioridade", nullable = false)
    private String nivelPrioridade;

    @Column(nullable = false)
    private Boolean status;

    @ManyToOne
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    @OneToMany(mappedBy = "tratamento", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Historico> historicos = new ArrayList<>();

    public Tratamento() {}

    public Tratamento(Long id, LocalDate dataInicio, LocalDate dataFim, Integer intervaloHoras, 
                      String somAlarme, String nivelPrioridade, Boolean status, 
                      Perfil perfil, Medicamento medicamento) {
        this.id = id;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.intervaloHoras = intervaloHoras;
        this.somAlarme = somAlarme;
        this.nivelPrioridade = nivelPrioridade;
        this.status = status;
        this.perfil = perfil;
        this.medicamento = medicamento;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataFim() { return dataFim; }
    public void setDataFim(LocalDate dataFim) { this.dataFim = dataFim; }

    public Integer getIntervaloHoras() { return intervaloHoras; }
    public void setIntervaloHoras(Integer intervaloHoras) { this.intervaloHoras = intervaloHoras; }

    public String getSomAlarme() { return somAlarme; }
    public void setSomAlarme(String somAlarme) { this.somAlarme = somAlarme; }

    public String getNivelPrioridade() { return nivelPrioridade; }
    public void setNivelPrioridade(String nivelPrioridade) { this.nivelPrioridade = nivelPrioridade; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }

    public Perfil getPerfil() { return perfil; }
    public void setPerfil(Perfil perfil) { this.perfil = perfil; }

    public Medicamento getMedicamento() { return medicamento; }
    public void setMedicamento(Medicamento medicamento) { this.medicamento = medicamento; }

    public List<Historico> getHistoricos() { return historicos; }
    public void setHistoricos(List<Historico> historicos) { this.historicos = historicos; }
}