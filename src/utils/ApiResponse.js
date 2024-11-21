class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        if (statusCode < 100 || statusCode > 599) {
            throw new Error('Invalid HTTP status code');
        }
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}