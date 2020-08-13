import ICarrierAPI from "../ICarrierAPI.interface";
import AxiosapiLib from "../../axiosapi.lib";
import qs from "qs";
import conf from "./config";


// let cf = new CarrierFactory('dhl');
// // @ts-ignore
// let cf_a = await cf.auth();
class DhlApi implements ICarrierAPI {
    private _props: object = {};
    private _credential: object | any = {
        client_id: conf.client_id,
        client_secret: conf.client_secret
    };
    private api_url: string = 'https://api-sandbox.dhlecs.com';
    private accesstoken: string = '';

    /**
     * @param props
     */
    constructor(props?: object) {
        if (typeof props !== 'undefined' && typeof props == 'object') {
            this._props = props;
        }
    }

    /**
     * auth user
     */
    public auth: any = async () => {
        const data = qs.stringify({
            'grant_type': 'client_credentials'
        });
        const headers = await this.getHeaders(true);

        return await AxiosapiLib.doCall('post', this.api_url + '/auth/v4/accesstoken', data, headers)
            .then((response: Response | any) => {
                this.accesstoken = response.access_token;
                return response;
            })
            .catch((err: Error) => {
                console.log(err);
                return err;
            });
    };

    /**
     * find product
     * @param data
     */
    public find: any = async (data: object = {}) => {

        const headers = await this.getHeaders(false);
        // const headers = {
        //     'Content-Type': 'application/json',
        //     'Authorization': 'Bearer ' + this.accesstoken
        // };

        return await AxiosapiLib.doCall('post', this.api_url + '/shipping/v4/products', data, headers)
            .then((response: Response | any) => {
                return response;
            })
            .catch((err: Error) => {
                console.log(err);
                return err;
            });
    };

    private getHeaders: any = async (isAuth: boolean = false) => {
        let headers = {};

        if (isAuth) {
            const token = Buffer.from(this._credential.client_id + ':' + this._credential.client_secret, 'utf8').toString('base64');
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + token
            };
        } else {
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accesstoken
            }
        }

        return headers;
    };
}

export default DhlApi;
