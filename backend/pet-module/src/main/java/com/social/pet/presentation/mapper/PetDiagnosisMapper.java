package com.social.pet.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.entities.PetSymptomReport;
import com.social.pet.domain.repositories.PetRepository;
import com.social.pet.presentation.dto.PetDiagnosisResponse;

@Component
public class PetDiagnosisMapper {
    private final PetRepository petRepository;

    public PetDiagnosisMapper(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public PetDiagnosisResponse toResponse(PetDiagnosis diagnosis, PetSymptomReport report) {
        PetDiagnosisResponse response = new PetDiagnosisResponse();
        response.setId(diagnosis.getId());
        response.setPetId(diagnosis.getPetId());
        petRepository.findById(diagnosis.getPetId()).ifPresent(pet -> response.setPetName(pet.getName()));
        response.setReportId(diagnosis.getReportId());
        response.setSymptomsText(report.getSymptomsText());
        response.setTemperatureC(report.getTemperatureC());
        response.setDurationHours(report.getDurationHours());
        response.setAppetiteLoss(report.getAppetiteLoss());
        response.setEnergyDrop(report.getEnergyDrop());
        response.setVomiting(report.getVomiting());
        response.setDiarrhea(report.getDiarrhea());
        response.setCough(report.getCough());
        response.setBreathingDifficulty(report.getBreathingDifficulty());
        response.setSkinRash(report.getSkinRash());
        response.setSeverity(diagnosis.getSeverity().name());
        response.setSummary(diagnosis.getSummary());
        response.setLikelyDisease(diagnosis.getLikelyDisease());
        response.setPossibleCauses(diagnosis.getPossibleCauses());
        response.setDifferentialDiagnoses(diagnosis.getDifferentialDiagnoses());
        response.setRedFlags(diagnosis.getRedFlags());
        response.setRecommendation(diagnosis.getRecommendation());
        response.setShouldSeeVet(diagnosis.getShouldSeeVet());
        response.setConfidenceScore(diagnosis.getConfidenceScore());
        response.setModelName(diagnosis.getModelName());
        response.setCreatedAt(diagnosis.getCreatedAt());
        response.setUpdatedAt(diagnosis.getUpdatedAt());
        return response;
    }
}