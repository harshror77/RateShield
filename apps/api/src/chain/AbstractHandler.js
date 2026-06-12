export class AbstractHandler{
    constructor(){
        this.next = null;
    }

    setNext(handler){
        this.next = handler;
        return handler;
    }

    async handle(request){
        if(this.next) return this.next.handle(request);
        return {success:true};
    }

}