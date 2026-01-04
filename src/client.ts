import axios, { AxiosInstance } from 'axios';
import {
    ActivationStatusCode,
    GetNumberOptions,
    GetNumberV2Response,
    ParsedNumberResponse,
    ParsedStatusResponse,
    ActiveActivationsResponse,
    ActivationHistoryItem,
    GetHistoryOptions,
    CountriesResponse,
    ServicesListResponse,
    GetServicesListOptions,
    OperatorsResponse,
    PricesByCountry,
    GetPricesOptions,
    TopCountryInfo,
    GetTopCountriesOptions,
    ActivationStatusV2,
} from './types';
import {
    HeroSMSError,
    NoNumbersError,
    AuthenticationError,
    ActivationNotFoundError,
    EarlyCancelError,
    WrongMaxPriceError,
    BannedError,
    ERROR_MESSAGES,
} from './errors';
import type { ApiErrorCode } from './types';

/**
 * Configuration options for HeroSMSClient
 */
export interface HeroSMSClientOptions {
    /** API key for authentication */
    apiKey: string;
    /** Base URL for the API (default: https://hero-sms.com/stubs/handler_api.php) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}

/**
 * HeroSMS API Client
 * 
 * A TypeScript client for the HeroSMS SMS activation service.
 * Compatible with SMS-Activate API protocol.
 * 
 * @example
 * ```typescript
 * const client = new HeroSMSClient({ apiKey: 'your-api-key' });
 * 
 * // Get balance
 * const balance = await client.getBalance();
 * console.log(`Balance: ${balance}`);
 * 
 * // Get a number for Telegram in Kazakhstan
 * const { activationId, phoneNumber } = await client.getNumber({
 *   service: 'tg',
 *   country: 2,
 * });
 * 
 * // Wait for SMS and get status
 * const status = await client.getStatus(activationId);
 * if (status.status === 'STATUS_OK') {
 *   console.log(`Code: ${status.code}`);
 * }
 * ```
 */
export class HeroSMSClient {
    private readonly apiKey: string;
    private readonly httpClient: AxiosInstance;

    constructor(options: HeroSMSClientOptions) {
        this.apiKey = options.apiKey;

        this.httpClient = axios.create({
            baseURL: options.baseUrl || 'https://hero-sms.com/stubs/handler_api.php',
            timeout: options.timeout || 30000,
        });
    }

    /**
     * Make a request to the API
     */
    private async request<T = string>(action: string, params: Record<string, unknown> = {}): Promise<T> {
        const response = await this.httpClient.get('', {
            params: {
                api_key: this.apiKey,
                action,
                ...params,
            },
        });

        const data = response.data;

        // Handle string responses (most endpoints return text)
        if (typeof data === 'string') {
            this.checkForErrors(data);
        }

        return data as T;
    }

    /**
     * Check response string for error codes and throw appropriate errors
     */
    private checkForErrors(response: string): void {
        // Check for banned
        if (response.startsWith('BANNED:')) {
            const bannedUntil = response.split(':')[1] || 'unknown';
            throw new BannedError(response, bannedUntil);
        }

        // Check for wrong max price (contains minimum price)
        if (response.startsWith('WRONG_MAX_PRICE:')) {
            const minPrice = parseFloat(response.split(':')[1] || '0');
            throw new WrongMaxPriceError(response, minPrice);
        }

        // Check for known error codes
        const errorCodes: ApiErrorCode[] = [
            'BAD_ACTION', 'BAD_KEY', 'NO_KEY', 'ERROR_SQL', 'BAD_SERVICE',
            'BAD_STATUS', 'NO_NUMBERS', 'NO_ACTIVATION', 'WRONG_ACTIVATION_ID',
            'EARLY_CANCEL_DENIED', 'CHANNELS_LIMIT', 'OPERATORS_NOT_FOUND',
            'ORDER_ALREADY_EXISTS', 'NO_ACTIVATIONS'
        ];

        for (const code of errorCodes) {
            if (response === code || response.startsWith(code)) {
                switch (code) {
                    case 'NO_NUMBERS':
                        throw new NoNumbersError(response);
                    case 'BAD_KEY':
                    case 'NO_KEY':
                        throw new AuthenticationError(code, response);
                    case 'NO_ACTIVATION':
                        throw new ActivationNotFoundError(response);
                    case 'EARLY_CANCEL_DENIED':
                        throw new EarlyCancelError(response);
                    default:
                        throw new HeroSMSError(code, ERROR_MESSAGES[code] || code, response);
                }
            }
        }
    }

