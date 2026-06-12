import {AbstractHandler} from './AbstractHandler.js'

export class AuthKeyHandler extends AbstractHandler{

    constructor(clientRepository){
        super();
        this.clientRepository = clientRepository;
    }

    async handle(request){
        const apiKey = request.headers?.['x-api-key'];
        if(!apiKey){
            return{
                success:false,
                statusCode:401,
                error:'Missing API key'
            };
        }

        const clientConfig = await this.clientRepository.findByApiKey(apiKey);

        if(!clientConfig){
            return{
                success:false,
                statusCode:401,
                error:"Invalid API key"
            };
        }

        request.apiKey = apiKey;
        request.planId = clientConfig.planId;
        request.clientConfig = clientConfig;

        return super.handle(request);
    }
}