import {Response} from 'express';

type TResType = Response | any;

interface ICarrierAPI {
   auth(): TResType;
   find(): TResType;

}

export default ICarrierAPI;
