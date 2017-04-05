/*
 * Copyright (c) Microsoft All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

var request = require('request');
var Q = require('q');

var translate = {};   
 
 translate.getAccessToken = function(subKey) {
    var deferred = Q.defer();
    request.post(
    	'https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-Key=fd15b3ee3234461da335bb48b49f1020',
    	{
    		form : {
				'Content-Type':'application/json',
				'Accept':'application/jwt'
    		}
    	},
    	function (err, response, body) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(body);
			}
    	}
    );
    return deferred.promise;
};

translate.text = function(accessToken, langFrom, langTo, text){
    var deferred = Q.defer();
	request.get({
      url: "https://api.microsofttranslator.com/v2/http.svc/Translate?from="+ langFrom +"&to="+ langTo +"&text="+text,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }, function (err, response, body) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(body);
			}
        }
    );
    return deferred.promise;
}

module.exports = translate;
