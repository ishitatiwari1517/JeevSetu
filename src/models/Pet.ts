export type Gender = 'male' | 'female' | 'unknown';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  breed: string;
  gender: Gender;
  dob: string;
  weightKg: number;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePetInput = {
  name: string;
  breed: string;
  gender: Gender;
  dob: string;
  weightKg: number;
};

export type UpdatePetInput = Partial<
  Pick<Pet, 'name' | 'breed' | 'gender' | 'dob' | 'weightKg' | 'avatarUri'>
>;
