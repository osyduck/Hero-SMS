import type { ApiErrorCode } from './types';

/**
 * Base error class for HeroSMS API errors
 */
export class HeroSMSError extends Error {
    public readonly code: ApiErrorCode | string;
    public readonly rawResponse: string;

    constructor(code: ApiErrorCode | string, message: string, rawResponse: string) {
        super(message);
        this.name = 'HeroSMSError';
        this.code = code;
        this.rawResponse = rawResponse;
        Object.setPrototypeOf(this, HeroSMSError.prototype);
    }
}

/**
 * Error thrown when no numbers are available
 */
export class NoNumbersError extends HeroSMSError {
    constructor(rawResponse: string) {
        super('NO_NUMBERS', 'No numbers available for the requested service and country', rawResponse);
        this.name = 'NoNumbersError';
        Object.setPrototypeOf(this, NoNumbersError.prototype);
    }
}

/**
 * Error thrown when API key is invalid or missing
 */
export class AuthenticationError extends HeroSMSError {
    constructor(code: 'BAD_KEY' | 'NO_KEY', rawResponse: string) {
        const message = code === 'NO_KEY'
            ? 'API key is missing'
            : 'API key is invalid';
        super(code, message, rawResponse);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Error thrown when activation is not found
 */
export class ActivationNotFoundError extends HeroSMSError {
    constructor(rawResponse: string) {
        super('NO_ACTIVATION', 'Activation not found', rawResponse);
        this.name = 'ActivationNotFoundError';
        Object.setPrototypeOf(this, ActivationNotFoundError.prototype);
    }
}

/**
 * Error thrown when trying to cancel too early
 */
export class EarlyCancelError extends HeroSMSError {
    constructor(rawResponse: string) {
        super('EARLY_CANCEL_DENIED', 'Cannot cancel activation within the first 2 minutes', rawResponse);
        this.name = 'EarlyCancelError';
        Object.setPrototypeOf(this, EarlyCancelError.prototype);
    }
}

/**
 * Error thrown when max price is too low
 */
export class WrongMaxPriceError extends HeroSMSError {
    public readonly minimumPrice: number;

    constructor(rawResponse: string, minimumPrice: number) {
        super('WRONG_MAX_PRICE', `Maximum price is too low. Minimum price: ${minimumPrice}`, rawResponse);
        this.name = 'WrongMaxPriceError';
        this.minimumPrice = minimumPrice;
        Object.setPrototypeOf(this, WrongMaxPriceError.prototype);
    }
}

/**
 * Error thrown when user is banned
 */
export class BannedError extends HeroSMSError {
    public readonly bannedUntil: string;

    constructor(rawResponse: string, bannedUntil: string) {
        super('BANNED', `Account is banned until ${bannedUntil}`, rawResponse);
        this.name = 'BannedError';
        this.bannedUntil = bannedUntil;
        Object.setPrototypeOf(this, BannedError.prototype);
    }
}

/**
 * Map of error codes to their descriptions
 */
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
    BAD_ACTION: 'Incorrect action specified',
    BAD_KEY: 'Incorrect API key',
    NO_KEY: 'API key is missing',
    ERROR_SQL: 'Server database error',
    BAD_SERVICE: 'Incorrect service specified',
    BAD_STATUS: 'Incorrect status specified',
    NO_NUMBERS: 'No numbers available',
    NO_ACTIVATION: 'Activation not found',
    WRONG_ACTIVATION_ID: 'Invalid activation ID',
    WRONG_MAX_PRICE: 'Maximum price is too low',
    EARLY_CANCEL_DENIED: 'Cannot cancel within first 2 minutes',
    CHANNELS_LIMIT: 'Account channels limit reached',
    OPERATORS_NOT_FOUND: 'No operators found',
    ORDER_ALREADY_EXISTS: 'Order already exists',
    NO_ACTIVATIONS: 'No activations found',
};
