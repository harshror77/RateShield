import { AbstractHandler } from './AbstractHandler.js'

const clientCache = new Map();
const CACHE_TTL_MS = 300000; 

export class AuthKeyHandler extends AbstractHandler {
    constructor(clientRepository) {
        super();
        this.clientRepository = clientRepository;
    }

    async handle(request) {
        const apiKey = request.headers?.['x-api-key'];

        if (!apiKey) {
            return {
                success: false,
                statusCode: 401,
                error: 'Missing API key'
            };
        }

        let clientConfig = null;
        const cached = clientCache.get(apiKey);

        if (cached && Date.now() < cached.expiresAt) {
            clientConfig = cached.data;
        }

        if (!clientConfig) {
            clientConfig = await this.clientRepository.findByApiKey(apiKey);

            if (!clientConfig) {
                return {
                    success: false,
                    statusCode: 401,
                    error: 'Invalid API key'
                };
            }

            clientCache.set(apiKey, {
                data: clientConfig,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
        }

        request.apiKey = apiKey;
        request.planId = clientConfig.planId;
        request.clientConfig = clientConfig;
        request.customLimits = clientConfig.customLimits || null;

        return super.handle(request);
    }
}