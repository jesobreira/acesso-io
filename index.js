'use.strict';

NodeAcessoIO = function(cfg) {

	const request = require('request');
	const sharp = require('sharp');
	const fs = require('fs');

	const imageConvert = function(url_or_path, download, cb) {

		var bufferProcess = function(buffer) {
			sharp(buffer)
				.rotate() // https://stackoverflow.com/questions/35959200/when-using-node-sharp-package-to-resize-image-and-upload-to-s3-it-is-rotated#comment59637033_35959200
				.resize(500)
				.toBuffer()
				.then( data => {
					cb(false, data.toString('base64'))
				})
				.catch( err => cb);
		}

		if(download) {
			var options = {
		        uri: url_or_path,
		        encoding: "binary"
		    };

		    // Thanks to github.com/leecrossley/imageurl-base64
		    request(options, function(e, resp, body) {
		        if (e) {
		            return cb(e);
		        }

		        if (resp.statusCode !== 200) {
		            var error = new Error('response was non 200');
		            error.response = body;
		            return cb(error);
		        }

		        var img = new Buffer(body.toString(), "binary");
		        bufferProcess(img);
		    });
		} else {
			fs.readFile(url_or_path, 'utf8', function(err, data) {
				if(err) {
					cb(err);
				} else {
					bufferProcess(data);
				}
			})
		}
	}

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
					try {
						body = JSON.parse(body);
						if(body.Error) {
							cb(body.Error)
						} else {
							cfg.authToken = body.GetAuthTokenResult.AuthToken;
							cb(false, body.GetAuthTokenResult.AuthToken)
						}
					} catch(e) {
						cb(e);
					}
				})
			}
		},
		"process": {
			"create": function(type, subject, cb) {
				cfg.last_subject = subject;
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
					try {
						body = JSON.parse(body);
						if(body.Error) {
							cb(body.Error)
						} else {
							cfg.last_process_id = body.CreateProcessResult.Process.Id;
							cb(false, body.CreateProcessResult.Process.Id);
						}
					} catch(e) {
						cb(e);
					}
				});
			},

			"faceInsert": function(url, cb) {
				imageConvert(url, true, function(error, b64) {
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
							try {
								body = JSON.parse(body);
								if(body.Error) {
									cb(body.Error)
								} else {
									cb(false);
								}
							} catch(e) {
								cb(e);
							}
						});
					}
				})
			},

			"documentInsert": function(type, url, cb) {
				imageConvert(url, true, function(error, b64) {
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
							try {
								body = JSON.parse(body);
								if(body.Error) {
									cb(body.Error)
								} else {
									cb(false);
								}
							} catch(e) {
								cb(e);
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
					console.log(body);
					try {
						body = JSON.parse(body);
						if(body.Error) {
							cb(body.Error)
						} else {
							cb(false);
						}
					} catch(e) {
						cb(e);
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
					try {
						body = JSON.parse(body);
						if(body.Error) {
							cb(body.Error)
						} else {
							cb(false, body);
						}
					} catch (e) {
						cb(e);
					}
				});
			}
		},
		"subject": {
			"authenticate": function(cpf, url, cb) {
				if(!cpf) cpf = cfg.last_subject.Code;
				imageConvert(url, true, function(error, b64) {
					if(!error) {
						var options = {
							method: 'POST',
							url: cfg.url+'/subject/'+cpf+'/authenticate',
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
							try {
								body = JSON.parse(body);
								if(body.Error) {
									cb(body.Error)
								} else {
									cb(false);
								}
							} catch(e) {
								cb(e);
							}
						});
					}
				})
			}
		}
	}
}

if (typeof (exports) !== "undefined") {
    if (typeof (module) !== "undefined" && module.exports) {
        exports = module.exports = NodeAcessoIO;
    }
    exports = NodeAcessoIO;
}