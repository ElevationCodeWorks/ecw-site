# Spec Delta

## ADDED Requirements

### Requirement: Home closes with the next step
After the list of services, Home SHALL end with a closing section: a heading, a short paragraph that says how to get in touch and what happens after, and the call to action that links to Contact. The paragraph SHALL NOT promise anything the rest of the site does not.

#### Scenario: End of Home
- **WHEN** the Home page content is read in document order
- **THEN** the closing section comes after the services and before the footer, and its call to action links to the Contact page

#### Scenario: Reply time
- **WHEN** the closing paragraph states a reply time
- **THEN** it matches the reply time promised on the contact confirmation page

### Requirement: Copy uses typographic apostrophes
Visible page copy SHALL use typographic apostrophes and quotation marks, whether it is written in front matter, in a Markdown body or in a page template.

#### Scenario: Front matter beside body copy
- **WHEN** a page shows a headline or lede from front matter above body copy from Markdown
- **THEN** the apostrophes in both are the same typographic character
