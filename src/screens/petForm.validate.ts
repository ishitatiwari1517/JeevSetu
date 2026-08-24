export type PetFormValues = {
  name: string;
  breed: string;
  dob: string;
  weightKg: string;
};

export type PetFormErrors = Partial<Record<keyof PetFormValues, string>>;

const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validate = ({ name, breed, dob, weightKg }: PetFormValues): PetFormErrors => {
  const errors: PetFormErrors = {};
  if (!name.trim()) errors.name = 'Name is required';
  if (!breed.trim()) errors.breed = 'Breed is required';
  if (!DOB_REGEX.test(dob)) {
    errors.dob = 'Use format YYYY-MM-DD';
  } else {
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) errors.dob = 'Not a real date';
    else if (parsed.getTime() > Date.now()) errors.dob = "Date can't be in the future";
  }
  const w = Number(weightKg);
  if (!weightKg || Number.isNaN(w) || w <= 0) {
    errors.weightKg = 'Enter a positive weight in kg';
  }
  return errors;
};
