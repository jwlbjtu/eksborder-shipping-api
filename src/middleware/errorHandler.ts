import { NextFunction, Request, Response } from 'express';
import HttpException from '../lib/httpException.lib';

function errorHandler(
  error: HttpException,
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  response.status(status).send({
    status,
    message
  });
}

export default errorHandler;
