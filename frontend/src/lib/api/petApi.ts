import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  CreatePetPayload,
  PetBreedDto,
  PetDto,
  PetSpecies,
  UpdatePetPayload,
} from "@/types/pet";

type BackendError = {
  message?: string;
  error?: string;
};

async function parseError(res: Response, fallback: string): Promise<Error> {
  try {
    const data = (await res.json()) as BackendError;
    if (data.message?.trim()) return new Error(data.message.trim());
    if (data.error?.trim()) return new Error(data.error.trim());
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
};
