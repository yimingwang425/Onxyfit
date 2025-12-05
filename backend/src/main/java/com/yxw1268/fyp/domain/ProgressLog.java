package com.yxw1268.fyp.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A ProgressLog.
 */
@Entity
@Table(name = "progress_log")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ProgressLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "weight_kg", precision = 21, scale = 2)
    private BigDecimal weightKg;

    @NotNull
    @Column(name = "completed_workout", nullable = false)
    private Boolean completedWorkout;

    @Min(value = 0)
    @Max(value = 15000)
    @Column(name = "calories_intake")
    private Integer caloriesIntake;

    @Min(value = 0)
    @Max(value = 250000)
    @Column(name = "steps")
    private Integer steps;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "user" }, allowSetters = true)
    private UserProfile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "profile" }, allowSetters = true)
    private Plan plan;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public ProgressLog id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getLogDate() {
        return this.logDate;
    }

    public ProgressLog logDate(LocalDate logDate) {
        this.setLogDate(logDate);
        return this;
    }

    public void setLogDate(LocalDate logDate) {
        this.logDate = logDate;
    }

    public BigDecimal getWeightKg() {
        return this.weightKg;
    }

    public ProgressLog weightKg(BigDecimal weightKg) {
        this.setWeightKg(weightKg);
        return this;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public Boolean getCompletedWorkout() {
        return this.completedWorkout;
    }

    public ProgressLog completedWorkout(Boolean completedWorkout) {
        this.setCompletedWorkout(completedWorkout);
        return this;
    }

    public void setCompletedWorkout(Boolean completedWorkout) {
        this.completedWorkout = completedWorkout;
    }

    public Integer getCaloriesIntake() {
        return this.caloriesIntake;
    }

    public ProgressLog caloriesIntake(Integer caloriesIntake) {
        this.setCaloriesIntake(caloriesIntake);
        return this;
    }

    public void setCaloriesIntake(Integer caloriesIntake) {
        this.caloriesIntake = caloriesIntake;
    }

    public Integer getSteps() {
        return this.steps;
    }

    public ProgressLog steps(Integer steps) {
        this.setSteps(steps);
        return this;
    }

    public void setSteps(Integer steps) {
        this.steps = steps;
    }

    public String getNotes() {
        return this.notes;
    }

    public ProgressLog notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public ProgressLog createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UserProfile getProfile() {
        return this.profile;
    }

    public void setProfile(UserProfile userProfile) {
        this.profile = userProfile;
    }

    public ProgressLog profile(UserProfile userProfile) {
        this.setProfile(userProfile);
        return this;
    }

    public Plan getPlan() {
        return this.plan;
    }

    public void setPlan(Plan plan) {
        this.plan = plan;
    }

    public ProgressLog plan(Plan plan) {
        this.setPlan(plan);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProgressLog)) {
            return false;
        }
        return getId() != null && getId().equals(((ProgressLog) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ProgressLog{" +
            "id=" + getId() +
            ", logDate='" + getLogDate() + "'" +
            ", weightKg=" + getWeightKg() +
            ", completedWorkout='" + getCompletedWorkout() + "'" +
            ", caloriesIntake=" + getCaloriesIntake() +
            ", steps=" + getSteps() +
            ", notes='" + getNotes() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            "}";
    }
}
