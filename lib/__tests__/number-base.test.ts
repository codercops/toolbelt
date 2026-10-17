import { describe, it, expect } from 'vitest';
import { parseInteger, formatInteger, toTwosComplement, fromTwosComplement } from '../number-base';

describe('Number Base Converter Engine', () => {
    describe('parseInteger', () => {
        it('should correctly parse standard values with implicit bases', () => {
            expect(parseInteger("0xff")).toBe(255n);
            expect(parseInteger("1111_1111", 2)).toBe(255n);
            expect(parseInteger("-0b1010")).toBe(-10n);
        });

        it('should parse extreme 64-bit bounds accurately', () => {
            expect(parseInteger("18446744073709551616")).toBe(18446744073709551616n);
        });

        it('should handle custom bases up to base 36', () => {
            expect(parseInteger("zz", 36)).toBe(1295n);
        });

        it('should throw explicit errors for invalid character sets', () => {
            expect(() => parseInteger("0b102")).toThrow();
        });
    });

    describe('Two\'s Complement Conversions', () => {
        it('should generate accurate signed bit strings', () => {
            expect(toTwosComplement(-1n, 8)).toBe("11111111");
            expect(toTwosComplement(128n, 8)).toBe("10000000");
        });

        it('should parse signed bit strings back to BigInt values', () => {
            expect(fromTwosComplement("11111111", 8)).toBe(-1n);
            expect(fromTwosComplement("10000000", 8)).toBe(-128n);
        });

        it('should throw an error for values exceeding bit bounds', () => {
            expect(() => toTwosComplement(128n, 8)).toThrow();
        });
    });
});
