/*
 * Copyright (c) Microsoft All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

var request = require('request');
var Q = require('q');

var translate = {};   
 
 translate.getAccessToken = function(client_secret) {
    var deferred = Q.defer();
    request.post(
    	'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13',
    	{
    		form : {
    			grant_type : 'client_credentials',
    			client_id : "AzureFunctionTranslator",
    			client_secret : client_secret,
    			scope : 'http://api.microsofttranslator.com'
    		}
    	},
    	function (error, response, data) {
    		if (!error && response.statusCode == 200) {
    			var accessToken = JSON.parse(data).access_token;
                deferred.resolve(accessToken);  
    		}
    		else
    		{
    		    deferred.reject(error);
    		}
    	}
    );
    return deferred.promise;
};

translate.text = function(accessToken, langFrom, langTo, text){
    var deferred = Q.defer();
	request.get({
      url: "http://api.microsofttranslator.com/v2/Ajax.svc/Translate?from="+ langFrom +"&to="+ langTo +"&text="+text,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }, function  (error, response, data) {
    		if (!error && response.statusCode == 200) {
                deferred.resolve(data);        
    		}
    		else
    		{
    		    deferred.reject(error);
    		}
        }
    );
    return deferred.promise;
}

module.exports = translate;