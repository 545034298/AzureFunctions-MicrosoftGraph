var request = require('request');
var Q = require('q');
var http = require('http');

var auth = require('./auth');
var graph = require('./graph');
var translate = require('./translate');
//from visual studio
module.exports = function (context, req) {
    var client_ID = process.env.CLIENT_ID;
    var client_secret = process.env.CLIENT_SECRET;
    var token_endpoint = process.env.TOKEN_ENDPOINT;
    var translator_client_secret = process.env.TRANSLATOR_CLIENT_SECRET;
    var langFrom = 'EN';
    var langTo = 'FR';

    context.log('Microsoft Graph function processed a request. RequestUri: ', req.originalUrl);

    if (req.query.validationToken) {
        context.log('Found validation token: ', req.query.validationToken);
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: req.query.validationToken // Microsoft Graph expects you to return this to validate
        };
    }
    else if (req.body.value) {
        context.log('subscriptionId: '+ req.body.value[0].subscriptionId);
        
        // Get an access token for the app.
        auth.getAccessToken().then(function (token) {
            var resource = req.body.value[0].resource;
            var reqUrl = 'https://graph.microsoft.com/v1.0/' + resource;
            context.log('reqUrl: ' + reqUrl);
            
            request.get(reqUrl, {'auth': {'bearer': token}
            }, function (err, response, msg) {
                var msgJson = JSON.parse(msg);

                //translation service on bodyHtml https://www.microsoft.com/en-us/translator/getstarted.aspx
                var bodyHtml = msgJson.body.content;
                var subject = msgJson.subject;
                context.log('subject: '+ subject);
                
                translate.getAccessToken(translator_client_secret)
                .then(function (accessToken) {
                    translate.text(accessToken, langFrom, langTo, subject)
                    .then(function (translatedSubject) {
                        context.log('translated: ' + translatedSubject);
                        //update email body based on translation https://msdn.microsoft.com/office/office365/APi/mail-rest-operations#Updatemessages
                        var jsonMsg = { "subject": translatedSubject.split(/Serialization\/\"\>/)[1].split('<')[0]  };  
                        
                        request.patch({
                          url: reqUrl,
                          headers: {
                            'Content-Type': 'application/json',
                            'authorization': 'Bearer ' + token
                          },
                          body: JSON.stringify(jsonMsg)
                        }, function (err, response, msg) {
                            var parsedMsg = JSON.parse(msg);
                            if (err) {
                              context.log('>>> Error getting updating: ' + err);
                            } else if (parsedMsg.error) {
                              context.log('>>> Error getting updating: ' + parsedMsg.error.message);
                            } else {
                                context.res = {
                                    status: 200,
                                    body: "Worked a treat!"
                                };
                            }
                        });
                    }, function (error) {
                        context.log('>>> Error getting translating: ' + error);
                    });
                }, function (error) {
                  context.log('>>> Error getting accessToken: ' + error);
                });
            });
        }, function (error) {
            context.log('>>> Error getting access token: ' + error);
        });
    }
    else {
        context.log('ERROR');
        context.res = {
            status: 400,
            body: "This didnt go as planned!"
        };
    }
    context.done();
}