    // ============================================================================
    // Balance
    // ============================================================================

    /**
     * Get current account balance
     * @returns Balance amount as a number
     */
    async getBalance(): Promise<number> {
        const response = await this.request<string>('getBalance');
        // Response format: ACCESS_BALANCE:100.00
        const match = response.match(/ACCESS_BALANCE:(.+)/);
        if (!match) {
            throw new HeroSMSError('PARSE_ERROR', `Unexpected balance response: ${response}`, response);
        }
        return parseFloat(match[1]);
    }

    // ============================================================================
    // Number Management
    // ============================================================================

    /**
     * Request a phone number for activation
     * @param options - Options including service code and country
     * @returns Parsed response with activationId and phoneNumber
     */
    async getNumber(options: GetNumberOptions): Promise<ParsedNumberResponse> {
        const params: Record<string, unknown> = {
            service: options.service,
            country: options.country,
        };

        if (options.maxPrice !== undefined) params.maxPrice = options.maxPrice;
        if (options.ref) params.ref = options.ref;
        if (options.operator) params.operator = options.operator;

        const response = await this.request<string>('getNumber', params);
        // Response format: ACCESS_NUMBER:123456789:79001234567
        const match = response.match(/ACCESS_NUMBER:(\d+):(.+)/);
        if (!match) {
            throw new HeroSMSError('PARSE_ERROR', `Unexpected number response: ${response}`, response);
        }
        return {
            activationId: parseInt(match[1], 10),
            phoneNumber: match[2],
        };
    }

    /**
     * Request a phone number for activation (V2 - returns more details)
     * @param options - Options including service code and country
     * @returns Detailed activation information
     */
    async getNumberV2(options: GetNumberOptions): Promise<GetNumberV2Response> {
        const params: Record<string, unknown> = {
            service: options.service,
            country: options.country,
        };

        if (options.maxPrice !== undefined) params.maxPrice = options.maxPrice;
        if (options.ref) params.ref = options.ref;
        if (options.operator) params.operator = options.operator;

        return await this.request<GetNumberV2Response>('getNumberV2', params);
    }

    // ============================================================================
    // Activation Status Management
    // ============================================================================

    /**
     * Change activation status
     * @param id - Activation ID
     * @param status - New status code
     * @returns Status change result string
     */
    async setStatus(id: number, status: ActivationStatusCode): Promise<string> {
        return await this.request<string>('setStatus', { id, status });
    }

    /**
     * Mark activation as ready to receive SMS
     * @param id - Activation ID
     */
    async markReady(id: number): Promise<string> {
        return this.setStatus(id, ActivationStatusCode.SMS_SENT);
    }

    /**
     * Request SMS resend
     * @param id - Activation ID
     */
    async requestResend(id: number): Promise<string> {
        return this.setStatus(id, ActivationStatusCode.REQUEST_RESEND);
    }

    /**
     * Complete activation (confirm code received)
     * @param id - Activation ID
     */
    async complete(id: number): Promise<string> {
        return this.setStatus(id, ActivationStatusCode.COMPLETE);
    }

    /**
     * Cancel activation and get refund
     * @param id - Activation ID
     */
    async cancel(id: number): Promise<string> {
        return this.setStatus(id, ActivationStatusCode.CANCEL);
    }

