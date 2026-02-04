/// <reference types="cypress" />


describe('Search from langing page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8100')
  });
  it('confirms presence of brand assets', () => {
    cy.get('.logo').should('be.visible');
    cy.get('.search-logo').should('be.visible');
    cy.get('.search-input').should('be.visible');
    cy.get('.search-button').should('be.visible');
  })
  it('performs basic search', () => {
    cy.get('.search-input').type('Australia{enter}');
  })
})

