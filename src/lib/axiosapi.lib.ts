import axios from 'axios';

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
  public doCall: any = async (
    method: string,
    url: string,
    data?: any,
    headers?: any
  ) => {
    const config: any = await this.buildConfig(method, url, headers);

    if (
      this.httpBodyMethods.includes(method.toLowerCase()) &&
      typeof data !== 'undefined'
    ) {
      config['data'] = data;
      if (
        typeof data !== 'string' &&
        (Array.isArray(data) || typeof data === 'object')
      ) {
        config['data'] = JSON.stringify(data);
      }
    }

    return await this.doAxiosRequest(config);
  };

  /**
   *
   * @param config
   */
  private doAxiosRequest: any = async (config: any) => {
    const c = config;
    try {
      const response = await axios(config);
      console.log(JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      if ((error as any).response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log((error as any).response.data);
        console.log((error as any).response.status);
        console.log((error as any).response.headers);
        return (error as any).response;
      } else if ((error as any).request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log((error as any).request);
        return (error as any).request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', (error as any).message);
        return (error as any).message;
      }
    }
  };

  /**
   *
   * @param method
   * @param url
   * @param headers
   */
  private buildConfig: any = async (
    method: string,
    url: string,
    headers?: any
  ) => {
    if (typeof headers == 'undefined') {
      headers = {};
    }

    if (!headers.hasOwnProperty('Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }

    return {
      method: method,
      url: url,
      headers: headers
    };
  };
}

export default new AxiosapiLib();
