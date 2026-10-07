package com.yxw1268.fyp.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.IntegrationTest;
import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.ProgressLog;
import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.CookingEffort;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.domain.enumeration.MetabolicProfile;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.security.AuthoritiesConstants;
import com.yxw1268.fyp.service.MlServiceClient;
import com.yxw1268.fyp.service.UserService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Daily check-ins, plan generation from the engine, and the weekly adaptation that connects them.
 */
@AutoConfigureMockMvc
@IntegrationTest
class AdaptivePlanIT {

    private static final LocalDate TODAY = LocalDate.now(ZoneOffset.UTC);

    @Autowired
    private ObjectMapper om;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private ProgressLogRepository progressLogRepository;

    @MockBean
    private MlServiceClient mlServiceClient;

    private final List<String> createdLogins = new ArrayList<>();

    @AfterEach
    void cleanup() {
        for (String login : createdLogins) {
            userProfileRepository
                .findOneByUserLogin(login)
                .ifPresent(profile -> {
                    progressLogRepository.deleteAll(
                        progressLogRepository.findAll().stream().filter(l -> l.getProfile().getId().equals(profile.getId())).toList()
                    );
                    planRepository.deleteAll(
                        planRepository.findAll().stream().filter(p -> p.getProfile().getId().equals(profile.getId())).toList()
                    );
                    userProfileRepository.delete(profile);
                });
            userService.deleteUser(login);
        }
        createdLogins.clear();
    }

    // ---------------------------------------------------------------- helpers

    private User createUser() {
        String email = RandomStringUtils.randomAlphabetic(10).toLowerCase() + "@example.com";
        User u = new User();
        u.setLogin(email);
        u.setEmail(email);
        u.setPassword(RandomStringUtils.randomAlphanumeric(60));
        u.setActivated(true);
        u.setLangKey("en");
        u = userRepository.saveAndFlush(u);
        createdLogins.add(email);
        return u;
    }

    /** 30-year-old man, 178 cm, 80 kg, moderately active: formula maintenance 2740 kcal. */
    private UserProfile createProfile(User owner, Goal goal) {
        UserProfile profile = new UserProfile()
            .age(30)
            .heightCm(new BigDecimal(178))
            .weightKg(new BigDecimal(80))
            .activityLevel(ActivityLevel.MODERATE)
            .goal(goal)
            .dietPref(DietPref.BALANCED)
            .metabolicProfile(MetabolicProfile.PROFILE_1)
            .createdAt(Instant.now());
        profile.setUser(owner);
        return userProfileRepository.saveAndFlush(profile);
    }

    private static RequestPostProcessor as(User u) {
        return user(u.getLogin()).authorities(() -> AuthoritiesConstants.USER);
    }

    private JsonNode checkIn(User u, Map<String, Object> body) throws Exception {
        return om.readTree(
            mockMvc
                .perform(put("/api/progress-logs/today").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(body)).with(as(u)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()
        );
    }

    private JsonNode generate(User u) throws Exception {
        return om.readTree(
            mockMvc.perform(post("/api/plans/generate").with(as(u))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()
        );
    }

    private void log(UserProfile profile, int daysAgo, Double weightKg, boolean completedWorkout) {
        ProgressLog log = new ProgressLog().logDate(TODAY.minusDays(daysAgo)).completedWorkout(completedWorkout).createdAt(Instant.now());
        if (weightKg != null) {
            log.setWeightKg(BigDecimal.valueOf(weightKg));
        }
        log.setProfile(profile);
        progressLogRepository.saveAndFlush(log);
    }

    /** Pretend the user's current plan has been followed for a week. */
    private void ageCurrentPlan(UserProfile profile) {
        Plan plan = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId()).orElseThrow();
        plan.setCreatedAt(Instant.now().minus(7, ChronoUnit.DAYS));
        planRepository.saveAndFlush(plan);
    }

    private void mealsAvailable() {
        when(mlServiceClient.mealPlan(any())).thenReturn(Map.of("weeklyMealPlan", Map.of("0", Map.of("breakfast", Map.of("name", "Oats")))));
    }

    // ---------------------------------------------------------------- check-ins

    @Test
    void checkInCreatesOneLogPerDayAndUpdatesIt() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.MAINTAIN);

        JsonNode first = checkIn(alice, Map.of("weightKg", 79.4));
        assertThat(first.get("weightKg").asDouble()).isEqualTo(79.4);
        assertThat(first.get("completedWorkout").asBoolean()).isFalse();

        JsonNode second = checkIn(alice, Map.of("completedWorkout", true));
        assertThat(second.get("id").asLong()).isEqualTo(first.get("id").asLong());
        assertThat(second.get("completedWorkout").asBoolean()).isTrue();
        // the weight logged earlier today is kept
        assertThat(second.get("weightKg").asDouble()).isEqualTo(79.4);

