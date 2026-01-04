/**
 * HeroSMS - TypeScript library for HeroSMS SMS activation service
 * 
 * @packageDocumentation
 */

// Main client
export { HeroSMSClient, HeroSMSClientOptions } from './client';

// Types
export {
    // Enums
    ActivationStatusCode,
    Language,

    // Response types
    GetNumberV2Response,
    SmsInfo,
    CallInfo,
    ActivationStatusV2,
    ActiveActivation,
    ActiveActivationsResponse,
    ActivationHistoryItem,
    Country,
    CountriesResponse,
    Service,
    ServicesListResponse,
    OperatorsResponse,
    PriceInfo,
    PricesByCountry,
    TopCountryInfo,

    // Parsed responses
    ParsedNumberResponse,
    ParsedStatusResponse,

    // Request options
    GetNumberOptions,
    GetHistoryOptions,
    GetServicesListOptions,
    GetPricesOptions,
    GetTopCountriesOptions,

    // Error types
    ApiErrorCode,
} from './types';

// Errors
export {
    HeroSMSError,
    NoNumbersError,
    AuthenticationError,
    ActivationNotFoundError,
    EarlyCancelError,
    WrongMaxPriceError,
    BannedError,
    ERROR_MESSAGES,
} from './errors';

// Default export
export { HeroSMSClient as default } from './client';
