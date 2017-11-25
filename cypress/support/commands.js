// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
Cypress.Commands.add('delete', (img) => {
	cy.request(Cypress.$(img).parent().attr('href') + '?delete=true')
			.then(function (response) {
				expect(response.status).to.not.eq(500);
				expect(response.body).to.have.property('deleted');
				expect(response).to.have.property('headers');
				expect(response.headers).to.have.property('x-robots-tag', 'noindex');
				expect(response.headers).to.have.property('x-response-time');
			})
});
Cypress.Commands.add('check', (fin) => {
	if (fin === false) {
		cy.reload()
		.then(function () {
			let imgs = Cypress.$('.img');
			if (imgs.length === 0) {
				fin = true;
				return fin;
			} else {
				for (const i of imgs) {
					cy.delete(i);
					cy.check(fin);
				}
			}
		})
	}
});
