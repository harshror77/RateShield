export class IClientRepository{

    async findByApiKey(apiKey){
        throw new Error(`${this.constructor.name} must implement findByApiKey(apikey)`);
    }

    async save(clientConfig){
        throw new Error(`${this.constructor.name} must implement save(clientConfig)`);
    }

    async delete(apiKey){
        throw new Error(`${this.constructor.name} must implement delete(apiKey)`);

    }

    async findAll(){
        throw new Error(`${this.constructor.name} must implement findAll()`);
    }
}