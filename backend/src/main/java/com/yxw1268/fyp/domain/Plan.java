package com.yxw1268.fyp.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.yxw1268.fyp.domain.enumeration.WorkoutType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Plan.
 */
@Entity
@Table(name = "plan")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Plan implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Min(value = 100)
    @Max(value = 6000)
    @Column(name = "calories_kcal", nullable = false)
    private Integer caloriesKcal;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "500")
    @Column(name = "protein_g", precision = 21, scale = 2, nullable = false)
    private BigDecimal proteinG;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "1000")
    @Column(name = "carbs_g", precision = 21, scale = 2, nullable = false)
    private BigDecimal carbsG;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "1000")
    @Column(name = "fat_g", precision = 21, scale = 2, nullable = false)
    private BigDecimal fatG;

    @Enumerated(EnumType.STRING)
    @Column(name = "workout_type")
    private WorkoutType workoutType;

    @DecimalMin(value = "0")
    @DecimalMax(value = "1")
    @Column(name = "workout_intensity", precision = 21, scale = 2)
    private BigDecimal workoutIntensity;

    @NotNull
    @Column(name = "source", nullable = false)
    private String source;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "meal_plan_json", columnDefinition = "TEXT")
    private String mealPlanJson;

    @Column(name = "workout_plan_json", columnDefinition = "TEXT")
    private String workoutPlanJson;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "user" }, allowSetters = true)
    private UserProfile profile;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Plan id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCaloriesKcal() {
        return this.caloriesKcal;
    }

    public Plan caloriesKcal(Integer caloriesKcal) {
        this.setCaloriesKcal(caloriesKcal);
        return this;
    }

    public void setCaloriesKcal(Integer caloriesKcal) {
        this.caloriesKcal = caloriesKcal;
    }

    public BigDecimal getProteinG() {
        return this.proteinG;
    }

    public Plan proteinG(BigDecimal proteinG) {
        this.setProteinG(proteinG);
        return this;
    }

    public void setProteinG(BigDecimal proteinG) {
        this.proteinG = proteinG;
    }

    public BigDecimal getCarbsG() {
        return this.carbsG;
    }

    public Plan carbsG(BigDecimal carbsG) {
        this.setCarbsG(carbsG);
        return this;
    }

    public void setCarbsG(BigDecimal carbsG) {
        this.carbsG = carbsG;
    }

    public BigDecimal getFatG() {
        return this.fatG;
    }

    public Plan fatG(BigDecimal fatG) {
        this.setFatG(fatG);
        return this;
    }

    public void setFatG(BigDecimal fatG) {
        this.fatG = fatG;
    }

    public WorkoutType getWorkoutType() {
        return this.workoutType;
    }

    public Plan workoutType(WorkoutType workoutType) {
        this.setWorkoutType(workoutType);
        return this;
    }

    public void setWorkoutType(WorkoutType workoutType) {
        this.workoutType = workoutType;
    }

    public BigDecimal getWorkoutIntensity() {
        return this.workoutIntensity;
    }

    public Plan workoutIntensity(BigDecimal workoutIntensity) {
        this.setWorkoutIntensity(workoutIntensity);
        return this;
    }

    public void setWorkoutIntensity(BigDecimal workoutIntensity) {
        this.workoutIntensity = workoutIntensity;
    }

    public String getSource() {
        return this.source;
    }

    public Plan source(String source) {
        this.setSource(source);
        return this;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Plan createdAt(Instant createdAt) {
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

    public Plan profile(UserProfile userProfile) {
        this.setProfile(userProfile);
        return this;
    }

    public String getMealPlanJson() {
        return this.mealPlanJson;
    }

    public Plan mealPlanJson(String mealPlanJson) {
        this.setMealPlanJson(mealPlanJson);
        return this;
    }

    public void setMealPlanJson(String mealPlanJson) {
        this.mealPlanJson = mealPlanJson;
    }

    public String getWorkoutPlanJson() {
        return this.workoutPlanJson;
    }

    public Plan workoutPlanJson(String workoutPlanJson) {
        this.setWorkoutPlanJson(workoutPlanJson);
        return this;
    }

    public void setWorkoutPlanJson(String workoutPlanJson) {
        this.workoutPlanJson = workoutPlanJson;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Plan)) {
            return false;
        }
        return getId() != null && getId().equals(((Plan) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Plan{" +
            "id=" + getId() +
            ", caloriesKcal=" + getCaloriesKcal() +
            ", proteinG=" + getProteinG() +
            ", carbsG=" + getCarbsG() +
            ", fatG=" + getFatG() +
            ", workoutType='" + getWorkoutType() + "'" +
            ", workoutIntensity=" + getWorkoutIntensity() +
            ", source='" + getSource() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", mealPlanJson='" + (getMealPlanJson() != null ? "..." : "null") + "'" +
            ", workoutPlanJson='" + (getWorkoutPlanJson() != null ? "..." : "null") + "'" +
            "}";
    }
}