# Spec Delta

## MODIFIED Requirements

### Requirement: Case studies
The Work section SHALL contain one case study for each project: "What Can I Do?", "Condies" and "Uphill Ski CO". Each SHALL state what the project is, who it serves, the founder's role, and a link to the live project. Each SHALL include at least one screenshot.

#### Scenario: Case study fields
- **WHEN** any case study page is opened
- **THEN** it shows the project name, a one-sentence description, the audience, the founder's role, a working link to the live site that opens in the same tab, and at least one screenshot with descriptive alt text

#### Scenario: Client work labeled accurately
- **WHEN** the "What Can I Do?" case study is opened
- **THEN** it states that Important, Not Important brought the founder in for frontend work on the app, and that he suggested and built backend and dev-ops improvements that made it faster and more secure, and it does not claim that he built the app's first version or launched it

## ADDED Requirements

### Requirement: Client quotes
A case study MAY include a quote from the client. A quote SHALL appear exactly as the client gave it, marked up as a quotation, and attributed to a named person and their organization, with their role when it is known. Quotes MUST NOT be edited, shortened or paraphrased.

#### Scenario: What Can I Do? quote
- **WHEN** the "What Can I Do?" case study is opened
- **THEN** it shows Conor Britain's quote word for word, inside a quotation, with the attribution "Conor Britain, Important, Not Important"

#### Scenario: Quote without attribution
- **WHEN** a case study's quote has no person's name or no organization
- **THEN** the build fails and names the case study
