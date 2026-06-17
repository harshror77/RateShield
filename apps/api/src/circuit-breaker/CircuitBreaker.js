export const CircuitState = {
    CLOSED:'CLOSED',
    OPEN:'OPEN',
    HALF_OPEN:'HALF_OPEN'
};

export class CircuitBreaker{

    constructor({threshold,recoveryMs}){
        this.threshold = threshold;
        this.recoveryMs = recoveryMs;
        this.state = CircuitState.CLOSED;
        this.failureCount=0;
        this.openedAt = null;
    }

    async execute(fn){
        if(this.state===CircuitState.OPEN){
            const elapsed = Date.now()-this.openedAt;
            if(elapsed< this.recoveryMs) throw new Error('CIRCUIT_OPEN');
            this.state = CircuitState.HALF_OPEN;
            console.warn('[CircuitBreaker] OPEN -> HALF_OPEN (testing recovery)');

        }
        try{
            const result = await fn();
            if(this.state===CircuitState.HALF_OPEN){
                console.log('[CircuitBreaker] HALF_OPEN -> CLOSED (Redis recovered)');
            }
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
            return result;
        } catch(err){
            this.failureCount +=1;
            if(this.state===CircuitState.HALF_OPEN || this.failureCount>=this.threshold){
                this.state = CircuitState.OPEN;
                this.openedAt = Date.now();
                console.error(
                    `[CircuitBreaker]-> OPEN (failures: ${this.failureCount})`
                );
            }
            throw err;
        }
    }

    getState(){
        return{
            state:this.state,
            failureCount:this.failureCount,
            openedAt:this.openedAt
        };
    }
}