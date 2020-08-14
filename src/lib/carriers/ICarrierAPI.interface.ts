import {Response} from 'express';

type TResType = Response | any;

interface ICarrierAPI {
   auth(): TResType;
   products(): TResType;
   label(): TResType;

}

export default ICarrierAPI;