        assertThat(progressLogRepository.findAllByProfileIdAndLogDateGreaterThanEqualOrderByLogDateAsc(profile.getId(), TODAY.minusDays(2))).hasSize(1);
        // and it became the profile's current weight
        assertThat(userProfileRepository.findById(profile.getId()).orElseThrow().getWeightKg()).isEqualByComparingTo("79.4");
    }

    @Test
    void checkInRejectsNonsense() throws Exception {
        User alice = createUser();
        createProfile(alice, Goal.MAINTAIN);

        for (Map<String, Object> body : List.<Map<String, Object>>of(
            Map.of(),
            Map.of("weightKg", 5),
            Map.of("weightKg", 900),
            Map.of("completedWorkout", true, "logDate", TODAY.minusDays(10).toString()),
            Map.of("completedWorkout", true, "logDate", TODAY.plusDays(3).toString())
        )) {
            mockMvc
                .perform(put("/api/progress-logs/today").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(body)).with(as(alice)))
                .andExpect(status().isBadRequest());
        }
        assertThat(progressLogRepository.findAll()).noneMatch(l -> l.getProfile().getUser().getLogin().equals(alice.getLogin()));
    }

    @Test
    void recentCheckInsAreTheCallersOwnInDateOrder() throws Exception {
        User alice = createUser();
        User bob = createUser();
        UserProfile aliceProfile = createProfile(alice, Goal.MAINTAIN);
        log(aliceProfile, 3, 80.0, true);
        log(aliceProfile, 1, 79.8, false);
        log(aliceProfile, 60, 82.0, false);
        log(createProfile(bob, Goal.MAINTAIN), 2, 70.0, true);

        mockMvc
            .perform(get("/api/progress-logs/recent?days=28").with(as(alice)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].weightKg").value(80.0))
            .andExpect(jsonPath("$[1].weightKg").value(79.8));
    }

    // ---------------------------------------------------------------- generation

    @Test
    @SuppressWarnings("unchecked")
    void generatedPlanComesFromTheEngineAndAsksForMatchingMeals() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.LOSE);
        profile.setCookingEffort(CookingEffort.MINIMAL);
        userProfileRepository.saveAndFlush(profile);
        mealsAvailable();

        JsonNode plan = generate(alice);

        // maintenance 2740, 500 kcal deficit, moderate activity -> upper/lower split, 4 sessions
        assertThat(plan.get("caloriesKcal").asInt()).isEqualTo(2240);
        assertThat(plan.get("workoutType").asText()).isEqualTo("UPPER_LOWER");
        assertThat(plan.get("source").asText()).isEqualTo("ADAPTIVE_ENGINE");
        JsonNode details = plan.get("details");
        assertThat(details.get("maintenanceKcal").asInt()).isEqualTo(2740);
        assertThat(details.get("sessionsPerWeek").asInt()).isEqualTo(4);
        assertThat(details.get("days")).hasSize(7);
        assertThat(details.get("reasons")).isNotEmpty();
        JsonNode sunday = details.get("days").get(0);
        JsonNode monday = details.get("days").get(1);
        assertThat(sunday.get("training").asBoolean()).isFalse();
        assertThat(monday.get("training").asBoolean()).isTrue();
        assertThat(monday.get("calories").asInt()).isGreaterThan(sunday.get("calories").asInt());
        assertThat(plan.get("mealPlan").get("0").get("breakfast").get("name").asText()).isEqualTo("Oats");

        ArgumentCaptor<Map<String, Object>> sent = ArgumentCaptor.forClass(Map.class);
        verify(mlServiceClient).mealPlan(sent.capture());
        Map<String, Object> request = sent.getValue();
        assertThat(((Map<String, Object>) request.get("restDay")).get("calories")).isEqualTo(sunday.get("calories").asInt());
        assertThat(request.get("trainingFuelKcal")).isEqualTo(monday.get("calories").asInt() - sunday.get("calories").asInt());
        assertThat((List<Boolean>) request.get("trainingDays")).containsExactly(false, true, true, true, true, false, false);
        assertThat(request.get("cookingEffort")).isEqualTo("MINIMAL");
        assertThat(request.get("dietPref")).isEqualTo("BALANCED");
    }

    @Test
    void planIsStillCreatedWhenMealsCannotBeGenerated() throws Exception {
        User alice = createUser();
        createProfile(alice, Goal.MAINTAIN);
        when(mlServiceClient.mealPlan(any())).thenThrow(new IllegalStateException("ML service down"));

        JsonNode plan = generate(alice);

        assertThat(plan.get("caloriesKcal").asInt()).isEqualTo(2740);
        assertThat(plan.get("details").get("days")).hasSize(7);
        assertThat(plan.hasNonNull("mealPlanJson")).isFalse();
    }

    @Test
    void currentPlanIsTheLatestOneAndMissingBeforeTheFirst() throws Exception {
        User alice = createUser();
        createProfile(alice, Goal.MAINTAIN);
        mealsAvailable();

        mockMvc.perform(get("/api/plans/current").with(as(alice))).andExpect(status().isNotFound());

        JsonNode generated = generate(alice);

        mockMvc
            .perform(get("/api/plans/current").with(as(alice)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(generated.get("id").asLong()))
            .andExpect(jsonPath("$.details.days.length()").value(7))
            .andExpect(jsonPath("$.mealPlanJson").isNotEmpty());
    }

    // ---------------------------------------------------------------- the weekly loop

    @Test
    void weightLostSlowerThanPlannedLowersNextWeeksCalories() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.LOSE);
        mealsAvailable();

        int firstCalories = generate(alice).get("caloriesKcal").asInt();
        ageCurrentPlan(profile);
        // a 500 kcal deficit should lose about 0.45 kg a week; this user is flat at 80 kg
        for (int daysAgo = 20; daysAgo >= 0; daysAgo -= 2) {
            log(profile, daysAgo, 80.0, false);
        }

        JsonNode second = generate(alice);

        assertThat(second.get("details").get("calorieAdjustmentKcal").asInt()).isEqualTo(-150);
        assertThat(second.get("details").get("maintenanceKcal").asInt()).isEqualTo(2590);
        assertThat(second.get("caloriesKcal").asInt()).isEqualTo(firstCalories - 150);
        assertThat(second.get("details").get("reasons").toString()).contains("estimated maintenance was lowered by 150 kcal");

        // the correction is remembered: with nothing new to learn, a third plan keeps it
        JsonNode third = generate(alice);
        assertThat(third.get("details").get("calorieAdjustmentKcal").asInt()).isEqualTo(-150);
        assertThat(third.get("caloriesKcal").asInt()).isEqualTo(firstCalories - 150);
    }

    @Test
    void missedSessionsLightenNextWeeksTraining() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.MAINTAIN);
        mealsAvailable();

        assertThat(generate(alice).get("workoutType").asText()).isEqualTo("UPPER_LOWER");
        ageCurrentPlan(profile);
        log(profile, 15, null, true);
        log(profile, 2, null, true); // 1 of 4 planned sessions this week

        JsonNode second = generate(alice);

        assertThat(second.get("workoutType").asText()).isEqualTo("FBW");
        assertThat(second.get("details").get("trainingOffset").asInt()).isEqualTo(-1);
        assertThat(second.get("details").get("reasons").toString()).contains("1 of 4 planned sessions");
    }

    @Test
    void regeneratingMidWeekDoesNotAdapt() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.LOSE);
        mealsAvailable();

        int firstCalories = generate(alice).get("caloriesKcal").asInt();
        for (int daysAgo = 20; daysAgo >= 0; daysAgo -= 2) {
            log(profile, daysAgo, 80.0, false);
        }

        JsonNode second = generate(alice);

        assertThat(second.get("caloriesKcal").asInt()).isEqualTo(firstCalories);
        assertThat(second.get("details").get("calorieAdjustmentKcal").asInt()).isZero();
    }

    @Test
    void plansFromBeforeTheEngineAreReplacedCleanly() throws Exception {
        User alice = createUser();
        UserProfile profile = createProfile(alice, Goal.MAINTAIN);
        mealsAvailable();

        Plan legacy = new Plan();
        legacy.setProfile(profile);
        legacy.setCaloriesKcal(3100);
        legacy.setProteinG(new BigDecimal(150));
        legacy.setCarbsG(new BigDecimal(400));
        legacy.setFatG(new BigDecimal(90));
        legacy.setSource("AI_MODEL");
        legacy.setCreatedAt(Instant.now().minus(30, ChronoUnit.DAYS));
        legacy = planRepository.saveAndFlush(legacy);
        // a log that still points at the old plan must not block replacing it
        ProgressLog attached = new ProgressLog().logDate(TODAY.minusDays(3)).completedWorkout(false).createdAt(Instant.now());
        attached.setProfile(profile);
        attached.setPlan(legacy);
        progressLogRepository.saveAndFlush(attached);

        JsonNode plan = generate(alice);

        assertThat(plan.get("caloriesKcal").asInt()).isEqualTo(2740);
        assertThat(planRepository.existsById(legacy.getId())).isFalse();
        assertThat(progressLogRepository.existsById(attached.getId())).isTrue();
    }
}
