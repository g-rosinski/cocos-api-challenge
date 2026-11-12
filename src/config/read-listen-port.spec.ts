import { InvalidEnvironmentVariableError } from '@/config/invalid-environment-variable.error';
import { readListenPort } from '@/config/read-listen-port';

describe('readListenPort', () => {
  it('defaults to 3000 when PORT is missing', () => {
    expect(readListenPort({})).toBe(3000);
  });

  it('defaults to 3000 when PORT is blank', () => {
    expect(readListenPort({ PORT: '   ' })).toBe(3000);
  });

  it('returns a configured port', () => {
    expect(readListenPort({ PORT: '8080' })).toBe(8080);
  });

  it('rejects an invalid port', () => {
    expect(() => readListenPort({ PORT: 'abc' })).toThrow(
      InvalidEnvironmentVariableError,
    );
  });
});
