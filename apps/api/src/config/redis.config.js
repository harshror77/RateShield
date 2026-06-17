import dotenv from 'dotenv'
dotenv.config();

export const redisConfig = {
    host:process.env.REDIS_HOST || 'localhost',
    port:parseInt(process.env.REDIS_PORT || '6379'),
    password:process.env.REDIS_PASSWORD || undefined,

    retryStrategy(times){
        if(times>10) return null;
        return Math.min(times*500,2000);
    },

    connectTimeout: 5000,
    commandTimeout:2000 
};
