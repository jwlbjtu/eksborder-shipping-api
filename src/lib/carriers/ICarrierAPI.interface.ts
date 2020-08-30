import {Response} from 'express';

type TResType = Response | any;

interface ICarrierAPI {
   products(): TResType;
   label(): TResType;
   getLabel(): TResType;
   manifest(): TResType;
   getManifest(): TResType;

}

export default ICarrierAPI;
