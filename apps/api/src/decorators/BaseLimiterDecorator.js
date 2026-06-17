import {IRateLimiter} from '../algorithms/IRateLimiter.js';

export class BaseLimiterDecorator extends IRateLimiter{
    
    constructor(wrappedLimiter){
        super();
        this.wrappedLimiter = wrappedLimiter;
    }

    async isAllowed(key,options){
        return this.wrappedLimiter.isAllowed(key,options);
    }

    getName(){
        return `${this.constructor.name}-> ${this.wrappedLimiter.getName()}`;
    }
}