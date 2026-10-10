// Core conversion engine using BigInt to handle infinite accuracy numbers
export function parseInteger(input: string, base?: number): bigint {
    let cleanInput = input.trim().replace(/\s+/g, '');
    if (!cleanInput) throw new Error("Input is empty");

    let detectedBase = base;
    
    // Automatically detect standard prefixes if base isn't explicitly set
    if (!base) {
        if (cleanInput.toLowerCase().startsWith('0x')) {
            detectedBase = 16;
            cleanInput = cleanInput.slice(2);
        } else if (cleanInput.toLowerCase().startsWith('0b')) {
            detectedBase = 2;
            cleanInput = cleanInput.slice(2);
        } else if (cleanInput.toLowerCase().startsWith('0o')) {
            detectedBase = 8;
            cleanInput = cleanInput.slice(2);
        } else {
            detectedBase = 10;
        }
    } else {
        // Strip out redundant prefix flags matching the target base selector
        if (base === 16 && cleanInput.toLowerCase().startsWith('0x')) cleanInput = cleanInput.slice(2);
        if (base === 2 && cleanInput.toLowerCase().startsWith('0b')) cleanInput = cleanInput.slice(2);
        if (base === 8 && cleanInput.toLowerCase().startsWith('0o')) cleanInput = cleanInput.slice(2);
    }

    if (detectedBase! < 2 || detectedBase! > 36) {
        throw new Error("Base must be between 2 and 36");
    }

    // Handle sign indicators safely
    let isNegative = false;
    if (cleanInput.startsWith('-')) {
        isNegative = true;
        cleanInput = cleanInput.slice(1);
    } else if (cleanInput.startsWith('+')) {
        cleanInput = cleanInput.slice(1);
    }

    if (!cleanInput) throw new Error("Missing digits after sign/prefix");

    // Perform the custom base digit translation
    let result = 0n;
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    const baseBig = BigInt(detectedBase!);

    for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i].toLowerCase();
        const value = digits.indexOf(char);
        
        if (value === -1 || value >= detectedBase!) {
            throw new Error(`Invalid character "${cleanInput[i]}" for base ${detectedBase}`);
        }
        result = result * baseBig + BigInt(value);
    }

    return isNegative ? -result : result;
}

export function formatInteger(value: bigint, base: number, options?: { uppercase?: boolean; groupSize?: number }): string {
    if (base < 2 || base > 36) throw new Error("Base must be between 2 and 36");
    
    let isNegative = value < 0n;
    let absValue = isNegative ? -value : value;
    
    let str = absValue.toString(base);
    if (options?.uppercase) {
        str = str.toUpperCase();
    }

    // Apply specific digit chunk spacing if requested (e.g., separating binary blocks)
    if (options?.groupSize && options.groupSize > 0) {
        const size = options.groupSize;
        const chunks: string[] = [];
        let i = str.length;
        while (i > 0) {
            chunks.unshift(str.slice(Math.max(0, i - size), i));
            i -= size;
        }
        str = chunks.join(' ');
    }

    return isNegative ? '-' + str : str;
}

export function toTwosComplement(value: bigint, bits: number): string {
    const maxVal = (1n << BigInt(bits - 1)) - 1n;
    const minVal = -(1n << BigInt(bits - 1));
    
    if (value > maxVal || value < minVal) {
        throw new Error(`Value out of range for signed ${bits}-bit width`);
    }

    let mask = (1n << BigInt(bits)) - 1n;
    let twosComp = value & mask;
    let binaryStr = twosComp.toString(2);
    
    return binaryStr.padStart(bits, '0');
}

export function fromTwosComplement(binaryStr: string, bits: number): bigint {
    const cleanBin = binaryStr.replace(/\s+/g, '');
    if (cleanBin.length !== bits || /[^01]/.test(cleanBin)) {
        throw new Error(`Binary string must be exactly ${bits} bits long`);
    }

    let value = BigInt("0b" + cleanBin);
    const signBit = 1n << BigInt(bits - 1);
    
    if ((value & signBit) !== 0n) {
        value = value - (1n << BigInt(bits));
    }
    
    return value;
}
