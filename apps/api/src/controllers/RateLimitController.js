import { RateLimitService } from "../services/index.js";

export class RateLimitController{
    constructor(){
        this.service = new RateLimitService();
    }

    async check(req,res,next){
        try{
            const result = await this.service.check(req);
            res.setHeader('X-RateLimit-Remaining',result.remaining ?? 0);
            res.setHeader('X-RateLimit-Reset',result.resetAt ?? 0);

            if(!result.success){
                return res.status(result.statusCode || 429).json({
                    allowed:false,
                    error:result.error,
                    deniedBy:result.deniedBy,
                    remaining:result.remaining,
                    resetAt:result.resetAt,
                    correlationId:req.correlationId
                });
            }
            return res.status(200).json({
                allowed:true,
                remaining:result.remaining,
                resetAt:result.resetAt,
                correlationId:req.correlationId
            });
        }catch(err){
            next(err);
        }
    }
}