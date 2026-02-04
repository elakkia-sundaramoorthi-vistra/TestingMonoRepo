/// <reference types="cypress" />
import * as testConfig from '../../../src/environments/e2eConfigs.json'
describe('Filter results', () => {
  // npx cypress run --spec "cypress/integration/1-getting-started/1-filters.spec.js"
  /* TODO: calculate these figures based on actual results  */
  let resultsOnPage = 10;
  beforeEach(() => {
    cy.visit('http://localhost:8100/#/results');
    cy.get('ion-searchbar').should('be.visible');
    cy.get('.searchbar-input').type('Australia{enter}');
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.unfiltered);
  })

  it('applies "Created By Me" filter', () => {
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.unfiltered);
    cy.get("#chkCreatedByMe button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.author.me)
  })

  it.skip('applies "Created By Others" filter', () => {
    cy.get("#chkCreatedByOthers button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "10 of " + testConfig[0].expect.author.others)
  })

  it('applies "Created in the last 6 months" filter', () => {
    cy.get("#chkCreatedLastSixMonths button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.created.lastSixMonths)
  });
  it('applies "Created in the last year" filter', () => {
    cy.get("#chkCreatedLastYear button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.created.lastYear)
  });
  it('applies "Modified in the last 6 months" filter', () => {
    cy.get("#chkModifiedLastSixMonths button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.modified.lastSixMonths)
  });
  it('applies "Modified in the last year" filter', () => {
    cy.get("#chkModifiedLastYear button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.modified.lastYear)
  });
  it.skip('applies "VForce" filter', () => {
    cy.get("#chkDmsVForce button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.sourceDMS.vForce)
  });
  it('applies "SharePoint" DMS filter', () => {
    cy.get("#chkDmsSharepoint button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.sourceDMS.sharePoint)
  });
  it('applies "Other" DMS filter', () => {
    cy.get("#chkDmsOther button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "0 of " + testConfig[0].expect.sourceDMS.other)
  });
  it('applies "PDF" filter', () => {
    cy.get("#chkDocTypePdf button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "0 of " + testConfig[0].expect.documentType.pdf);
  });
  it('applies "Word" filter', () => {
    cy.get("#chkDocTypeWord button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "0 of " + testConfig[0].expect.documentType.word);
  });
  it('applies "PowerPoint" filter', () => {
    cy.get("#chkDocTypePowerPoint button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "0 of " + testConfig[0].expect.documentType.powerPoint);
  });
  it('applies "Excel" filter', () => {
    cy.get("#chkDocTypeExcel button").focus().click({force: true});
    cy.get("#btnApplyfilters").click({force: true});
    cy.get("#pageNumber").should("contain", "0 of " + testConfig[0].expect.documentType.excel);
  });
  it('resets filters', () => {
    cy.get("#btnResetfilters").click({force: true});
    cy.get("#pageNumber").should("contain", resultsOnPage + " of " + testConfig[0].expect.unfiltered)
  });

})
