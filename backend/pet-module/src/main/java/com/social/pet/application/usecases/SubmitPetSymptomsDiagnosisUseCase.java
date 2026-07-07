package com.social.pet.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.pet.application.services.PetOwnerService;
import com.social.pet.application.services.PetSymptomAnalyzerService;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.entities.PetSymptomReport;
import com.social.pet.domain.repositories.PetDiagnosisRepository;
import com.social.pet.domain.repositories.PetSymptomReportRepository;

@Service
public class SubmitPetSymptomsDiagnosisUseCase {
    private final PetOwnerService petOwnerService;
    private final PetSymptomReportRepository symptomReportRepository;
    private final PetDiagnosisRepository diagnosisRepository;
    private final PetSymptomAnalyzerService symptomAnalyzerService;

    public SubmitPetSymptomsDiagnosisUseCase(
            PetOwnerService petOwnerService,
            PetSymptomReportRepository symptomReportRepository,
            PetDiagnosisRepository diagnosisRepository,
            PetSymptomAnalyzerService symptomAnalyzerService) {
        this.petOwnerService = petOwnerService;
        this.symptomReportRepository = symptomReportRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.symptomAnalyzerService = symptomAnalyzerService;
    }

    @Transactional
    public PetDiagnosis execute(
            Long actorId,
            Long petId,
            String symptomsText,
            Double temperatureC,
            Integer durationHours,
            Boolean appetiteLoss,
            Boolean energyDrop,
            Boolean vomiting,
            Boolean diarrhea,
            Boolean cough,
            Boolean breathingDifficulty,
            Boolean skinRash) {
        Pet pet = petOwnerService.requireOwnedPet(actorId, petId);
        PetSymptomReport report = PetSymptomReport.create(
                petId,
                actorId,
                symptomsText,
                temperatureC,
                durationHours,
                appetiteLoss,
                energyDrop,
                vomiting,
                diarrhea,
                cough,
                breathingDifficulty,
                skinRash);
        PetSymptomReport savedReport = symptomReportRepository.save(report);
        PetSymptomAnalyzerService.DiagnosisResult result = symptomAnalyzerService.analyze(savedReport,
                pet.getSpecies());
        PetDiagnosis diagnosis = PetDiagnosis.create(
                petId,
                savedReport.getId(),
                result.severity(),
                result.likelyDisease(),
                result.summary(),
                result.possibleCauses(),
                result.differentialDiagnoses(),
                result.redFlags(),
                result.recommendation(),
                result.shouldSeeVet(),
                result.confidenceScore(),
                "RULE_BASED_DDS_V2");
        return diagnosisRepository.save(diagnosis);
    }
}