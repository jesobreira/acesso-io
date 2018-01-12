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
			fs.readFile(url_or_path, function(err, data) {
				if(err) {
					cb(err);
				} else {
					bufferProcess(data);
				}
			})
		}
	}

	return {
		"processEnum": { "waiting_for_documents": 0, "capturing_documents": 1, "proccessed_with_conflict": 2, "proccessed_without_conflict": 3, "cancelled": 4 },
    	"documentTypeEnum": {
	        "foto_do_cliente": 1, "foto_do_cliente_divergencia": 100, "rg": 2, "cpf": 3, "cnh": 4, "comprovante_renda": 5, "comprovante_endereco": 6, "imposto_renda": 7, "certidao_casamento": 8, "certidao_obito": 9, "certidao_pagamento_debitos": 10,
	        "identificacao_internacional": 11, "passaporte": 12, "cartao_cnpj": 13, "contrato_social": 14, "documentos_socios": 15, "declaracao_faturamento": 16, "ordem_compra": 17, "procuracoes": 18, "digital_do_cliente": 19, "carteira_de_trabalho": 20,
	        "pac": 21, "ctps": 22, "comprovante_renda_complementar": 23, "identidade_classe": 24, "certidao_nascimento": 25, "extrato_inss": 26, "carte_iptu": 27, "decore": 28, "foto_cliente_liveness": 50, "foto_cliente_liveness_ir": 51, "formulario_aumento_limite": 101,
	        "formulario_solicitacao_adicional": 102, "fatura_cartao": 103, "extrato_bancario": 105, "extrato_beneficio": 106, "tad": 107, "formulario_alteracao_endereco": 108, "formulario_alteracao_vencimento": 109, "formulario_extorno_inclusao_transacao": 110,
	        "documentos_alteracao_limite": 11, "assinatura_digital": 112, "outros": 999, "outros1": 998, "outros2": 997, "outros3": 996, "outros4": 995, "outros5": 994
	    },
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

			"faceInsert": function(url, cb, download) {
				if(typeof download == 'undefined') download = true;
				imageConvert(url, download, function(error, b64) {
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
					} else cb(error);
				})
			},

			"documentInsert": function(type, url, cb, download) {
				if(typeof download=='undefined') download = true;
				imageConvert(url, download, function(error, b64) {
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
					} else {
						cb(error);
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

			"get": function(process_id, cb) {
				if(!process_id) process_id = cfg.last_process_id;
				var options = {
					method: 'GET',
					url: cfg.url+'/process/'+process_id+'',
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
							cb(false, body.GetProcessResult);
						}
					} catch (e) {
						cb(e);
					}
				});
			}
		},
		"subject": {
			"authenticate": function(cpf, url, cb, download) {
				if(!cpf) cpf = cfg.last_subject.Code;
				if(typeof download == 'undefined') download = true;
				imageConvert(url, download, function(error, b64) {
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