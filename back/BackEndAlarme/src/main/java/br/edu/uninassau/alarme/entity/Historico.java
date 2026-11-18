package br.edu.uninassau.alarme.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "historico", uniqueConstraints = @UniqueConstraint(columnNames = {"medicamento_id", "ocorrencia"}))
public class Historico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora_prevista", nullable = false)
    private LocalDateTime dataHoraPrevista;

    @Column(name = "data_hora_realizada")
    private LocalDateTime dataHoraRealizada;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "tratamento_id")
    @JsonIgnoreProperties("historicos")
    private Tratamento tratamento;

    @ManyToOne
    @JoinColumn(name = "medicamento_id")
    @JsonIgnoreProperties({"tratamentos", "registrosLembretes"})
    private Medicamento medicamento;
    @Column(length = 200)
    private String ocorrencia;
    public Medicamento getMedicamento() { return medicamento; }
    public void setMedicamento(Medicamento valor) { medicamento = valor; }
    public String getOcorrencia() { return ocorrencia; }
    public void setOcorrencia(String valor) { ocorrencia = valor; }
    public Historico() {}

    public Historico(Long id, LocalDateTime dataHoraPrevista, LocalDateTime dataHoraRealizada, 
                     String status, Tratamento tratamento) {
        this.id = id;
        this.dataHoraPrevista = dataHoraPrevista;
        this.dataHoraRealizada = dataHoraRealizada;
        this.status = status;
        this.tratamento = tratamento;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDataHoraPrevista() { return dataHoraPrevista; }
    public void setDataHoraPrevista(LocalDateTime dataHoraPrevista) { this.dataHoraPrevista = dataHoraPrevista; }

    public LocalDateTime getDataHoraRealizada() { return dataHoraRealizada; }
    public void setDataHoraRealizada(LocalDateTime dataHoraRealizada) { this.dataHoraRealizada = dataHoraRealizada; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Tratamento getTratamento() { return tratamento; }
    public void setTratamento(Tratamento tratamento) { this.tratamento = tratamento; }
}
