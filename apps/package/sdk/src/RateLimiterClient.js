import axios from 'axios';

export class RateLimiterClient{
    constructor({serviceUrl, apiKey, timeout=3000}){
        this.serviceUrl = serviceUrl;
        this.apiKey = apiKey;
        this.http = axios.create({
            baseURL:serviceUrl,
            timeout
        });
    }

    async check(request={}){
        try{
            const response = await this.http.post('/api/check', request,{
                headers:{'x-api-key':this.apiKey},
            })
            return response.data;
        }catch(err){
            if(err.response){
                return err.response.data;
            }
            throw err;
        }
    }
}