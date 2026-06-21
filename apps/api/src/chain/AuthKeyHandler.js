import { AbstractHandler } from './AbstractHandler.js'

export class AuthKeyHandler extends AbstractHandler {

    constructor(clientRepository) {
        super();
        this.clientRepository = clientRepository;
    }

    async handle(request) {
        const apiKey = request.headers?.['x-api-key'];
        const clientName = request.headers?.['x-client-name'];

        if (!apiKey) {
            return {
                success: false,
                statusCode: 401,
                error: 'Missing API key'
            };
        }

        let clientConfig = await this.clientRepository.findByApiKey(apiKey);

        if (!clientConfig) {
            try {
                clientConfig = await this.clientRepository.save({
                    apiKey: apiKey,
                    clientName: clientName || 'Auto-Registered Project',
                    planId: 'free',
                    algorithm: 'token_bucket'
                });
            } catch (err) {
                return {
                    success: false,
                    statusCode: 500,
                    error: 'Failed to auto-register client'
                };
            }
        }

        request.apiKey = apiKey;
        request.planId = clientConfig.planId;
        request.clientConfig = clientConfig;
        request.customLimits = clientConfig.customLimits || null;

        return super.handle(request);
    }
}