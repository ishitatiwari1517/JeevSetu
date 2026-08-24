jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localPetStorage, __unsafeResetForUser } from '../src/services/petStorage.local';

const USER = 'user-abc';

beforeEach(async () => {
  await AsyncStorage.clear();
  await __unsafeResetForUser(USER);
});

test('create returns a pet with server-side id and timestamps', async () => {
  const pet = await localPetStorage.create(USER, {
    name: 'Bruno',
    breed: 'Golden Retriever',
    gender: 'male',
    dob: '2021-10-12',
    weightKg: 22.4,
  });

  expect(pet.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(pet.userId).toBe(USER);
  expect(pet.createdAt).toBe(pet.updatedAt);
  expect(pet.name).toBe('Bruno');
});

test('list scopes pets by userId and preserves insertion order', async () => {
  await localPetStorage.create(USER, {
    name: 'Bruno', breed: 'Golden Retriever', gender: 'male', dob: '2021-10-12', weightKg: 22,
  });
  await localPetStorage.create(USER, {
    name: 'Luna', breed: 'Beagle', gender: 'female', dob: '2023-03-01', weightKg: 9,
  });
  await localPetStorage.create('other-user', {
    name: 'Other', breed: 'Mix', gender: 'unknown', dob: '2020-01-01', weightKg: 15,
  });

  const mine = await localPetStorage.list(USER);
  expect(mine.map(p => p.name)).toEqual(['Bruno', 'Luna']);

  const theirs = await localPetStorage.list('other-user');
  expect(theirs.map(p => p.name)).toEqual(['Other']);
});

test('update merges patch and bumps updatedAt', async () => {
  const created = await localPetStorage.create(USER, {
    name: 'Bruno', breed: 'Golden Retriever', gender: 'male', dob: '2021-10-12', weightKg: 22,
  });
  await new Promise<void>(resolve => setTimeout(resolve, 5));

  const updated = await localPetStorage.update(USER, created.id, { weightKg: 22.5 });

  expect(updated.weightKg).toBe(22.5);
  expect(updated.name).toBe('Bruno');
  expect(updated.createdAt).toBe(created.createdAt);
  expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
    new Date(created.updatedAt).getTime(),
  );
});

test('update on missing pet throws', async () => {
  await expect(
    localPetStorage.update(USER, 'no-such-id', { name: 'X' }),
  ).rejects.toThrow(/Pet not found/);
});

test('delete removes pet from list', async () => {
  const a = await localPetStorage.create(USER, {
    name: 'A', breed: 'B', gender: 'unknown', dob: '2020-01-01', weightKg: 1,
  });
  const b = await localPetStorage.create(USER, {
    name: 'B', breed: 'B', gender: 'unknown', dob: '2020-01-01', weightKg: 1,
  });

  await localPetStorage.delete(USER, a.id);

  const remaining = await localPetStorage.list(USER);
  expect(remaining.map(p => p.id)).toEqual([b.id]);
});

test('setAvatar persists avatarUri', async () => {
  const pet = await localPetStorage.create(USER, {
    name: 'A', breed: 'B', gender: 'unknown', dob: '2020-01-01', weightKg: 1,
  });

  const after = await localPetStorage.setAvatar(USER, pet.id, 'file:///tmp/avatar.jpg');

  expect(after.avatarUri).toBe('file:///tmp/avatar.jpg');
  const fetched = await localPetStorage.get(USER, pet.id);
  expect(fetched?.avatarUri).toBe('file:///tmp/avatar.jpg');
});