    /**
     * Get current activation status
     * @param id - Activation ID
     * @returns Parsed status with optional code
     */
    async getStatus(id: number): Promise<ParsedStatusResponse> {
        const response = await this.request<string>('getStatus', { id });

        // Parse response format: STATUS_OK:123456 or STATUS_WAIT_CODE
        if (response.startsWith('STATUS_OK:')) {
            return { status: 'STATUS_OK', code: response.split(':')[1] };
        }
        if (response.startsWith('STATUS_WAIT_RETRY:')) {
            return { status: 'STATUS_WAIT_RETRY', code: response.split(':')[1] };
        }
        if (response === 'STATUS_WAIT_CODE') {
            return { status: 'STATUS_WAIT_CODE' };
        }
        if (response === 'STATUS_WAIT_RESEND') {
            return { status: 'STATUS_WAIT_RESEND' };
        }
        if (response === 'STATUS_CANCEL') {
            return { status: 'STATUS_CANCEL' };
        }

        throw new HeroSMSError('PARSE_ERROR', `Unexpected status response: ${response}`, response);
    }

    /**
     * Get activation status V2 (structured response)
     * @param id - Activation ID
     * @returns Detailed activation status
     */
    async getStatusV2(id: number): Promise<ActivationStatusV2> {
        return await this.request<ActivationStatusV2>('getStatusV2', { id });
    }

    /**
     * Get list of active activations
     * @returns Active activations list
     */
    async getActiveActivations(): Promise<ActiveActivationsResponse> {
        return await this.request<ActiveActivationsResponse>('getActiveActivations');
    }

    /**
     * Get activation history
     * @param options - Filter options for history
     * @returns Array of activation history items
     */
    async getHistory(options: GetHistoryOptions = {}): Promise<ActivationHistoryItem[]> {
        const params: Record<string, unknown> = {};
        if (options.start !== undefined) params.start = options.start;
        if (options.end !== undefined) params.end = options.end;
        if (options.offset !== undefined) params.offset = options.offset;
        if (options.size !== undefined) params.size = options.size;

        return await this.request<ActivationHistoryItem[]>('getHistory', params);
    }

    // ============================================================================
    // Reference Data
    // ============================================================================

    /**
     * Get list of available countries
     * @returns Object keyed by country ID
     */
    async getCountries(): Promise<CountriesResponse> {
        return await this.request<CountriesResponse>('getCountries');
    }

    /**
     * Get list of available services
     * @param options - Filter options
     * @returns Services list response
     */
    async getServicesList(options: GetServicesListOptions = {}): Promise<ServicesListResponse> {
        const params: Record<string, unknown> = {};
        if (options.country !== undefined) params.country = options.country;
        if (options.lang) params.lang = options.lang;

        return await this.request<ServicesListResponse>('getServicesList', params);
    }

    /**
     * Get list of available operators
     * @param country - Optional country filter
     * @returns Operators response
     */
    async getOperators(country?: number): Promise<OperatorsResponse> {
        const params: Record<string, unknown> = {};
        if (country !== undefined) params.country = country;

        return await this.request<OperatorsResponse>('getOperators', params);
    }

    /**
     * Get current prices
     * @param options - Filter options
     * @returns Prices by country and service
     */
    async getPrices(options: GetPricesOptions = {}): Promise<PricesByCountry> {
        const params: Record<string, unknown> = {};
        if (options.service) params.service = options.service;
        if (options.country !== undefined) params.country = options.country;

        return await this.request<PricesByCountry>('getPrices', params);
    }

    /**
     * Get top countries by service
     * @param options - Filter options
     * @returns Top countries data
     */
    async getTopCountriesByService(options: GetTopCountriesOptions = {}): Promise<TopCountryInfo[]> {
        const params: Record<string, unknown> = {};
        if (options.service) params.service = options.service;
        if (options.freePrice !== undefined) params.freePrice = options.freePrice;

        return await this.request<TopCountryInfo[]>('getTopCountriesByService', params);
    }

    /**
     * Get top countries by service based on user rank
     * @param options - Filter options
     * @returns Top countries data
     */
    async getTopCountriesByServiceRank(options: GetTopCountriesOptions = {}): Promise<TopCountryInfo[]> {
        const params: Record<string, unknown> = {};
        if (options.service) params.service = options.service;
        if (options.freePrice !== undefined) params.freePrice = options.freePrice;

        return await this.request<TopCountryInfo[]>('getTopCountriesByServiceRank', params);
    }
}
