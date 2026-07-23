import app from './app.js'
import {getRedisClient,getConfig,disconnectRedis} from './singletons/index.js'
import {getDb,disconnectDb} from './database/db.js'
import dotenv from 'dotenv'
dotenv.config()

const config = getConfig();

await getRedisClient();
await getDb();
const server = app.listen(config.server.port,()=>{
    console.log(`[server running on port ${config.server.port}]`);
    console.log(`server environment: ${config.server.env}`);
});

const shutDown = async(signal)=>{
    console.log(`server ${signal} received -- shutting down`);

    server.close(async()=>{
        await disconnectRedis();
        await disconnectDb();
        console.log(`server shutdown complete`);
        process.exit(0);
    });
}

process.on('SIGTERM',()=> shutDown('SIGTERM'));
process.on('SIGINT',()=> shutDown('SIGINT'));

process.on('unhandledRejection',(err)=>{
    console.error(` server unhandled rejection:`,err.message);
    shutDown('unhandledRejection');
});