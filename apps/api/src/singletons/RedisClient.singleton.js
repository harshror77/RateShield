import Redis from 'ioredis';
import {redisConfig} from '../config/redis.config.js'

let instance=null;

export function getRedisClient(){
    if(instance) return instance;
    instance = new Redis(redisConfig);

    instance.on('connect',()=>{
        console.log('[Redis] connected successfully');
    });
    instance.on('error',(err)=>{
        console.error('[Redis] connection error:',err.message);
    });
    instance.on('close',()=>{
        console.warn('[Redis] connection closed');
    });
    
    return instance;
}

export async function disconnectRedis(){
    if(instance){
        await instance.quit();
        instance=null;
        console.log('[Redis] disconnected cleanly');
    }
}