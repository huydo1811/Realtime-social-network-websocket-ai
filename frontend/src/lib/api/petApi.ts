import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  CreatePetPayload,
  PetBreedDto,
  PetDto,
  PetSpecies,
  UpdatePetPayload,
} from "@/types/pet";
import type {
  CreatePetHealthRecordPayload,
  CreatePetHealthReminderPayload,
  PetHealthRecordDto,
  PetHealthReminderDto,
  WeightEntry,
  AppetiteEntry,
  ActivityEntry,
} from "@/types/petHealth";
import type {
  CreatePetWalkMeetupPayload,
  CreatePetWalkSessionPayload,
  FinishPetWalkSessionPayload,
  PetWalkMeetupRequestDto,
  PetWalkSessionDto,
} from "@/types/petWalk";
import type { PetDiagnosisDto, SubmitPetSymptomsPayload } from "@/types/petDiagnosis";
import type { VetClinicDto } from "@/types/petVet";

type BackendError = {
  message?: string;
  error?: string;
};

async function parseError(res: Response, fallback: string): Promise<Error> {
  try {
    const data = (await res.json()) as BackendError;
    if (typeof data.message === "string" && data.message.trim()) return new Error(data.message.trim());
    if (typeof data.error === "string" && data.error.trim()) return new Error(data.error.trim());
  } catch {
    // ignore
  }
  return new Error(fallback);
}

