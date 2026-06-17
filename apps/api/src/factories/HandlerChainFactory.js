import {IpExtractionHandler,AuthKeyHandler,RateLimitHandler} from '../chain/index.js'

export class HandlerChainFactory{
    constructor(clientRepository,rateLimiterFactory){
        this.clientRepository = clientRepository;
        this.rateLimiterFactory = rateLimiterFactory;
    }

    buildChain(){
        const ipHandler = new IpExtractionHandler();
        const authHandler = new AuthKeyHandler(this.clientRepository);
        const rateLimitHandler = new RateLimitHandler(this.rateLimiterFactory);

        ipHandler.setNext(authHandler).setNext(rateLimitHandler);

        return ipHandler;
    }
}