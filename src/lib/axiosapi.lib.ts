import axios from "axios";

/**
 * class AxiosapiLib
 */
class AxiosapiLib {
    private httpBodyMethods = ['get', 'post'];

    /**
     *
     * @param method
     * @param url
     * @param data
     * @param headers
     */
    public doCall: any = async (method: string, url: string, data?: Object, headers?: Object) => {
        let config: Object = await this.buildConfig(method, url, headers);

        if (this.httpBodyMethods.includes(method.toLowerCase()) && typeof data !== 'undefined') {
            // @ts-ignore
            config['data'] = data;
            if (typeof data !== 'string' && (Array.isArray(data) || typeof data === 'object')) {
                // @ts-ignore
                config['data'] = JSON.stringify(data);
            }

        }

        return await this.doAxiosRequest(config);
    };

    /**
     *
     * @param config
     */
    private doAxiosRequest: any = async (config: Object) => {
        const c = config;
        return await axios(config)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
                return response.data;
            })
            .catch(function (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                    return error.response;
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                    return error.request;
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                    return error.message;
                }
                console.log(error.config);
            });
    };

    /**
     *
     * @param method
     * @param url
     * @param headers
     */
    private buildConfig: any = async (method: string, url: string, headers?: Object) => {

        if (typeof headers == 'undefined') {
            headers = {};
        }

        if (!headers.hasOwnProperty('Content-Type')) {
            // @ts-ignore
            headers['Content-Type'] = 'application/json';
        }

        return {
            method: method,
            url: url,
            headers: headers
        };
    }

}


export default new AxiosapiLib();

