// ─── Data Migration V2 ────────────────────────────────────────────────────────
// More aggressive: scans ALL AsyncStorage keys (not just @petvue_animals_*),
// resets the migration flag to run fresh, and dumps a debug log.

import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_V2_FLAG = '@petvue_migration_v2_done';
const DEFAULT_ANIMALS_KEY = '@petvue_animals_default';

export const runDataMigrationV2 = async (): Promise<void> => {
  try {
    // Force migration to merge all buckets again
    // const already = await AsyncStorage.getItem(MIGRATION_V2_FLAG);
    // if (already) return;

    // Dump ALL keys so we can see where data is
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('[PetVue Migration V2] All AsyncStorage keys:', allKeys);

    // Find every key that holds animal data (contains "animals" or "petvue")
    const animalKeys = allKeys.filter(
      k => k.includes('animals') && k !== DEFAULT_ANIMALS_KEY,
    );
    console.log('[PetVue Migration V2] Animal bucket keys to merge:', animalKeys);

    // Load current default bucket
    const defaultRaw = await AsyncStorage.getItem(DEFAULT_ANIMALS_KEY);
    const defaultAnimals: any[] = defaultRaw ? JSON.parse(defaultRaw) : [];
    const existingIds = new Set(defaultAnimals.map((a: any) => a.id));
    console.log('[PetVue Migration V2] Animals in default bucket:', defaultAnimals.length);

    let merged = 0;
    for (const key of animalKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      let animals: any[] = [];
      try { animals = JSON.parse(raw); } catch { continue; }
      if (!Array.isArray(animals)) continue;
      console.log(`[PetVue Migration V2] Found ${animals.length} animals in key: ${key}`);
      for (const animal of animals) {
        if (!existingIds.has(animal.id)) {
          defaultAnimals.push(animal);
          existingIds.add(animal.id);
          merged++;
          console.log(`[PetVue Migration V2] Merged animal: ${animal.name || 'Unknown'} (${animal.caseId})`);
        }
      }
    }

    if (merged > 0 || defaultAnimals.length > 0) {
      await AsyncStorage.setItem(DEFAULT_ANIMALS_KEY, JSON.stringify(defaultAnimals));
      console.log(`[PetVue Migration V2] ✅ Merged ${merged} animals. Total in default: ${defaultAnimals.length}`);
    }

    await AsyncStorage.setItem(MIGRATION_V2_FLAG, '1');
  } catch (e) {
    console.warn('[PetVue Migration V2] Failed:', e);
  }
};
