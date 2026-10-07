package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.domain.enumeration.Allergen;
import com.yxw1268.fyp.domain.enumeration.CookingEffort;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.plan.DayTarget;
import com.yxw1268.fyp.service.plan.PlanDetails;
import com.yxw1268.fyp.service.plan.PlanTargets;
import com.yxw1268.fyp.service.plan.WeekConstraint;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * The in-app assistant. It is deliberately not a chatbot: a message is sorted into one of a few
 * intents by the LLM, and everything after that happens here. Replies are fixed wording, numbers
 * come from the plan engine, and nothing is changed until the user confirms a proposal. Whatever
 * falls outside the intents is refused.
 */
@Service
public class AssistantService {

    private static final Logger LOG = LoggerFactory.getLogger(AssistantService.class);

    public static final int MAX_MESSAGE_LENGTH = 300;
    public static final int DAILY_MESSAGE_LIMIT = 40;
    static final Duration PROPOSAL_TTL = Duration.ofMinutes(15);

    private static final String[] DAY_NAMES = { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
    private static final Set<String> SLOTS = Set.of("breakfast", "lunch", "dinner", "snack");

    static final String REFUSAL =
        "I can only help with three things: changing a meal in your plan, adjusting this week's training " +
        "(how many sessions you can do, or leaving out upper or lower body), and updating your food preferences. " +
        "For anything else, please use the pages of the app.";
    static final String UNAVAILABLE = "The assistant isn't available right now. Please try again in a moment.";
    static final String TOO_LONG = "That message is too long. Please say it in a sentence or two.";
    static final String LIMIT_REACHED = "You've reached today's limit for assistant messages. It resets tomorrow.";
    static final String NO_PLAN = "You don't have a plan yet. Open the Eat or Train tab to create one first.";
    static final String NO_PROFILE = "Please complete your profile first.";
    static final String WHICH_MEAL =
        "Which meal would you like to change, and what would you like instead? For example: \"Wednesday dinner, something without an oven\".";
    static final String WHICH_CONSTRAINT =
        "How many times can you train this week, or which area should we leave out (upper or lower body)?";
    static final String EXPIRED = "That suggestion is no longer available. Please ask again.";

    private static final Map<String, String[]> NAVIGATION = Map.of(
        "meals",
        new String[] { "/tabs/tab2", "Open your meal plan" },
        "training",
        new String[] { "/tabs/tab3", "Open your training plan" },
        "progress",
        new String[] { "/progress", "Open your progress" },
        "report",
        new String[] { "/tabs/tab1", "See this week's report" },
        "profile",
        new String[] { "/auth/user-profile-setup?from=settings", "Open your profile" }
    );

    public record Proposal(String id, String kind, String title, List<String> lines, Map<String, Object> meal) {}

    /**
     * @param kind "message", "navigate", "proposal" or "done"
     * @param plan the updated plan, after a confirmed change
     */
    public record Reply(String kind, String reply, String navigateTo, String navigateLabel, Proposal proposal, PlanDTO plan) {
        static Reply message(String text) {
            return new Reply("message", text, null, null, null, null);
        }
    }

    /** A proposal waiting for the user's confirmation, with what is needed to carry it out. */
    private record Pending(Proposal proposal, Instant expiresAt, Integer day, String slot, WeekConstraint constraint, Map<String, Object> preferences) {}

    private final Map<String, Pending> pending = new ConcurrentHashMap<>();
    private final Map<String, Integer> messagesToday = new ConcurrentHashMap<>();
    private volatile LocalDate countingDay = LocalDate.now(ZoneOffset.UTC);

    private final MlServiceClient mlServiceClient;
    private final PlanService planService;
    private final UserProfileRepository userProfileRepository;

    public AssistantService(MlServiceClient mlServiceClient, PlanService planService, UserProfileRepository userProfileRepository) {
        this.mlServiceClient = mlServiceClient;
        this.planService = planService;
        this.userProfileRepository = userProfileRepository;
    }

    // ------------------------------------------------------------------ a message

    public Reply handle(String login, String text, Integer today, Integer focusDay, String focusSlot) {
        if (text == null || text.isBlank()) {
            return Reply.message(REFUSAL);
        }
        if (text.length() > MAX_MESSAGE_LENGTH) {
            return Reply.message(TOO_LONG);
        }
        if (!countMessage(login)) {
            return Reply.message(LIMIT_REACHED);
        }
        Optional<UserProfile> profileOpt = userProfileRepository.findOneByUserLogin(login);
        if (profileOpt.isEmpty()) {
            return Reply.message(NO_PROFILE);
        }
        UserProfile profile = profileOpt.orElseThrow();

        Map<String, Object> request = new HashMap<>();
        request.put("text", text.trim());
        if (isDay(today)) {
            request.put("today", today);
        }
        if (isDay(focusDay) && focusSlot != null && SLOTS.contains(focusSlot)) {
            request.put("focusDay", focusDay);
            request.put("focusSlot", focusSlot);
        }

        Map<String, Object> intent;
        try {
            intent = mlServiceClient.assistantIntent(request);
        } catch (Exception e) {
            LOG.warn("Assistant intent call failed: {}", e.getMessage());
            return Reply.message(UNAVAILABLE);
        }

        Object name = intent.get("intent");
        if ("swap_meal".equals(name)) {
            return proposeMealSwap(login, profile, intent);
        } else if ("week_constraint".equals(name)) {
            return proposeWeekConstraint(login, profile, intent);
        } else if ("update_preferences".equals(name)) {
            return proposePreferences(login, profile, intent);
        } else if ("navigate".equals(name)) {
            String[] target = NAVIGATION.get(String.valueOf(intent.get("target")));
            return target == null ? Reply.message(REFUSAL) : new Reply("navigate", "You can see that here:", target[0], target[1], null, null);
        } else if ("unavailable".equals(name)) {
            return Reply.message(UNAVAILABLE);
        }
        return Reply.message(REFUSAL);
    }

    private Reply proposeMealSwap(String login, UserProfile profile, Map<String, Object> intent) {
        if (!(intent.get("day") instanceof Integer day) || !isDay(day) || !(intent.get("slot") instanceof String slot) || !SLOTS.contains(slot)) {
            return Reply.message(WHICH_MEAL);
        }
        Optional<Map<String, Object>> currentOpt = planService.currentMeal(profile, day, slot);
        if (currentOpt.isEmpty()) {
            return Reply.message(
                planService.currentDetails(profile).isEmpty() ? NO_PLAN : "There is no " + DAY_NAMES[day] + " " + slot + " in your plan to change."
            );
        }
        Map<String, Object> current = currentOpt.orElseThrow();

        Map<String, Object> request = new HashMap<>();
        request.put("slot", slot);
        request.put("calories", positive(current.get("calories"), 500));
        request.put("proteinG", positive(current.get("macros") instanceof Map<?, ?> macros ? macros.get("p") : null, 30));
        if (intent.get("request") instanceof String wish) {
            request.put("request", wish);
        }
        // not this meal again, nor anything else already eaten that day
        request.put(
            "avoidNames",
            planService.currentMealsOfDay(profile, day).values().stream().map(m -> m.get("name")).filter(String.class::isInstance).distinct().toList()
        );
        request.put("dietPref", profile.getDietPref().name());
        request.put("cookingEffort", (profile.getCookingEffort() == null ? CookingEffort.SIMPLE : profile.getCookingEffort()).name());
        request.put("allergies", DietaryRestrictions.parseAllergies(profile.getAllergies()).stream().map(Enum::name).toList());
        request.put("dislikes", DietaryRestrictions.parseDislikes(profile.getFoodDislikes()));

        Map<String, Object> response;
        try {
            response = mlServiceClient.mealSwap(request);
        } catch (Exception e) {
            LOG.warn("Meal swap call failed: {}", e.getMessage());
            return Reply.message(UNAVAILABLE);
        }
        if (!(response.get("meal") instanceof Map<?, ?> raw) || !(raw.get("name") instanceof String)) {
            return Reply.message(
                "restrictions".equals(response.get("status"))
                    ? "I couldn't find a replacement that respects your allergies and foods to avoid. Try asking for something different."
                    : UNAVAILABLE
            );
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> meal = new HashMap<>((Map<String, Object>) raw);

        Proposal proposal = new Proposal(
            UUID.randomUUID().toString(),
            "swap_meal",
            "Replace " + DAY_NAMES[day] + " " + slot,
            List.of("Instead of: " + current.get("name")),
            meal
        );
        pending.put(login, new Pending(proposal, Instant.now().plus(PROPOSAL_TTL), day, slot, null, null));
        return new Reply("proposal", "Here is a replacement. Nothing changes until you confirm.", null, null, proposal, null);
    }

    private Reply proposeWeekConstraint(String login, UserProfile profile, Map<String, Object> intent) {
        Optional<PlanDetails> detailsOpt = planService.currentDetails(profile);
        if (detailsOpt.isEmpty()) {
            return Reply.message(NO_PLAN);
        }
        WeekConstraint existing = detailsOpt.orElseThrow().weekConstraint();

        WeekConstraint constraint;
        String title;
        if (Boolean.TRUE.equals(intent.get("clear"))) {
            if (existing == null) {
                return Reply.message("Your training week is already your normal one.");
            }
            constraint = null;
            title = "Back to your normal training week";
        } else {
            Integer sessions = intent.get("maxSessions") instanceof Integer n ? n : null;
            String avoid = intent.get("avoid") instanceof String a ? a : null;
            if (sessions == null && avoid == null) {
                return Reply.message(WHICH_CONSTRAINT);
            }
            // a new request adds to what was already asked for this week
            constraint = new WeekConstraint(
                sessions != null ? sessions : existing == null ? null : existing.maxSessions(),
                avoid != null ? avoid : existing == null ? null : existing.avoid()
            );
            title = "Adjust this week's training";
        }

        PlanTargets preview = planService.previewWeekConstraint(profile, constraint).orElseThrow();
        List<DayTarget> days = preview.details().days();
        List<String> lines = new ArrayList<>();
        List<String> sessionNames = days.stream().filter(DayTarget::training).map(d -> DAY_NAMES[d.day()].substring(0, 3) + " " + d.session()).toList();
        lines.add(
            sessionNames.isEmpty()
                ? "No training sessions this week"
                : sessionNames.size() + " training session" + (sessionNames.size() == 1 ? "" : "s") + ": " + String.join(", ", sessionNames)
        );
        Optional<DayTarget> training = days.stream().filter(DayTarget::training).findFirst();
        Optional<DayTarget> rest = days.stream().filter(d -> !d.training()).findFirst();
        if (training.isPresent() && rest.isPresent()) {
            lines.add(
                "About " + training.orElseThrow().calories() + " kcal on training days and " + rest.orElseThrow().calories() + " kcal on rest days"
            );
        } else {
            lines.add("About " + preview.caloriesKcal() + " kcal a day");
        }
        lines.add("Your meals stay as they are. On a day you no longer train, leave out the workout-fuel part of the snack.");
        if (constraint != null) {
            lines.add("This applies to this week only.");
        }

        Proposal proposal = new Proposal(UUID.randomUUID().toString(), "week_constraint", title, List.copyOf(lines), null);
        pending.put(login, new Pending(proposal, Instant.now().plus(PROPOSAL_TTL), null, null, constraint, null));
        return new Reply("proposal", "Here is how your week would look. Nothing changes until you confirm.", null, null, proposal, null);
    }

    private Reply proposePreferences(String login, UserProfile profile, Map<String, Object> intent) {
        List<String> addDislikes = strings(intent.get("addDislikes"));
        List<Allergen> addAllergies = DietaryRestrictions.parseAllergies(String.join(",", strings(intent.get("addAllergies"))));
        CookingEffort effort = null;
        if (intent.get("cookingEffort") instanceof String value) {
            try {
                effort = CookingEffort.valueOf(value);
            } catch (IllegalArgumentException e) {
                effort = null;
            }
        }

        Set<String> dislikes = new LinkedHashSet<>(DietaryRestrictions.parseDislikes(profile.getFoodDislikes()));
        List<String> newDislikes = DietaryRestrictions.parseDislikes(String.join(",", addDislikes)).stream().filter(dislikes::add).toList();
        Set<Allergen> allergies = new LinkedHashSet<>(DietaryRestrictions.parseAllergies(profile.getAllergies()));
        List<Allergen> newAllergies = addAllergies.stream().filter(allergies::add).toList();
        boolean effortChanges = effort != null && effort != profile.getCookingEffort();

        List<String> lines = new ArrayList<>();
        if (!newDislikes.isEmpty()) {
            lines.add("Never include: " + String.join(", ", newDislikes));
        }
        if (!newAllergies.isEmpty()) {
            lines.add("Add allergy: " + newAllergies.stream().map(a -> a.name().toLowerCase().replace('_', ' ')).collect(Collectors.joining(", ")));
        }
        if (effortChanges) {
            lines.add(
                "Cooking: " +
                switch (effort) {
                    case MINIMAL -> "barely cook";
                    case SIMPLE -> "keep it simple";
                    case ENTHUSIAST -> "happy to cook";
                }
            );
        }
        if (lines.isEmpty()) {
            return Reply.message("Your food preferences already include that.");
        }
        lines.add("This week's meals will be generated again to match.");

        Map<String, Object> change = new HashMap<>();
        change.put("dislikes", String.join(", ", dislikes));
        change.put("allergies", allergies.stream().map(Enum::name).collect(Collectors.joining(",")));
        if (effortChanges) {
            change.put("cookingEffort", effort);
        }
        Proposal proposal = new Proposal(UUID.randomUUID().toString(), "update_preferences", "Update your food preferences", List.copyOf(lines), null);
        pending.put(login, new Pending(proposal, Instant.now().plus(PROPOSAL_TTL), null, null, null, change));
        return new Reply("proposal", "Here is what would change. Nothing changes until you confirm.", null, null, proposal, null);
    }

    // ------------------------------------------------------------------ confirming a proposal

    public Reply confirm(String login, String proposalId) {
        Pending waiting = pending.get(login);
        if (waiting == null || !waiting.proposal().id().equals(proposalId) || Instant.now().isAfter(waiting.expiresAt())) {
            return Reply.message(EXPIRED);
        }
        pending.remove(login);
        Optional<UserProfile> profileOpt = userProfileRepository.findOneByUserLogin(login);
        if (profileOpt.isEmpty()) {
            return Reply.message(NO_PROFILE);
        }
        UserProfile profile = profileOpt.orElseThrow();

        switch (waiting.proposal().kind()) {
            case "swap_meal" -> {
                return planService
                    .replaceMeal(profile, waiting.day(), waiting.slot(), waiting.proposal().meal())
                    .map(plan -> done("Done. Your " + DAY_NAMES[waiting.day()] + " " + waiting.slot() + " has been replaced.", plan))
                    .orElse(Reply.message(EXPIRED));
            }
            case "week_constraint" -> {
                return planService
                    .applyWeekConstraint(profile, waiting.constraint())
                    .map(plan ->
                        done(waiting.constraint() == null ? "Done. You're back on your normal week." : "Done. This week's training has been adjusted.", plan)
                    )
                    .orElse(Reply.message(NO_PLAN));
            }
            case "update_preferences" -> {
                Map<String, Object> change = waiting.preferences();
                profile.setFoodDislikes((String) change.get("dislikes"));
                profile.setAllergies((String) change.get("allergies"));
                if (change.get("cookingEffort") instanceof CookingEffort effort) {
                    profile.setCookingEffort(effort);
                }
                profile = userProfileRepository.save(profile);
                PlanDTO plan = planService.regenerateMeals(profile);
                return done(
                    "ok".equals(plan.getMealStatus())
                        ? "Done. Your preferences are saved and this week's meals have been updated."
                        : "Your preferences are saved, but new meals couldn't be generated right now. You can try again from the Eat tab.",
                    plan
                );
            }
            default -> {
                return Reply.message(EXPIRED);
            }
        }
    }

    private static Reply done(String text, PlanDTO plan) {
        return new Reply("done", text, null, null, null, plan);
    }

    // ------------------------------------------------------------------ helpers

    /** Count a message against the user's daily allowance; false once it is used up. */
    private boolean countMessage(String login) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(countingDay)) {
            synchronized (this) {
                if (!today.equals(countingDay)) {
                    messagesToday.clear();
                    countingDay = today;
                }
            }
        }
        return messagesToday.merge(login, 1, Integer::sum) <= DAILY_MESSAGE_LIMIT;
    }

    private static boolean isDay(Integer day) {
        return day != null && day >= 0 && day <= 6;
    }

    private static int positive(Object value, int fallback) {
        return value instanceof Number number && number.doubleValue() > 0 ? (int) Math.round(number.doubleValue()) : fallback;
    }

    private static List<String> strings(Object value) {
        return value instanceof List<?> list ? list.stream().filter(String.class::isInstance).map(String.class::cast).toList() : List.of();
    }
}
