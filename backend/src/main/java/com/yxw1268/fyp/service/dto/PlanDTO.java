package com.yxw1268.fyp.service.dto;

import com.yxw1268.fyp.domain.enumeration.WorkoutType;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.yxw1268.fyp.domain.Plan} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PlanDTO implements Serializable {

    private Long id;

    @NotNull
    @Min(value = 100)
    @Max(value = 6000)
    private Integer caloriesKcal;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "500")
    private BigDecimal proteinG;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "1000")
    private BigDecimal carbsG;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "1000")
    private BigDecimal fatG;

    private WorkoutType workoutType;

    @DecimalMin(value = "0")
    @DecimalMax(value = "1")
    private BigDecimal workoutIntensity;

    @NotNull
    private String source;

    @NotNull
    private Instant createdAt;

    @NotNull
    private UserProfileDTO profile;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCaloriesKcal() {
        return caloriesKcal;
    }

    public void setCaloriesKcal(Integer caloriesKcal) {
        this.caloriesKcal = caloriesKcal;
    }

    public BigDecimal getProteinG() {
        return proteinG;
    }

    public void setProteinG(BigDecimal proteinG) {
        this.proteinG = proteinG;
    }

    public BigDecimal getCarbsG() {
        return carbsG;
    }

    public void setCarbsG(BigDecimal carbsG) {
        this.carbsG = carbsG;
    }

    public BigDecimal getFatG() {
        return fatG;
    }

    public void setFatG(BigDecimal fatG) {
        this.fatG = fatG;
    }

    public WorkoutType getWorkoutType() {
        return workoutType;
    }

    public void setWorkoutType(WorkoutType workoutType) {
        this.workoutType = workoutType;
    }

    public BigDecimal getWorkoutIntensity() {
        return workoutIntensity;
    }

    public void setWorkoutIntensity(BigDecimal workoutIntensity) {
        this.workoutIntensity = workoutIntensity;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PlanDTO)) {
            return false;
        }

        PlanDTO planDTO = (PlanDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, planDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PlanDTO{" +
            "id=" + getId() +
            ", caloriesKcal=" + getCaloriesKcal() +
            ", proteinG=" + getProteinG() +
            ", carbsG=" + getCarbsG() +
            ", fatG=" + getFatG() +
            ", workoutType='" + getWorkoutType() + "'" +
            ", workoutIntensity=" + getWorkoutIntensity() +
            ", source='" + getSource() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", profile=" + getProfile() +
            "}";
    }
}
