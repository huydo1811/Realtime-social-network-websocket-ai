package com.social.pet.presentation.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.pet.application.usecases.GetPetDiagnosisUseCase;
import com.social.pet.application.usecases.ListPetDiagnosesUseCase;
import com.social.pet.application.usecases.SubmitPetSymptomsDiagnosisUseCase;
import com.social.pet.domain.entities.PetDiagnosis;
import com.social.pet.domain.entities.PetSymptomReport;
import com.social.pet.domain.repositories.PetDiagnosisRepository;
import com.social.pet.domain.repositories.PetSymptomReportRepository;
import com.social.pet.presentation.dto.PetDiagnosisResponse;
import com.social.pet.presentation.dto.SubmitPetSymptomsRequest;
import com.social.pet.presentation.mapper.PetDiagnosisMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/pets/{petId:\\d+}/diagnosis")
public class PetDiagnosisController {
    private final SubmitPetSymptomsDiagnosisUseCase submitPetSymptomsDiagnosisUseCase;
    private final ListPetDiagnosesUseCase listPetDiagnosesUseCase;
    private final GetPetDiagnosisUseCase getPetDiagnosisUseCase;
    private final PetDiagnosisRepository diagnosisRepository;
    private final PetSymptomReportRepository symptomReportRepository;
    private final PetDiagnosisMapper diagnosisMapper;

    public PetDiagnosisController(
            SubmitPetSymptomsDiagnosisUseCase submitPetSymptomsDiagnosisUseCase,
            ListPetDiagnosesUseCase listPetDiagnosesUseCase,
            GetPetDiagnosisUseCase getPetDiagnosisUseCase,
            PetDiagnosisRepository diagnosisRepository,
            PetSymptomReportRepository symptomReportRepository,
            PetDiagnosisMapper diagnosisMapper) {
        this.submitPetSymptomsDiagnosisUseCase = submitPetSymptomsDiagnosisUseCase;
        this.listPetDiagnosesUseCase = listPetDiagnosesUseCase;
        this.getPetDiagnosisUseCase = getPetDiagnosisUseCase;
        this.diagnosisRepository = diagnosisRepository;
        this.symptomReportRepository = symptomReportRepository;
        this.diagnosisMapper = diagnosisMapper;
    }

    @PostMapping("/symptoms")
    public ResponseEntity<PetDiagnosisResponse> submitSymptoms(
            @PathVariable Long petId,
            @Valid @RequestBody SubmitPetSymptomsRequest request) {
        PetDiagnosis diagnosis = submitPetSymptomsDiagnosisUseCase.execute(
                currentUserId(),
                petId,
                request.getSymptomsText(),
                request.getTemperatureC(),
                request.getDurationHours(),
                request.getAppetiteLoss(),
                request.getEnergyDrop(),
                request.getVomiting(),
                request.getDiarrhea(),
                request.getCough(),
                request.getBreathingDifficulty(),
                request.getSkinRash());
        PetSymptomReport report = symptomReportRepository.findById(diagnosis.getReportId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy báo cáo triệu chứng"));
        return ResponseEntity.ok(diagnosisMapper.toResponse(diagnosis, report));
    }

    @GetMapping
    public ResponseEntity<List<PetDiagnosisResponse>> listDiagnoses(@PathVariable Long petId) {
        List<PetDiagnosisResponse> responses = listPetDiagnosesUseCase.execute(currentUserId(), petId).stream()
                .map(diagnosis -> diagnosisMapper.toResponse(diagnosis, loadReport(diagnosis)))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{diagnosisId}")
    public ResponseEntity<PetDiagnosisResponse> getDiagnosis(
            @PathVariable Long petId,
            @PathVariable Long diagnosisId) {
        PetDiagnosis diagnosis = getPetDiagnosisUseCase.execute(currentUserId(), petId, diagnosisId);
        return ResponseEntity.ok(diagnosisMapper.toResponse(diagnosis, loadReport(diagnosis)));
    }

    private PetSymptomReport loadReport(PetDiagnosis diagnosis) {
        return symptomReportRepository.findById(diagnosis.getReportId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy báo cáo triệu chứng"));
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        try {
            return Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }
    }
}