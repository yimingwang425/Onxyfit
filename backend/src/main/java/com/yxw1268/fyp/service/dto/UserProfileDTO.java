package com.yxw1268.fyp.service.dto;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.domain.enumeration.MetabolicProfile;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.yxw1268.fyp.domain.UserProfile} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserProfileDTO implements Serializable {

    private Long id;

    @NotNull
    @Min(value = 10)
    @Max(value = 100)
    private Integer age;

    @NotNull
    @DecimalMin(value = "80")
    @DecimalMax(value = "380")
    private BigDecimal heightCm;

    @NotNull
    private BigDecimal weightKg;

    @NotNull
    private ActivityLevel activityLevel;

    @NotNull
    private Goal goal;

    @NotNull
    private DietPref dietPref;

    @NotNull
    private MetabolicProfile metabolicProfile;

    @NotNull
    private Instant createdAt;

    @NotNull
    private UserDTO user;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public BigDecimal getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(BigDecimal heightCm) {
        this.heightCm = heightCm;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public ActivityLevel getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(ActivityLevel activityLevel) {
        this.activityLevel = activityLevel;
    }

    public Goal getGoal() {
        return goal;
    }

    public void setGoal(Goal goal) {
        this.goal = goal;
    }

    public DietPref getDietPref() {
        return dietPref;
    }

    public void setDietPref(DietPref dietPref) {
        this.dietPref = dietPref;
    }

    public MetabolicProfile getMetabolicProfile() {
        return metabolicProfile;
    }

    public void setMetabolicProfile(MetabolicProfile metabolicProfile) {
        this.metabolicProfile = metabolicProfile;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserProfileDTO)) {
            return false;
        }

        UserProfileDTO userProfileDTO = (UserProfileDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, userProfileDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UserProfileDTO{" +
            "id=" + getId() +
            ", age=" + getAge() +
            ", heightCm=" + getHeightCm() +
            ", weightKg=" + getWeightKg() +
            ", activityLevel='" + getActivityLevel() + "'" +
            ", goal='" + getGoal() + "'" +
            ", dietPref='" + getDietPref() + "'" +
            ", metabolicProfile='" + getMetabolicProfile() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", user=" + getUser() +
            "}";
    }
}
