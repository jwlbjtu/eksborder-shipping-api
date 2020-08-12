import { Request, Response, NextFunction } from 'express'

const loggerMiddleware = (req: Request, resp: Response, next: NextFunction) => {

    console.log('Request logged:', req.method, req.path, req.body);
    next();
}

export default loggerMiddleware
