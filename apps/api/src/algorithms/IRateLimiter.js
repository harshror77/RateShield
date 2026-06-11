export class IRateLimiter{
    
    async isAllowed(key,options){
        throw new Error(
            `${this.constructor.name} must implement isAllowed(key,options)`
        );
    }

    getName(){
        throw new Error(`${this.constructor.name} must implement getName()`);
    }
}