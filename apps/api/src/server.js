import app from './app.js'
import {getRedisClient,getConfig,disconnectRedis} from './singletons/index.js'
import {getDb,disconnectDb} from './database/db.js'
const config = getConfig();

const server = app.listen(config.server.port,()=>{
    console.log(`[server running on port ${config.server.port}]`);
    console.log(`server environment: ${config.server.env}`);
});
getRedisClient();
getDb();

const shutDown = async(signal)=>{
    console.log(` server ${signal} recived -- shutting down`);

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