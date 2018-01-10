'use.strict';

module.exports = function(cfg) {

	const request = require('request');
	const image2base64 = require("imageurl-base64");

	return {
		"user": {
			"authToken": function(login, password, cb) {
				var options = {
					method: 'GET',
					url: cfg.url+'/user/authToken',
					headers:{
						'X-AcessoBio-APIKEY': cfg.api_key,
						'X-Login': login,
						'X-Password': password
					}
				};
				request(options, function(error, response, body) {
					body = JSON.parse(body);
					if(body.GetAuthTokenResult.error) {
						cb(body.GetAuthTokenResult.error)
					} else {
						cfg.authToken = body.GetAuthTokenResult.AuthToken;
						cb(false, body.GetAuthTokenResult.AuthToken)
					}
				})
			}
		},
		"process": {
			"create": function(type, subject, cb) {
				var options = {
					method: 'POST',
					url: cfg.url+'/process/create/'+type,
					headers:{
						'X-AcessoBio-APIKEY': cfg.api_key,
						'Authentication': cfg.authToken,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						subject: subject
					})
				};
				request(options, function(error, response, body) {
					body = JSON.parse(body);
					if(body.Error) {
						cb(body.Error)
					} else {
						cfg.last_process_id = body.Process.Id;
						cb(false, body.Process.Id);
					}
				});
			},

			"faceInsert": function(url, cb) {
				image2base64(url, function(error, b64) {
					if(!error) {
						var options = {
							method: 'POST',
							url: cfg.url+'/process/'+cfg.last_process_id+'/faceInsert',
							headers:{
								'X-AcessoBio-APIKEY': cfg.api_key,
								'Authentication': cfg.authToken,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								imagebase64: b64
							})
						};
						request(options, function(error, response, body) {
							body = JSON.parse(body);
							if(body.Error) {
								cb(body.Error)
							} else {
								cb(false);
							}
						});
					}
				})
			},

			"documentInsert": function(type, url, cb) {
				image2base64(url, function(error, b64) {
					if(!error) {
						var options = {
							method: 'POST',
							url: cfg.url+'/process/'+cfg.last_process_id+'/documentInsert/'+type,
							headers:{
								'X-AcessoBio-APIKEY': cfg.api_key,
								'Authentication': cfg.authToken,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								imagebase64: b64
							})
						};
						request(options, function(error, response, body) {
							body = JSON.parse(body);
							if(body.Error) {
								cb(body.Error)
							} else {
								cb(false);
							}
						});
					}
				})
			},

			"execute": function(cb) {
				var options = {
					method: 'GET',
					url: cfg.url+'/process/'+cfg.last_process_id+'/execute',
					headers:{
						'X-AcessoBio-APIKEY': cfg.api_key,
						'Authentication': cfg.authToken
					}
				};
				request(options, function(error, response, body) {
					body = JSON.parse(body);
					if(body.Error) {
						cb(body.Error)
					} else {
						cb(false);
					}
				});
			},

			"get": function(cb) {
				var options = {
					method: 'GET',
					url: cfg.url+'/process/'+cfg.last_process_id+'',
					headers:{
						'X-AcessoBio-APIKEY': cfg.api_key,
						'Authentication': cfg.authToken
					}
				};
				request(options, function(error, response, body) {
					body = JSON.parse(body);
					if(body.Error) {
						cb(body.Error)
					} else {
						cb(false, body.Process);
					}
				});
			}
		}
	}
}