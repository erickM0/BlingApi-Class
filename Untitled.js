/**
 * BlingApi Class
 * 
 * This class provides methods to interact with the Bling API, including authentication, token refresh, and CRUD operations.
 */
class BlingApi{
    /**
   * Constructor to initialize API credentials and user data.
   * @param {Object} appData - Stores application-level credentials(ScriptProperties).
   * @param {Object} userData - Stores user authentication tokens(userProperties).
   */
  constructor (appData,userData){
    this.UrlRoot = 'https://www.bling.com.br/Api/v3/';
    this.AppData = appData;
    this.UserData = userData;

    if(!this.UserData.getProperty('token')){
      this.UserData.setProperty('token','');
    }
    if(!this.UserData.getProperty('tokenRefresh')){
      this.UserData.setProperty('tokenRefresh','');
    }
    if(!this.UserData.getProperty('tokenExpires')){
      this.UserData.setProperty('tokenExpires','');
    }

    if(!this.AppData?.getProperty('BlingID')){
      this.AppData.setProperty('BlingID','');
    }

    if(!this.AppData?.getProperty('BlingSecret')){
      this.AppData.setProperty('BlingSecret','');
    }


    this.apiGet = function(endPoint,paramObj = null){
      let headers = {
        Accept: "application/json",
        Authorization: `Bearer ${this.UserData.getProperty('token')}`,
      };
    
      let options ={
        method: 'GET',
        headers: headers,
        muteHttpExceptions: true,
      }

      let params = "";
      if(paramObj != null){
          params = Object.keys(paramObj).map(k=>{
              return k + "=" + paramObj[k];
          }).join('&');
          params = '?'+ params;
      }
      let fullURL = this.UrlRoot + endPoint + params;
      
      let responseOk =false;
      try{
        while(!responseOk){
          var response = UrlFetchApp.fetch(encodeURI(fullURL),options).getContentText();
          responseOk = response.indexOf('<!DOCTYPE html>')==-1
          Utilities.sleep(200);
        }
      }catch(err){
        return {success: false, message: "Error", data: err};
      }
      let responseData = JSON.parse(response);

      if(responseData.error){
        return{success: false, message: responseData.error, data: {fullURL, options, responseData}}
      }
      return {success: true, message:'ok', data: responseData}; 
    }

    this.apiPost = function(endPoint, payLoad, postHeaders){
        let url = this.UrlRoot + endPoint;
        
        let response = '';
        let responseData = '';
        let options = {
            method: 'POST',
            headers: postHeaders,
            payload: payLoad,
            muteHttpExceptions:true,
        };

        try{
          response = UrlFetchApp.fetch(url,options);

          responseData = JSON.parse(response.getContentText()); 
          responseData.payload = payLoad;
          return {success: true, message:'ok', data: responseData}; 

        }catch(err){
          return {success: false, message: "Error", data:"Message:"+err};
        }
    }
    
    this.apiPut = function(endPoint, payLoad, putHeaders){
      let url = this.UrlRoot + endPoint;
        
        let response = '';
        let responseData = ';'
        let opstions = {
            method: 'PUT',
            headers: putHeaders,
            payload: payLoad,
            muteHttpExceptions:true,
        };

        try{
          response = UrlFetchApp.fetch(url,opstions);
          responseData = JSON.parse(response.getContentText()); 

          return {success: true, message:'ok', data: responseData}; 

        }catch(err){
          return {success: false, message: "Error", data: err};
        }
    }

    this.setRefreshTrigger = function(refreshToken, time){
        const triggers =  ScriptApp.getProjectTriggers();
        triggers.forEach(t=>{})
    }

    /**
   * Sets API credentials for Bling in ProprietyServices.
   * @param {string} blingID - Bling API Client ID.
   * @param {string} blingSecret - Bling API Secret Key.
   * @returns {Object} - Success message.
   */

    this.SetCredentials = function(blingID, blingSecret){
      this.AppData.setProperty('BlingID', blingID);
      this.AppData.setProperty('BlingSecret',blingSecret);
      return {success: true, message: 'credentials successfully saved!', data: ''};
    }

    this.HasCredentials = function(){
        const id = this.AppData.getProperty('BlingID');
        const secret = this.AppData.getProperty('BlingSecret');

        if(id && id != '' && secret && secret != null){
          return {success: true, message: 'Has Bling Credentials!', data: ''};
        }

        return {success: false, message:"Bling Credentials are not registered", data: ''};
    }

    /**
     * Generates authorization URL for OAuth authentication.
     * @param {string} [state=''] - Optional state parameter for OAuth.
     * @returns {Object} - Response object {success: bool, message: string, data: string}.
     */
    this.GetAuthorizationUrl= function(state=''){
        const client_id = this.AppData?.getProperty('BlingID');
        let url = `${this.UrlRoot}oauth/authorize?response_type=code&client_id=${client_id}${state!=''? '&state='+state : '' }`;

        return {sucess: true, message: 'ok', data: url};
    }

    /**
     * Fetches user credentials using an authorization code.
     * @param {string} code - OAuth authorization code.
     * @returns {Object} - Access and refresh tokens or error message.
     */
    this.GetUserCredentials= function(code){
      const credentialsBase64 = `${this.AppData.getProperty('BlingID')}:${this.AppData.getProperty('BlingSecret')}`;
      const endpoint = 'oauth/token';
      const headers = {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "1.0",
                        "Authorization": `Basic ${Utilities.base64Encode(credentialsBase64)}`,  
                      };
      const payload = {
                        "grant_type":"authorization_code",
                        "code":code,
                      };
      try{
        const responseData = this.apiPost(endpoint,payload,headers);
        const accessToken = responseData.data?.access_token;
        const tokenRefresh = responseData.data?.refresh_token;
        
        if(responseData.success && accessToken && accessToken != ''){
          this.UserData.setProperty('token',accessToken);
          this.UserData.setProperty('tokenRefresh', tokenRefresh);
          //set the trigger

          return {success: true, message: 'ok', data:''}
        }
        return {success: false, message: 'Error', data: responseData}
      }catch(err){
        
        return {success: false, message: 'Error', data: err};
      } 
    }

    /**
     * Check if user credentials exists
     *  @returns {Object} - Bool.
     */
    this.CheckUserCredentials = function(){

      const token = this.UserData.getProperty('token');
      const tokenRefresh = this.UserData.getProperty('tokenRefresh');

      if(token && tokenRefresh){

        return {success: true, message: 'User Credentials Registered', data: ""};
        
      }

       return {success: false, message: 'Error', data: "refresh_token invalid or does'nt exist!"}; 
    }

    /**
     * Updates user credentials using a refresh token.
     * @returns {Object} - New access token or error message.
     */
    this.UpdateUserCredentials = function(){

      const refresh_token = this.UserData.getProperty('tokenRefresh');
      if(!refresh_token || refresh_token== '')
      {
        return {success: false, message: 'Error', data: {message:"refresh_token invalid or does'nt exist!", data: refresh_token}}; 
      }
      const credentialsBase64 = `${this.AppData.getProperty('BlingID')}:${this.AppData.getProperty('BlingSecret')}`;
      const endpoint = 'oauth/token';
      const headers = {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "1.0",
                        "Authorization": `Basic ${Utilities.base64Encode(credentialsBase64)}`,  
                      };
      const payload = {
                        "grant_type":"refresh_token",
                        "refresh_token": refresh_token,
                      };

      try{
        const responseData = this.apiPost(endpoint,payload,headers);
        const accessToken = responseData.data?.access_token;
        const tokenRefresh = responseData.data?.refresh_token;
        
        if(responseData.success && accessToken){
          this.UserData.setProperty('token',accessToken);
          this.UserData.setProperty('tokenRefresh', tokenRefresh);
          //set the trigger

          return {success: true, message: 'ok', data:''}
        }
        return {success: false, message: 'Error', data: responseData.data}
      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

    /**
     * Fetches orders from Bling API.
     * @param {Object} [paramObj={}] - Query parameters.
     * @returns {Object} - Orders data or error message.
     */
    this.GetOrders= function(pramObj = {}){
      const endPoint = 'pedidos/vendas';
      try{
          const response = this.apiGet(endPoint,pramObj);
          return {success: true, message: 'ok', data:response.data};
      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

    /**
     * Fetches an order from Bling API by it's id.
     * @id {int} - The order id.
     * @returns {Object} - Orders data or error message.
     */
    this.GetOrder= function(id=""){
      const endPoint =  id && id != ''  ? `pedidos/vendas/${id}` : 'pedidos/vendas' ;
      try{
          const response = this.apiGet(endPoint);
          return {success: true, message: 'ok', data:response.data};
      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

    this.GetCommercialProposal= function(id=''){
       const endPoint =  id && id != ''  ? `pedidos/vendas/${id}` : 'pedidos/vendas' ;
      try{
          const response = this.apiGet(endPoint);
          return {success: true, message: 'ok', data:response.data};
      }catch(err){
        return {success: false, message: 'Error', data: err};
      }
    }

    this.GetAccountingAccounts= function(pramObj={}){
      const endPoint = 'contas-contabeis';
      try{
          const response = this.apiGet(endPoint,pramObj);
          return {success: true, message: 'ok', data:response.data};
      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

    this.GetAccountingAccounts= function(id=''){
      const endPoint =  id && id != ''  ? `contas-contabeis/${id}` : 'contas-contabeis' ;
      try{
          const response = this.apiGet(endPoint);
          return {success: true, message: 'ok', data:response.data};
      }catch(err){
        return {success: false, message: 'Error', data: err};
      }  
    }

    this.GetInvoice = function(id = ''){
      const endPoint = id && id != ''  ?  `nfe/${id}` : 'nfe' ;
      try{
          const response = this.apiGet(endPoint);
          if(!response.success){
            return {success: false, message: 'Error', data:response.message};
          }
          return {success: true, message: 'ok', data:response.data};
          
      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

    this.GetPaymentMethod = function(id =''){
      const endPoint = id && id != '' ? `formas-pagamentos/${id}` : 'formas-pagamentos';
      try{
        const response = this.apiGet(endPoint);
          if(!response.success){
            return {success: false, message: 'Error', data:response.message};
          }
          return {success: true, message: 'ok', data:response.data};

      }catch(err){
        return {success: false, message: 'Error', data: err};
      } 
    }

  }



}

