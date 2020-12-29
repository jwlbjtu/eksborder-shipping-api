import { Response } from 'express';

type TCrudType = Response | any;

interface ICRUDControllerBase {
  initRoutes(): TCrudType;
  createPost(): TCrudType;
  readGet(): TCrudType;
  updatePut(): TCrudType;
  delDelete?(): TCrudType;
  readOneGet?(): TCrudType;
}

export default ICRUDControllerBase;
