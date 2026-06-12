import {AbstractHandler} from './AbstractHandler.js'

export class IpExtractionHandler extends AbstractHandler{

    async handle(request){
        const forwardedFor = request.headers?.['x-forwarded-for'];

        let ip;
        if(forwardedFor){
            ip = forwardedFor.split(',')[0].trim();
        }
        else ip = request.connectionIp;

        if(!ip){
            return{
                success:false,
                statusCode:400,
                error:'Unable to determine client Ip address'
            };
        }

        request.ip = ip;
        return super.handle(request);
    }
}