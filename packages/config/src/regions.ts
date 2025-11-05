interface RegionInput {
  region?: string | null;
  country?: string | null;
}

const LOMBARDY_REGION = 'Lombardia';
const ITALY = 'Italy';

export function isInsideLombardy({ region, country }: RegionInput): boolean {
  if (!region || !country) {
    return false;
  }

  return country.trim().toLowerCase() === ITALY.toLowerCase() &&
    region.trim().toLowerCase() === LOMBARDY_REGION.toLowerCase();
}
