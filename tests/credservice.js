
const acessoio = require('acesso-io');

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
				acesso.process.faceInsert('http://can_be_an_external/picture.jpg', function(error) {

					if(!error) {

						// Authenticates client's face (CPF, if empty, will be the last used)
						acesso.subject.authenticate('', '', function(err, score) {

							if(!error) {
								console.log(score);

								// score is between 0 and 100, where 100 means totally similar
								// and 0 means totally different.
								// the recommended minimal is 76
								if(score >= 76) {
									console.log("that's you");
								} else {
									console.log("that's not you");
								}

								// Upload a document

								acesso.process.documentInsert(2, 'can/be/a/local/picture.jpg', function(error) {

									if(!error) {

										// Executes the process
										acesso.process.execute(function(error) {
											if(!error) {
												var checkProcess = function() {
													// if empty, process_id will be the last used
													acesso.process.get(''. function(error, info) {

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

								}, false) // false = no download, local picture.jpg
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