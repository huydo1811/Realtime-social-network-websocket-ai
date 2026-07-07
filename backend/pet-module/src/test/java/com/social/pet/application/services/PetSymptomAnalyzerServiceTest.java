package com.social.pet.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetSymptomReport;

class PetSymptomAnalyzerServiceTest {
    private final PetSymptomAnalyzerService analyzerService = new PetSymptomAnalyzerService();

    @Test
    void analyze_should_detect_parvovirus_like_pattern_for_dog() {
        PetSymptomReport report = PetSymptomReport.create(
                1L,
                2L,
                "Bé bỏ ăn, nôn và tiêu chảy 2 ngày, lờ đờ nhiều",
                39.2,
                48,
                true,
                true,
                true,
                true,
                false,
                false,
                false);

        var result = analyzerService.analyze(report, PetSpecies.DOG);

        assertEquals("Parvovirus / viêm dạ dày ruột do virus", result.likelyDisease());
        assertTrue(result.shouldSeeVet());
        assertTrue(result.redFlags().contains("Nôn + tiêu chảy + bỏ ăn + lờ đờ"));
        assertTrue(result.differentialDiagnoses().contains("Parvovirus"));
    }

    @Test
    void analyze_should_flag_emergency_when_breathing_issue_and_high_fever() {
        PetSymptomReport report = PetSymptomReport.create(
                1L,
                2L,
                "Khó thở và co giật",
                40.4,
                2,
                false,
                false,
                false,
                false,
                false,
                true,
                false);

        var result = analyzerService.analyze(report, PetSpecies.CAT);

        assertEquals("Sốc nhiệt / cấp cứu hô hấp", result.likelyDisease());
        assertEquals("EMERGENCY", result.severity().name());
        assertTrue(result.redFlags().contains("Khó thở"));
        assertTrue(result.confidenceScore() >= 95);
    }
}