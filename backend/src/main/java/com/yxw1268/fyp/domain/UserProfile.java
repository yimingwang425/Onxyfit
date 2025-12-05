package com.yxw1268.fyp.domain;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.domain.enumeration.MetabolicProfile;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A UserProfile.
 */
@Entity
@Table(name = "user_profile")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserProfile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Min(value = 10)
    @Max(value = 100)
    @Column(name = "age", nullable = false)
    private Integer age;

    @NotNull
    @DecimalMin(value = "80")
    @DecimalMax(value = "380")
    @Column(name = "height_cm", precision = 21, scale = 2, nullable = false)
    private BigDecimal heightCm;

    @NotNull
    @Column(name = "weight_kg", precision = 21, scale = 2, nullable = false)
    private BigDecimal weightKg;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level", nullable = false)
    private ActivityLevel activityLevel;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "goal", nullable = false)
    private Goal goal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "diet_pref", nullable = false)
    private DietPref dietPref;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "metabolic_profile", nullable = false)
    private MetabolicProfile metabolicProfile;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @NotNull
    @JoinColumn(unique = true)
    private User user;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public UserProfile id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getAge() {
        return this.age;
    }

    public UserProfile age(Integer age) {
        this.setAge(age);
        return this;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public BigDecimal getHeightCm() {
        return this.heightCm;
    }

    public UserProfile heightCm(BigDecimal heightCm) {
        this.setHeightCm(heightCm);
        return this;
    }

    public void setHeightCm(BigDecimal heightCm) {
        this.heightCm = heightCm;
    }

    public BigDecimal getWeightKg() {
        return this.weightKg;
    }

    public UserProfile weightKg(BigDecimal weightKg) {
        this.setWeightKg(weightKg);
        return this;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public ActivityLevel getActivityLevel() {
        return this.activityLevel;
    }

    public UserProfile activityLevel(ActivityLevel activityLevel) {
        this.setActivityLevel(activityLevel);
        return this;
    }

    public void setActivityLevel(ActivityLevel activityLevel) {
        this.activityLevel = activityLevel;
    }

    public Goal getGoal() {
        return this.goal;
    }

    public UserProfile goal(Goal goal) {
        this.setGoal(goal);
        return this;
    }

    public void setGoal(Goal goal) {
        this.goal = goal;
    }

    public DietPref getDietPref() {
        return this.dietPref;
    }

    public UserProfile dietPref(DietPref dietPref) {
        this.setDietPref(dietPref);
        return this;
    }

    public void setDietPref(DietPref dietPref) {
        this.dietPref = dietPref;
    }

    public MetabolicProfile getMetabolicProfile() {
        return this.metabolicProfile;
    }

    public UserProfile metabolicProfile(MetabolicProfile metabolicProfile) {
        this.setMetabolicProfile(metabolicProfile);
        return this;
    }

    public void setMetabolicProfile(MetabolicProfile metabolicProfile) {
        this.metabolicProfile = metabolicProfile;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public UserProfile createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return this.user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public UserProfile user(User user) {
        this.setUser(user);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserProfile)) {
            return false;
        }
        return getId() != null && getId().equals(((UserProfile) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UserProfile{" +
            "id=" + getId() +
            ", age=" + getAge() +
            ", heightCm=" + getHeightCm() +
            ", weightKg=" + getWeightKg() +
            ", activityLevel='" + getActivityLevel() + "'" +
            ", goal='" + getGoal() + "'" +
            ", dietPref='" + getDietPref() + "'" +
            ", metabolicProfile='" + getMetabolicProfile() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            "}";
    }
}
