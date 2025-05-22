export interface CountryCode {
  code: string;
  pattern: string;
  example: string;
  minLength: number;
  maxLength: number;
}

export interface PhoneNumber {
  countryCode: string;
  number: string;
  formatted: string;
} 