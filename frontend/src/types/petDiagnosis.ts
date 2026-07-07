export type PetDiagnosisSeverity = "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";

export interface SubmitPetSymptomsPayload {
  symptomsText: string;
  temperatureC?: number;
  durationHours?: number;
  appetiteLoss?: boolean;
  energyDrop?: boolean;
  vomiting?: boolean;
  diarrhea?: boolean;
  cough?: boolean;
  breathingDifficulty?: boolean;
  skinRash?: boolean;
}

export interface PetDiagnosisDto {
  id: number;
  petId: number;
  petName?: string | null;
  reportId: number;
  symptomsText: string;
  temperatureC?: number | null;
  durationHours?: number | null;
  appetiteLoss?: boolean | null;
  energyDrop?: boolean | null;
  vomiting?: boolean | null;
  diarrhea?: boolean | null;
  cough?: boolean | null;
  breathingDifficulty?: boolean | null;
  skinRash?: boolean | null;
  severity: PetDiagnosisSeverity;
  summary: string;
  likelyDisease: string;
  possibleCauses?: string | null;
  differentialDiagnoses?: string | null;
  redFlags?: string | null;
  recommendation: string;
  shouldSeeVet: boolean;
  confidenceScore: number;
  modelName: string;
  createdAt: string;
  updatedAt: string;
}