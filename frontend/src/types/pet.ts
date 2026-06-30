export type PetSpecies =
  | "DOG"
  | "CAT"
  | "BIRD"
  | "RABBIT"
  | "HAMSTER"
  | "FISH"
  | "REPTILE"
  | "OTHER";

export type PetGender = "MALE" | "FEMALE" | "UNKNOWN";
export type PetStatus = "ACTIVE" | "DECEASED" | "ADOPTED_OUT";
export type PetVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export interface PetDto {
  id: number;
  ownerUserId: number;
  ownerName?: string;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  gender: PetGender;
  birthDate?: string | null;
  weightKg?: number | null;
  avatarUrl?: string | null;
  bio?: string | null;
  microchipCode?: string | null;
  status: PetStatus;
  visibility: PetVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface PetBreedDto {
  id: number;
  species: PetSpecies;
  name: string;
}

export interface CreatePetPayload {
  name: string;
  species: PetSpecies;
  breed?: string;
  gender?: PetGender;
  birthDate?: string;
  weightKg?: number;
  avatarUrl?: string;
  bio?: string;
  microchipCode?: string;
  visibility?: PetVisibility;
}

export interface UpdatePetPayload extends CreatePetPayload {
  status?: PetStatus;
}
