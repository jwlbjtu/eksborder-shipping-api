// import {Request, Response, NextFunction } from "express";

/**
 * Development Error Handler
 *
 * If we are in a development environment, then we can handle errors and
 * display all the proper information we'll need to debug this issue.
 * @param err
 * @param req
 * @param res
 * @param next
 */
// @ts-ignore
// const errorHandlerMiddleware = (
//     err: any, req:Request, res: Response, next: NextFunction
// ) => {
//     // let newError = err;
//     // res.status(500).send(err);
//     // next();
//
//     if (res.headersSent) {
//         return next(err);
//     }
//     res.status(500).send({ error: err });
// };
//
// export default errorHandlerMiddleware;


import { NextFunction, Request, Response } from 'express';
import HttpException from '../lib/httpException.lib';

function errorHandler(error: HttpException, request: Request, response: Response, next: NextFunction) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    response
        .status(status)
        .send({
            status,
            message,
        })
}

export default errorHandler;
