import {IRateLimiter} from '../algorithms/IRateLimiter.js'

export class InMemoryFallbackLimiter extends IRateLimiter{
    
    constructor({maxRequests,windowMs}){
        super();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.counters = new Map();
        this.cleanupInterval = setInterval(()=> this.cleanup(),this.windowMs);
    }

    async isAllowed(key){
        const now = Date.now();
        const windowId = Math.floor(now / this.windowMs);
        const entry = this.counters.get(key);
        let count;
        if(!entry || entry.windowId !== windowId){
            count=1;
            this.counters.set(key,{count,windowId});
        }else{
            count = entry.count+1;
            entry.count = count;
        }

        const allowed = count<=this.maxRequests;
        const remaining = Math.max(0,this.maxRequests-count);
        const resetAt = (windowId+1)*this.windowMs;

        return {allowed,remaining,resetAt};
    }

    getName(){
        return 'in_memory_fallback';
    }

    cleanup(){
        const curWindowId = Math.floor(Date.now()/this.windowMs);
        for(const [key,entry] of this.counters.entries()){
            if(entry.windowId < curWindowId){
                this.counters.delete(key);
            }
        }
    }

    destroy(){
        clearInterval(this.cleanupInterval);
    }
}
