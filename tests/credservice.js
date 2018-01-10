
const acessoio = require('../index.js');

// Creates an instance
const acesso = acessoio({
	api_key: '',
	url: 'https://crediariohomolog.acesso.io/your_instance/services/v2/credservice.svc'
});

// Get access token - set your username and password here
acesso.user.authToken('', '', function(error, auth_token) {
	if(!error) {
		
		// Create a new process - set details here
		acesso.process.create(1, {
			Code: '', // CPF
			Name: '',
			Gender: '' // M for Male, F for Female
		}, function(error, process_id) {

			if(!error) {

				//Upload a face
				acesso.process.faceInsert('http://localhost:8888/foto.JPG', function(error) {

					if(!error) {

						// Upload a document

						acesso.process.documentInsert(2, 'http://localhost:8888/documento.JPG', function(error) {

							if(!error) {

								// Executes the process
								acesso.process.execute(function(error) {
									if(!error) {
										var checkProcess = function() {

											acesso.process.get(function(error, info) {

												if(!error) {

													console.log(info);

												} else {
													console.log(error);
												}

											});
										}

										// Every 10 seconds, check process status
										checkProcess();
										setInterval(checkProcess, 10);
									} else {
										console.log(error);
									}
								});

							} else {
								console.log(error);
							}

						})

					} else {
						console.log(error);
					}

				})

			} else {
				console.log(error);
			}

		})

	} else {
		console.log(error);
	}
});