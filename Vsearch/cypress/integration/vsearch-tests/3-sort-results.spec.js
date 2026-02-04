/// <reference types="cypress" />
import * as testConfig from '../../../src/environments/e2eConfigs.json'
describe('Sort results', () => {
  // npx cypress run --spec "cypress/integration/1-getting-started/1-filters.spec.js"
  /* TODO: calculate these figures based on actual results  */
  let resultsOnPage = 10;
  beforeEach(() => {
    cy.visit('http://localhost:8100/#/results');
    cy.get('ion-searchbar').should('be.visible');
    cy.get('.searchbar-input').type('Australia{enter}');
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.unfiltered);
  })

  it('most recent first', () => {
    cy.get("#btnSortDropDown").click({force: true});
    cy.get("vistra-generic-popover ion-item ion-label").contains('Most recent first');
    //cy.get("vistra-generic-popover ion-item").click({ 'multiple': true })
    cy.get("vistra-generic-popover ion-item").each((element, index, $list) => {
      if(index == 0) {
        cy.wrap(element).should("be.visible").click({force: true}).then(() => {
          console.log("Wrapped element clicked!")
        });
        cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.unfiltered);
      }
    })
//    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.author.me)
  })
})
