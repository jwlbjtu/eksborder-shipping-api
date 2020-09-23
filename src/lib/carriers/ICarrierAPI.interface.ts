import {Response} from 'express';
import { IProductRequest, ILabelRequest, IManifestRequest } from '../../types/shipping.types';

type TResType = Response | any;

interface ICarrierAPI {
   products(data: IProductRequest): TResType;
   label(data: ILabelRequest): TResType;
   getLabel(): TResType;
   manifest(data: IManifestRequest): TResType;
   getManifest(id: string): TResType;

}

export default ICarrierAPI;
