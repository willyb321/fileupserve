describe('Upload test', function () {
	it('Can upload', function () {
		return cy.fixture('img/rss.png', 'binary')
			.then(function (img) {
				let formData = new FormData();
				return Cypress.Blob.binaryStringToBlob(img, 'image/png').then(data => {
					formData.append('imageData', data, 'rss.png');
					return Cypress.$.ajax({
						method: 'POST',
						contentType: false,
						processData: false,
						url: '/upload', // baseUrl will be prepended to this url
						username: 'uploader',
						password: 'test',
						xhrFields: {
							withCredentials: true
						},
						data: formData
					})
						.then(data => {
							expect(data).to.have.property('url');
							cy.request(data.url)
								.then(function (response) {
									expect(response.status).to.eq(200);
									expect(response).to.have.property('headers');
									expect(response.headers).to.have.property('x-robots-tag', 'noindex');
									expect(response.headers).to.have.property('x-response-time');
								})
						})
				})
			})
	});
	it('Can see images on the index page', function () {
		return cy.visit('/')
			.then(function () {
				return cy.get('.img:first')
					.should('be.visible')
					.should('have.class', 'img');
			})

	});
	it('Can load an image that was uploaded', function () {
		cy.visit('/')
			.then(function () {
				cy.request(Cypress.$('.img:first').parent().attr('href'))
					.then(function (response) {
						expect(response.status).to.eq(200);
						expect(response).to.have.property('headers');
						expect(response.headers).to.have.property('x-robots-tag', 'noindex');
						expect(response.headers).to.have.property('x-response-time');
					})
			})
	})
	it('Can delete images', function () {
		cy.visit('/')
			.then(function () {
				cy.request('POST', `${Cypress.$('.img:first').parent().attr('href')}?delete=true`)
					.then(function (response) {
						expect(response.status).to.eq(200);
						expect(response.body).to.have.property('deleted');
						expect(response).to.have.property('headers');
						expect(response.headers).to.have.property('x-robots-tag', 'noindex');
						expect(response.headers).to.have.property('x-response-time');
					})
			})
	})
})
