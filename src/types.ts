/**
 * HeroSMS API Types
 * Based on OpenAPI specification for SMS-Activate compatible API
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Activation status codes for setStatus action
 */
export enum ActivationStatusCode {
    /** SMS sent - inform about readiness to receive code */
    SMS_SENT = 1,
    /** Request resending of SMS */
    REQUEST_RESEND = 3,
    /** Complete activation (code received and confirmed) */
    COMPLETE = 6,
    /** Cancel activation (return money) */
    CANCEL = 8,
}

/**
 * Supported languages for API responses
 */
export type Language = 'ru' | 'en' | 'cn' | 'es' | 'pt' | 'fr';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response from getNumberV2 endpoint
 */
export interface GetNumberV2Response {
    activationId: number;
    phoneNumber: string;
    activationCost: number;
    currency: number;
    countryCode: string;
    canGetAnotherSms: string;
    activationTime: string;
    activationOperator: string;
}

/**
 * SMS information in activation status
 */
export interface SmsInfo {
    dateTime: string;
    code: string;
    text: string;
}

/**
 * Call information in activation status
 */
export interface CallInfo {
    from: string;
    text: string;
    code: string;
    dateTime: string;
    url: string;
    parsingCount: number;
}

/**
 * Response from getStatusV2 endpoint
 */
export interface ActivationStatusV2 {
    verificationType: number;
    sms: SmsInfo;
    call: CallInfo;
}

/**
 * Single active activation
 */
export interface ActiveActivation {
    activationId: string;
    serviceCode: string;
    phoneNumber: string;
    activationCost: number;
    activationStatus: string;
    smsCode: string | null;
    smsText: string | null;
    activationTime: string;
    discount: string;
    repeated: string;
    countryCode: string;
    countryName: string;
    canGetAnotherSms: string;
    currency: string;
}

/**
 * Response from getActiveActivations endpoint
 */
export interface ActiveActivationsResponse {
    status: string;
    activeActivations: ActiveActivation[];
}

/**
 * Single activation history item
 */
export interface ActivationHistoryItem {
    id: string;
    date: string;
    phone: string;
    sms: string;
    cost: number;
    status: string;
    currency: number;
}

/**
 * Country information
 */
export interface Country {
    id: number;
    rus: string;
    eng: string;
    chn: string;
    visible: 0 | 1;
    retry: 0 | 1;
}

/**
 * Countries response - object keyed by country ID
 */
export type CountriesResponse = Record<string, Country>;

/**
 * Service information
 */
export interface Service {
    code: string;
    name: string;
}

/**
 * Response from getServicesList endpoint
 */
export interface ServicesListResponse {
    status: string;
    services: Service[];
}

/**
 * Response from getOperators endpoint
 */
export interface OperatorsResponse {
    status: string;
    countryOperators: Record<string, string[]>;
}

/**
 * Price information for a service in a country
 */
export interface PriceInfo {
    cost: number;
    count: number;
    physicalCount: number;
}

/**
 * Prices by country - Record<countryId, Record<serviceCode, PriceInfo>>
 */
export type PricesByCountry = Record<string, Record<string, PriceInfo>>;

/**
 * Top country info for a single service
 */
export interface TopCountryInfo {
    physicalTotalCount: number;
    physicalCountForDefaultPrice: number;
    physicalPriceMap: Record<string, number>;
    retail_price: number;
    country: number;
    price: number;
    count: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Known API error codes
 */
export type ApiErrorCode =
    | 'BAD_ACTION'
    | 'BAD_KEY'
    | 'NO_KEY'
    | 'ERROR_SQL'
    | 'BAD_SERVICE'
    | 'BAD_STATUS'
    | 'NO_NUMBERS'
    | 'NO_ACTIVATION'
    | 'WRONG_ACTIVATION_ID'
    | 'WRONG_MAX_PRICE'
    | 'EARLY_CANCEL_DENIED'
    | 'CHANNELS_LIMIT'
    | 'OPERATORS_NOT_FOUND'
    | 'ORDER_ALREADY_EXISTS'
    | 'NO_ACTIVATIONS';

/**
 * Parsed number response from getNumber
 */
export interface ParsedNumberResponse {
    activationId: number;
    phoneNumber: string;
}

/**
 * Parsed status response from getStatus
 */
export interface ParsedStatusResponse {
    status: 'STATUS_WAIT_CODE' | 'STATUS_WAIT_RETRY' | 'STATUS_WAIT_RESEND' | 'STATUS_CANCEL' | 'STATUS_OK';
    code?: string;
}

// ============================================================================
// Request Option Types
// ============================================================================

/**
 * Options for getNumber request
 */
export interface GetNumberOptions {
    service: string;
    country: number;
    maxPrice?: number;
    ref?: string;
    operator?: string;
}

/**
 * Options for getHistory request
 */
export interface GetHistoryOptions {
    start?: number;
    end?: number;
    offset?: number;
    size?: number;
}

/**
 * Options for getServicesList request
 */
export interface GetServicesListOptions {
    country?: number;
    lang?: Language;
}

/**
 * Options for getPrices request
 */
export interface GetPricesOptions {
    service?: string;
    country?: number;
}

/**
 * Options for getTopCountriesByService request
 */
export interface GetTopCountriesOptions {
    service?: string;
    freePrice?: boolean;
}
