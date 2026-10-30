import { emailIdentity } from './email-identity';
describe('email identity', () => {
  it('matches legacy case and whitespace', () => {
    expect(emailIdentity(' BruceWhitehead17@gmail.com ').test('BRUCEWHITEHEAD17@gmail.com')).toBe(true);
    expect(emailIdentity('a@example.com').test(' a@example.com ')).toBe(true);
  });
  it('escapes regex characters and anchors the full address', () => {
    expect(emailIdentity('a+b@example.com').test('a+b@example.com')).toBe(true);
    expect(emailIdentity('a+b@example.com').test('ab@exampleXcom')).toBe(false);
    expect(emailIdentity('a@example.com').test('othera@example.com')).toBe(false);
  });
});
