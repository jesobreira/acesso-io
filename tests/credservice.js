
const acessoio = require('../index.js');

// Creates an instance
const acesso = acessoio({
	api_key: '',
	url: ''
});

// Get access token - set your username and password here
acesso.user.authToken('username', 'password', function(error, auth_token) {
	if(!error) {
		
		// Create a new process
		acesso.process.create(1, {
			Code: '', // CPF
			Name: '',
			Gender: '' // M for Male, F for Female
		}, function(error, process_id) {

			if(!error) {

				// Upload a face
				acesso.process.faceInsert('http://placehold.it/300x400', function(error) {

					if(!error) {

						// Upload a document

						acesso.process.documentinsert(2, 'http://placehold.it/640x400', function(error) {

							if(!error) {

								// Executes the process
								acesso.process.execute();

								// Every 10 seconds, check process status
								setInterval(function() {
									acesso.process.get(function(error, info) {

										if(!error) {

											console.log(info.Status);

										}

									})
								}, 10);

							}

						})

					}

				})

			}

		})

	} else {
		console.log(error);
	}
});