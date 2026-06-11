import dotenv from "dotenv"
import {planLimits,PLANS,ALGORITHMS} from '../config/plans.config.js'

dotenv.config();
let config=null;

export function getConfig(){
    if(config) return config;

    config = {
        server:{
            port:parseInt(process.env.PORT || '3000'),
            env: process.env.NODE_ENV || 'development',
            isDev:process.env.NODE_ENV !== 'production',
        },
        redis:{
            host:process.env.REDIS_HOST || 'localhost',
            port:parseInt(process.env.REDIS_PORT) || '6379',
            password:process.env.REDIS_PASSWORD || undefined,
        },
        postgres: {
            host:process.env.POSTGRES_HOST || 'localhost',
            port:parseInt(process.env.POSTGRES_PORT || '5432'),
            user:process.env.POSTGRES_USER || 'admin',
            password: process.env.POSTGRES_PASSWORD || 'secret',
            database: process.env.POSTGRES_DB  || 'rate_limiter',
        },
        circuitBreaker:{
            threshold:parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
            recoveryMs: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_MS || '30000',)
        },

        planLimits,
        ALGORITHMS,
        PLANS
    };

    console.log(`[Config] Loaded- env: ${config.server.env}, port: ${config.server.port}`);
    return config;
}