export const petApi = {
  async listMine(): Promise<PetDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/me`);
    if (!res.ok) throw await parseError(res, "Không thể tải thú cưng");
    return (await res.json()) as PetDto[];
  },

  async listByUser(userId: number): Promise<PetDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/user/${userId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải thú cưng");
    return (await res.json()) as PetDto[];
  },

  async getById(petId: number): Promise<PetDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải hồ sơ thú cưng");
    return (await res.json()) as PetDto;
  },

  async create(payload: CreatePetPayload): Promise<PetDto> {
    const res = await apiAuthFetch(`${API_URL}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể tạo hồ sơ thú cưng");
    return (await res.json()) as PetDto;
  },

  async update(petId: number, payload: UpdatePetPayload): Promise<PetDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể cập nhật thú cưng");
    return (await res.json()) as PetDto;
  },

  async remove(petId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}`, { method: "DELETE" });
    if (!res.ok) throw await parseError(res, "Không thể xóa thú cưng");
  },

  async listBreeds(species?: PetSpecies): Promise<PetBreedDto[]> {
    const query = species ? `?species=${encodeURIComponent(species)}` : "";
    const res = await apiAuthFetch(`${API_URL}/pets/breeds${query}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách giống");
    return (await res.json()) as PetBreedDto[];
  },

  async listHealthRecords(petId: number): Promise<PetHealthRecordDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health-records`);
    if (!res.ok) throw await parseError(res, "Không thể tải sổ sức khỏe");
    return (await res.json()) as PetHealthRecordDto[];
  },

  async createHealthRecord(
    petId: number,
    payload: CreatePetHealthRecordPayload
  ): Promise<PetHealthRecordDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể thêm hồ sơ sức khỏe");
    return (await res.json()) as PetHealthRecordDto;
  },

  async deleteHealthRecord(petId: number, recordId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health-records/${recordId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw await parseError(res, "Không thể xóa hồ sơ sức khỏe");
  },

  async listReminders(petId: number): Promise<PetHealthReminderDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/reminders`);
    if (!res.ok) throw await parseError(res, "Không thể tải nhắc nhở");
    return (await res.json()) as PetHealthReminderDto[];
  },

  async createReminder(
    petId: number,
    payload: CreatePetHealthReminderPayload
  ): Promise<PetHealthReminderDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể tạo nhắc nhở");
    return (await res.json()) as PetHealthReminderDto;
  },

  async completeReminder(petId: number, reminderId: number): Promise<PetHealthReminderDto> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/${petId}/reminders/${reminderId}/complete`,
      { method: "POST" }
    );
    if (!res.ok) throw await parseError(res, "Không thể đánh dấu hoàn thành");
    return (await res.json()) as PetHealthReminderDto;
  },

  async dismissReminder(petId: number, reminderId: number): Promise<PetHealthReminderDto> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/${petId}/reminders/${reminderId}/dismiss`,
      { method: "POST" }
    );
    if (!res.ok) throw await parseError(res, "Không thể bỏ qua nhắc nhở");
    return (await res.json()) as PetHealthReminderDto;
  },

  async listMyUpcomingReminders(): Promise<PetHealthReminderDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/me/reminders/upcoming`);
    if (!res.ok) throw await parseError(res, "Không thể tải nhắc nhở sắp tới");
    return (await res.json()) as PetHealthReminderDto[];
  },

  async listDueReminders(): Promise<PetHealthReminderDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/me/reminders/due`);
    if (!res.ok) throw await parseError(res, "Không thể tải nhắc nhở đến hạn");
    return (await res.json()) as PetHealthReminderDto[];
  },

  async listWalks(petId: number): Promise<PetWalkSessionDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/walks`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch đi dạo");
    return (await res.json()) as PetWalkSessionDto[];
  },

  async createWalk(
    petId: number,
    payload: CreatePetWalkSessionPayload
  ): Promise<PetWalkSessionDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/walks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể tạo phiên đi dạo");
    return (await res.json()) as PetWalkSessionDto;
  },

  async finishWalk(
    petId: number,
    walkId: number,
    payload: FinishPetWalkSessionPayload
  ): Promise<PetWalkSessionDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/walks/${walkId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể kết thúc phiên đi dạo");
    return (await res.json()) as PetWalkSessionDto;
  },

  async listNearbyWalks(latitude: number, longitude: number, radiusKm = 5): Promise<PetWalkSessionDto[]> {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radiusKm: String(radiusKm),
    });
    const res = await apiAuthFetch(`${API_URL}/pets/walks/nearby?${query.toString()}`);
    if (!res.ok) throw await parseError(res, "Không thể tải bản đồ đi dạo");
    return (await res.json()) as PetWalkSessionDto[];
  },

  async listJoinedWalks(): Promise<PetWalkSessionDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/walks/joined`);
    if (!res.ok) throw await parseError(res, "Không thể tải phiên đi dạo đã tham gia");
    return (await res.json()) as PetWalkSessionDto[];
  },

  async listWalkMeetups(petId: number): Promise<PetWalkMeetupRequestDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/walk-meetups`);
    if (!res.ok) throw await parseError(res, "Không thể tải lời mời gặp gỡ");
    return (await res.json()) as PetWalkMeetupRequestDto[];
  },

  async listSentWalkMeetups(): Promise<PetWalkMeetupRequestDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/walk-meetups/sent`);
    if (!res.ok) throw await parseError(res, "Không thể tải lời mời đã gửi");
    return (await res.json()) as PetWalkMeetupRequestDto[];
  },

  async createWalkMeetup(
    walkId: number,
    payload: CreatePetWalkMeetupPayload
  ): Promise<PetWalkMeetupRequestDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/walks/${walkId}/meetups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể gửi lời mời gặp gỡ");
    return (await res.json()) as PetWalkMeetupRequestDto;
  },

  async acceptWalkMeetup(meetupId: number): Promise<PetWalkMeetupRequestDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/walk-meetups/${meetupId}/accept`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể chấp nhận lời mời");
    return (await res.json()) as PetWalkMeetupRequestDto;
  },

  async declineWalkMeetup(meetupId: number): Promise<PetWalkMeetupRequestDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/walk-meetups/${meetupId}/decline`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể từ chối lời mời");
    return (await res.json()) as PetWalkMeetupRequestDto;
  },

  async listDiagnoses(petId: number): Promise<PetDiagnosisDto[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/diagnosis`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử chẩn đoán");
    return (await res.json()) as PetDiagnosisDto[];
  },

  async submitSymptoms(
    petId: number,
    payload: SubmitPetSymptomsPayload
  ): Promise<PetDiagnosisDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/diagnosis/symptoms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, "Không thể phân tích triệu chứng");
    return (await res.json()) as PetDiagnosisDto;
  },

  async getDiagnosis(petId: number, diagnosisId: number): Promise<PetDiagnosisDto> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/diagnosis/${diagnosisId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải chẩn đoán");
    return (await res.json()) as PetDiagnosisDto;
  },

  async findNearbyVets(latitude: number, longitude: number, radiusKm = 6): Promise<VetClinicDto[]> {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radiusKm: String(radiusKm),
    });
    const res = await apiAuthFetch(`${API_URL}/pets/vets/nearby?${query.toString()}`);
    if (!res.ok) throw await parseError(res, "Không thể tìm thú y gần đây");
    return (await res.json()) as VetClinicDto[];
  },

  async listWeightEntries(petId: number): Promise<WeightEntry[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/weight`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử cân nặng");
    return (await res.json()) as WeightEntry[];
  },

  async createWeightEntry(petId: number, weightKg: number, note?: string): Promise<WeightEntry> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg, note }),
    });
    if (!res.ok) throw await parseError(res, "Không thể ghi nhận cân nặng");
    return (await res.json()) as WeightEntry;
  },

  async listAppetiteEntries(petId: number): Promise<AppetiteEntry[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/appetite`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử thèm ăn");
    return (await res.json()) as AppetiteEntry[];
  },

  async createAppetiteEntry(petId: number, level: AppetiteEntry["level"], note?: string): Promise<AppetiteEntry> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/appetite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, note }),
    });
    if (!res.ok) throw await parseError(res, "Không thể ghi nhận thèm ăn");
    return (await res.json()) as AppetiteEntry;
  },

  async listActivityEntries(petId: number): Promise<ActivityEntry[]> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/activity`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử hoạt động");
    return (await res.json()) as ActivityEntry[];
  },

  async createActivityEntry(petId: number, minutes: number, activityType: string, note?: string): Promise<ActivityEntry> {
    const res = await apiAuthFetch(`${API_URL}/pets/${petId}/health/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes, activityType, note }),
    });
    if (!res.ok) throw await parseError(res, "Không thể ghi nhận hoạt động");
    return (await res.json()) as ActivityEntry;
  },

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  async adminGetStats(): Promise<{
    totalPets: number;
    totalActivePets: number;
    totalWalkSessions: number;
    totalDiagnoses: number;
    pendingReminders: number;
    overdueReminders: number;
    generatedAt: string;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/stats`);
    if (!res.ok) throw await parseError(res, "Không thể tải thống kê");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminGetStats>>;
  },

  async adminGetUserPets(userId: number): Promise<{
    userId: number;
    fullName: string;
    username: string;
    avatarUrl: string | null;
    totalPets: number;
    activePets: number;
    pendingReminders: number;
    pets: PetDto[];
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/users/${userId}/pets`);
    if (!res.ok) throw await parseError(res, "Không thể tải thú cưng của người dùng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminGetUserPets>>;
  },

  async adminGetPetDetail(petId: number): Promise<{
    pet: PetDto;
    healthRecords: PetHealthRecordDto[];
    reminders: PetHealthReminderDto[];
    recentDiagnoses: PetDiagnosisDto[];
    recentWalks: PetWalkSessionDto[];
    fetchedAt: string;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/pets/${petId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải chi tiết thú cưng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminGetPetDetail>>;
  },

  async adminSearchPets(q: string, page = 0, size = 20): Promise<{
    items: PetDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`);
    if (!res.ok) throw await parseError(res, "Không thể tìm thú cưng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminSearchPets>>;
  },

  async adminListPets(page = 0, size = 20): Promise<{
    items: PetDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/search?page=${page}&size=${size}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách thú cưng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListPets>>;
  },

  async adminListDiagnoses(page = 0, size = 20): Promise<{
    items: PetDiagnosisDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/diagnoses?page=${page}&size=${size}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách chẩn đoán");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListDiagnoses>>;
  },

  async adminListWalks(page = 0, size = 20): Promise<{
    items: PetWalkSessionDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/walks?page=${page}&size=${size}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách đi dạo");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListWalks>>;
  },

  async adminListReminders(page = 0, size = 20): Promise<{
    items: PetHealthReminderDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(`${API_URL}/pets/admin/reminders?page=${page}&size=${size}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách nhắc nhở");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListReminders>>;
  },

  async adminListPetsByOwner(
    userId: number,
    page = 0,
    size = 20
  ): Promise<{
    items: PetDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/admin/users/${userId}/pets-page?page=${page}&size=${size}`
    );
    if (!res.ok) throw await parseError(res, "Không thể tải thú cưng của người dùng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListPetsByOwner>>;
  },

  async adminListDiagnosesByOwner(
    userId: number,
    page = 0,
    size = 20
  ): Promise<{
    items: PetDiagnosisDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/admin/users/${userId}/diagnoses?page=${page}&size=${size}`
    );
    if (!res.ok) throw await parseError(res, "Không thể tải chẩn đoán của người dùng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListDiagnosesByOwner>>;
  },

  async adminListWalksByOwner(
    userId: number,
    page = 0,
    size = 20
  ): Promise<{
    items: PetWalkSessionDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/admin/users/${userId}/walks?page=${page}&size=${size}`
    );
    if (!res.ok) throw await parseError(res, "Không thể tải lịch đi dạo của người dùng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListWalksByOwner>>;
  },

  async adminListRemindersByOwner(
    userId: number,
    page = 0,
    size = 20
  ): Promise<{
    items: PetHealthReminderDto[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const res = await apiAuthFetch(
      `${API_URL}/pets/admin/users/${userId}/reminders?page=${page}&size=${size}`
    );
    if (!res.ok) throw await parseError(res, "Không thể tải nhắc nhở của người dùng");
    return (await res.json()) as Awaited<ReturnType<typeof petApi.adminListRemindersByOwner>>;
  },
};
