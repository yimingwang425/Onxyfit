package com.yxw1268.fyp.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * A DTO for the {@link com.yxw1268.fyp.domain.ProgressLog} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ProgressLogDTO implements Serializable {

    private Long id;

    @NotNull
    private LocalDate logDate;

    private BigDecimal weightKg;

    @NotNull
    private Boolean completedWorkout;

    @Min(value = 0)
    @Max(value = 15000)
    private Integer caloriesIntake;

    @Min(value = 0)
    @Max(value = 250000)
    private Integer steps;

    @Size(max = 1000)
    private String notes;

    @NotNull
    private Instant createdAt;

    @NotNull
    private UserProfileDTO profile;

    private PlanDTO plan;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getLogDate() {
        return logDate;
    }

    public void setLogDate(LocalDate logDate) {
        this.logDate = logDate;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public Boolean getCompletedWorkout() {
        return completedWorkout;
    }

    public void setCompletedWorkout(Boolean completedWorkout) {
        this.completedWorkout = completedWorkout;
    }

    public Integer getCaloriesIntake() {
        return caloriesIntake;
    }

    public void setCaloriesIntake(Integer caloriesIntake) {
        this.caloriesIntake = caloriesIntake;
    }

    public Integer getSteps() {
        return steps;
    }

    public void setSteps(Integer steps) {
        this.steps = steps;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UserProfileDTO getProfile() {
        return profile;
    }

    public void setProfile(UserProfileDTO profile) {
        this.profile = profile;
    }

    public PlanDTO getPlan() {
        return plan;
    }

    public void setPlan(PlanDTO plan) {
        this.plan = plan;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProgressLogDTO)) {
            return false;
        }

        ProgressLogDTO progressLogDTO = (ProgressLogDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, progressLogDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ProgressLogDTO{" +
            "id=" + getId() +
            ", logDate='" + getLogDate() + "'" +
            ", weightKg=" + getWeightKg() +
            ", completedWorkout='" + getCompletedWorkout() + "'" +
            ", caloriesIntake=" + getCaloriesIntake() +
            ", steps=" + getSteps() +
            ", notes='" + getNotes() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", profile=" + getProfile() +
            ", plan=" + getPlan() +
            "}";
    }
}
