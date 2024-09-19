class ApiError extends Error{
    constructor(
        statusCode,
        message="Something want wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.message = message
        this.statusCode = statusCode
        this.success = false
        this.errors = this.errors
        this.data = null
        if (stack) {
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}