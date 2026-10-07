package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.enumeration.Allergen;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Parsing and clean-up of the allergy and "foods to avoid" fields of a user profile.
 * Both are stored as comma-separated text.
 */
public final class DietaryRestrictions {

    public static final int MAX_DISLIKES = 10;
    public static final int MAX_DISLIKE_LENGTH = 30;

    private DietaryRestrictions() {}

    /**
     * Known allergen codes in the given text, in declaration order, unknown values dropped.
     */
    public static List<Allergen> parseAllergies(String raw) {
        if (raw == null) {
            return List.of();
        }
        Set<String> wanted = Arrays.stream(raw.split(","))
            .map(value -> value.trim().toUpperCase(Locale.ROOT))
            .collect(Collectors.toSet());
        return Arrays.stream(Allergen.values()).filter(allergen -> wanted.contains(allergen.name())).toList();
    }

    public static String normalizeAllergies(String raw) {
        return parseAllergies(raw).stream().map(Enum::name).collect(Collectors.joining(","));
    }

    /**
     * Free-text foods to avoid, reduced to short plain words. The values are shown to an LLM,
     * so anything other than letters, spaces and hyphens is removed.
     */
    public static List<String> parseDislikes(String raw) {
        if (raw == null) {
            return List.of();
        }
        Set<String> items = Arrays.stream(raw.split("[,;\\n]"))
            .map(value -> value.replaceAll("[^\\p{L} -]", " ").replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT))
            .filter(value -> !value.isEmpty())
            .map(value -> value.length() > MAX_DISLIKE_LENGTH ? value.substring(0, MAX_DISLIKE_LENGTH).trim() : value)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        return items.stream().limit(MAX_DISLIKES).toList();
    }

    public static String normalizeDislikes(String raw) {
        return String.join(", ", parseDislikes(raw));
    }
}
