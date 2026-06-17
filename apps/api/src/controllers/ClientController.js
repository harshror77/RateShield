import { ClientConfigService } from "../services/index.js";

export class ClientController{
    constructor(){
        this.service = new ClientConfigService();
    }

    async getAll(req,res,next){
        try {
            const clients = await this.service.getAll();
            return res.status(200).json({clients})
        } catch (error) {
            next(error);
        }
    }

    async getOne(req,res,next){
        try {
            const client = await this.service.getByApiKey(req.params.apiKey);
            return res.status(200).json({client});
        } catch (err) {
            next(err);
        }
    }

    async create(req,res,next){
        try {
            const client = await this.service.create(req.body);
            return res.status(201).json({client});
        } catch (err) {
            next(err);
        }
    }
    
    async update(req,res,next){
        try {
            const client = await this.service.update(req.params.apiKey, req.body);
            return res.status(200).json({client});
        } catch (err) {
            next(err);
        }
    }
    async remove(req,res,next){
        try {
            const result = await this.service.remove(req.params.apiKey);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}