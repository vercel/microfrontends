import md5 from 'md5';

export function hashApplicationName(name: string): string {
  if (!name) {
    throw new Error('Application name is required to generate hash');
  }

  return md5(name).substring(0, 6).padStart(6, '0');
}
