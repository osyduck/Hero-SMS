import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { HeroSMSClient, ActivationStatusCode, NoNumbersError, AuthenticationError } from '../src';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('HeroSMSClient', () => {
    let client: HeroSMSClient;
    let mockGet: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockGet = vi.fn();
        mockedAxios.create.mockReturnValue({
            get: mockGet,
        } as any);

        client = new HeroSMSClient({ apiKey: 'test-api-key' });
    });

    describe('getBalance', () => {
        it('should parse balance correctly', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_BALANCE:150.50' });

            const balance = await client.getBalance();

            expect(balance).toBe(150.50);
            expect(mockGet).toHaveBeenCalledWith('', {
                params: { api_key: 'test-api-key', action: 'getBalance' },
            });
        });

        it('should throw AuthenticationError for BAD_KEY', async () => {
            mockGet.mockResolvedValue({ data: 'BAD_KEY' });

            await expect(client.getBalance()).rejects.toThrow(AuthenticationError);
        });
    });

    describe('getNumber', () => {
        it('should parse number response correctly', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_NUMBER:123456:79001234567' });

            const result = await client.getNumber({ service: 'tg', country: 2 });

            expect(result.activationId).toBe(123456);
            expect(result.phoneNumber).toBe('79001234567');
        });

        it('should throw NoNumbersError when no numbers available', async () => {
            mockGet.mockResolvedValue({ data: 'NO_NUMBERS' });

            await expect(client.getNumber({ service: 'tg', country: 2 }))
                .rejects.toThrow(NoNumbersError);
        });

        it('should include optional parameters', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_NUMBER:123:79001234567' });

            await client.getNumber({
                service: 'tg',
                country: 2,
                maxPrice: 1.5,
                operator: 'beeline',
            });

            expect(mockGet).toHaveBeenCalledWith('', {
                params: expect.objectContaining({
                    maxPrice: 1.5,
                    operator: 'beeline',
                }),
            });
        });
    });

    describe('getStatus', () => {
        it('should parse STATUS_OK with code', async () => {
            mockGet.mockResolvedValue({ data: 'STATUS_OK:123456' });

            const result = await client.getStatus(123);

            expect(result.status).toBe('STATUS_OK');
            expect(result.code).toBe('123456');
        });

        it('should parse STATUS_WAIT_CODE', async () => {
            mockGet.mockResolvedValue({ data: 'STATUS_WAIT_CODE' });

            const result = await client.getStatus(123);

            expect(result.status).toBe('STATUS_WAIT_CODE');
            expect(result.code).toBeUndefined();
        });
    });

    describe('setStatus', () => {
        it('should call with correct status code', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_READY' });

            await client.setStatus(123, ActivationStatusCode.SMS_SENT);

            expect(mockGet).toHaveBeenCalledWith('', {
                params: {
                    api_key: 'test-api-key',
                    action: 'setStatus',
                    id: 123,
                    status: 1,
                },
            });
        });
    });

    describe('helper methods', () => {
        it('markReady should use SMS_SENT status', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_READY' });

            await client.markReady(123);

            expect(mockGet).toHaveBeenCalledWith('', {
                params: expect.objectContaining({ status: 1 }),
            });
        });

        it('cancel should use CANCEL status', async () => {
            mockGet.mockResolvedValue({ data: 'ACCESS_CANCEL' });

            await client.cancel(123);

            expect(mockGet).toHaveBeenCalledWith('', {
                params: expect.objectContaining({ status: 8 }),
            });
        });
    });
});
