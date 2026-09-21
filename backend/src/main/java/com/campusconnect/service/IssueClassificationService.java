
package com.campusconnect.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IssueClassificationService {

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new LinkedHashMap<>();

    static {
        CATEGORY_KEYWORDS.put("HOSTEL", Arrays.asList(
                "hostel", "room", "dormitory", "warden",
                "bed", "hostel room"));

        CATEGORY_KEYWORDS.put("CLASSROOM", Arrays.asList(
                "classroom", "lecture hall", "projector",
                "blackboard", "class room", "desk"));

        CATEGORY_KEYWORDS.put("WIFI", Arrays.asList(
                "wifi", "wi-fi", "internet", "network",
                "router", "connection", "no signal"));

        CATEGORY_KEYWORDS.put("ELECTRICAL", Arrays.asList(
                "electricity", "power cut", "power outage",
                "light", "fan", "switch", "socket",
                "wiring", "short circuit"));

        CATEGORY_KEYWORDS.put("PLUMBING", Arrays.asList(
                "water leak", "leakage", "leaking",
                "tap", "pipe", "drain", "toilet",
                "bathroom", "flush", "water supply"));

        CATEGORY_KEYWORDS.put("TRANSPORT", Arrays.asList(
                "bus", "transport", "shuttle",
                "driver", "route", "vehicle"));

        CATEGORY_KEYWORDS.put("CLEANLINESS", Arrays.asList(
                "garbage", "trash", "dustbin",
                "dirty", "cleaning", "waste",
                "smell", "hygiene"));

        CATEGORY_KEYWORDS.put("SECURITY", Arrays.asList(
                "security", "theft", "stolen",
                "unauthorized", "suspicious",
                "intruder", "cctv", "lost item"));
    }

    public Map<String, Object> classify(
            String title,
            String description) {
        String text = ((title == null ? "" : title) + " " +
                (description == null ? "" : description)).toLowerCase(Locale.ROOT);

        Map<String, Integer> scores = new LinkedHashMap<>();
        Map<String, List<String>> matchedKeywords = new LinkedHashMap<>();

        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {

            List<String> matches = new ArrayList<>();

            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) {
                    matches.add(keyword);
                }
            }

            scores.put(entry.getKey(), matches.size());
            matchedKeywords.put(entry.getKey(), matches);
        }

        int highestScore = 0;

        for (int score : scores.values()) {
            highestScore = Math.max(highestScore, score);
        }

        List<String> topCategories = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : scores.entrySet()) {
            if (entry.getValue() == highestScore && highestScore > 0) {
                topCategories.add(entry.getKey());
            }
        }

        boolean ambiguous = topCategories.size() > 1;

        String category = highestScore == 0
                ? "OTHER"
                : topCategories.get(0);

        List<String> categoryMatches = matchedKeywords.getOrDefault(
                category,
                Collections.emptyList());

        int confidence = 0;

        if (highestScore > 0) {
            confidence = Math.min(95, 60 + highestScore * 10);

            if (ambiguous) {
                confidence = 50;
            }
        }

        String priority = determinePriority(text);

        String explanation;

        if (highestScore == 0) {
            explanation = "No category keywords matched. Please select the category manually.";
        } else if (ambiguous) {
            explanation = "Multiple categories have the same keyword score: "
                    + String.join(", ", topCategories)
                    + ". Please review the suggested category.";
        } else {
            explanation = "Matched keywords: "
                    + String.join(", ", categoryMatches)
                    + ".";
        }

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("category", category);
        result.put("priority", priority);
        result.put("confidence", confidence);
        result.put("matchedKeywords", categoryMatches);
        result.put("ambiguous", ambiguous);
        result.put("topCategories", topCategories);
        result.put("explanation", explanation);

        return result;
    }

    private String determinePriority(String text) {

        if (containsAny(text,
                "fire", "smoke", "gas leak",
                "gas leakage", "emergency",
                "life threatening", "electrocution",
                "major accident")) {

            return "URGENT";
        }

        if (containsAny(text,
                "urgent", "dangerous", "critical",
                "severe", "completely broken",
                "no water", "power outage",
                "security breach")) {

            return "HIGH";
        }

        if (containsAny(text,
                "slow", "minor", "small issue",
                "occasionally", "sometimes")) {

            return "LOW";
        }

        return "MEDIUM";
    }

    private boolean containsAny(
            String text,
            String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }
}