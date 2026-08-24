import { validate } from '../src/screens/petForm.validate';

const valid = {
  name: 'Bruno',
  breed: 'Golden Retriever',
  dob: '2021-10-12',
  weightKg: '22.4',
};

test('returns no errors for a complete valid form', () => {
  expect(validate(valid)).toEqual({});
});

test('flags missing name and breed', () => {
  const errors = validate({ ...valid, name: '   ', breed: '' });
  expect(errors.name).toBeDefined();
  expect(errors.breed).toBeDefined();
});

test('flags malformed dob', () => {
  expect(validate({ ...valid, dob: '12/10/2021' }).dob).toMatch(/YYYY-MM-DD/);
});

test('flags impossible dob', () => {
  expect(validate({ ...valid, dob: '2021-13-40' }).dob).toBeDefined();
});

test('flags future dob', () => {
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  expect(validate({ ...valid, dob: future }).dob).toMatch(/future/i);
});

test('flags zero or negative weight', () => {
  expect(validate({ ...valid, weightKg: '0' }).weightKg).toBeDefined();
  expect(validate({ ...valid, weightKg: '-3' }).weightKg).toBeDefined();
  expect(validate({ ...valid, weightKg: 'heavy' }).weightKg).toBeDefined();
});

test('accepts decimal weight', () => {
  expect(validate({ ...valid, weightKg: '6.75' })).toEqual({});
});
