/**
 * Example script to test HeroSMS with a real API key
 * 
 * Usage:
 *   npx tsx examples/test-api.ts YOUR_API_KEY
 * 
 * Or set environment variable:
 *   HERO_SMS_API_KEY=your-key npx tsx examples/test-api.ts
 */

import { HeroSMSClient, NoNumbersError } from '../src';

async function main() {
    const apiKey = process.argv[2] || process.env.HERO_SMS_API_KEY;

    if (!apiKey) {
        console.error('❌ Please provide API key as argument or set HERO_SMS_API_KEY env var');
        console.error('   Usage: npx tsx examples/test-api.ts YOUR_API_KEY');
        process.exit(1);
    }

    const client = new HeroSMSClient({ apiKey });

    console.log('🔄 Testing HeroSMS API...\n');

    // Test 1: Get Balance
    try {
        const balance = await client.getBalance();
        console.log(`✅ Balance: $${balance}`);
    } catch (error) {
        console.error('❌ Failed to get balance:', error);
        process.exit(1);
    }

    // Test 2: Get Countries
    try {
        const countries = await client.getCountries();
        const countryList = Object.values(countries);
        console.log(`✅ Countries available: ${countryList.length}`);
        console.log(`   First 5: ${countryList.slice(0, 5).map(c => c.eng).join(', ')}`);
    } catch (error) {
        console.error('❌ Failed to get countries:', error);
    }

    // Test 3: Get Services
    try {
        const response = await client.getServicesList({ lang: 'en' });
        console.log(`✅ Services available: ${response.services.length}`);
        console.log(`   First 5: ${response.services.slice(0, 5).map(s => s.name).join(', ')}`);
    } catch (error) {
        console.error('❌ Failed to get services:', error);
    }

    // Test 4: Get Prices for Telegram in Indonesia (country 6)
    try {
        const prices = await client.getPrices({ service: 'tg', country: 6 });
        console.log(`✅ Prices fetched for Telegram`);
        console.log(`   Data:`, JSON.stringify(prices, null, 2).slice(0, 200));
    } catch (error) {
        console.error('❌ Failed to get prices:', error);
    }

    console.log('\n✨ All basic tests completed!');

    // Check if user wants to test full activation flow
    if (process.argv.includes('--activate')) {
        console.log('\n--- Running Full Activation Flow ---');
        await testActivation(client);
    } else {
        console.log('\n💡 To test number activation, run with --activate flag:');
        console.log('   npx tsx examples/test-api.ts YOUR_API_KEY --activate');
    }
}

// Full activation flow (uncomment to test)
async function testActivation(client: HeroSMSClient) {
    try {
        // Get a number for Fore in Indonesia
        console.log('🔄 Requesting number for Fore...');
        const { activationId, phoneNumber } = await client.getNumber({
            service: 'asy',
            country: 6, // Indonesia
        });
        console.log(`✅ Got number: ${phoneNumber} (ID: ${activationId})`);

        // Mark as ready
        await client.markReady(activationId);
        console.log('✅ Marked as ready to receive SMS');

        // Poll for SMS (try 10 times with 5s delay)
        console.log('⏳ Waiting for SMS...');
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 5000));

            const status = await client.getStatus(activationId);
            console.log(`   Status: ${status.status}`);

            if (status.status === 'STATUS_OK') {
                console.log(`✅ Received code: ${status.code}`);
                await client.complete(activationId);
                return;
            }
        }

        // Timeout - cancel
        console.log('⏰ Timeout - canceling...');
        await client.cancel(activationId);

    } catch (error) {
        if (error instanceof NoNumbersError) {
            console.log('⚠️ No numbers available for this service/country');
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
