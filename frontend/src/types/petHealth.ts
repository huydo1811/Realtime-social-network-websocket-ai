export type PetHealthRecordType =
  | "VACCINE"
  | "DEWORM"
  | "CHECKUP"
  | "SURGERY"
  | "MEDICATION"
  | "OTHER";

export type PetReminderStatus = "PENDING" | "COMPLETED" | "DISMISSED";

export interface PetHealthRecordDto {
  id: number;
  petId: number;
  recordType: PetHealthRecordType;
  title: string;
  description?: string | null;
  performedAt: string;
  clinicName?: string | null;
  documentUrl?: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PetHealthReminderDto {
  id: number;
  petId: number;
  petName?: string | null;
  healthRecordId?: number | null;
  title: string;
  reminderType: PetHealthRecordType;
  dueDate: string;
  status: PetReminderStatus;
  note?: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetHealthRecordPayload {
  recordType: PetHealthRecordType;
  title: string;
  description?: string;
  performedAt: string;
  clinicName?: string;
  documentUrl?: string;
}

export interface CreatePetHealthReminderPayload {
  healthRecordId?: number;
  title: string;
  reminderType: PetHealthRecordType;
  dueDate: string;
  note?: string;
}

export const HEALTH_RECORD_TYPE_LABELS: Record<PetHealthRecordType, string> = {
  VACCINE: "Tiêm phòng",
  DEWORM: "Tẩy giun",
  CHECKUP: "Khám định kỳ",
  SURGERY: "Phẫu thuật",
  MEDICATION: "Thuốc / điều trị",
  OTHER: "Khác",
};
