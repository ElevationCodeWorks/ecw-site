# contact-form Specification

## Purpose

Defines how a visitor sends the Elevation Code Works founder a message from the Contact page: what they fill in, how the input is checked and protected from spam, how it reaches the owner, and what the visitor sees.

## Requirements

### Requirement: Contact form fields
The Contact page SHALL offer a form with these fields:
- Name (required)
- Email (required)
- Business name (optional)
- What they need (optional): one of the six services or "Not sure yet"
- Message (required, 10 to 5,000 characters)

Every field has a visible label.

#### Scenario: Form rendered
- **WHEN** a visitor opens the Contact page
- **THEN** the form shows each field with a visible, programmatically associated label, marks required fields in text, and offers the service choices from the service catalog plus "Not sure yet"

### Requirement: Works without JavaScript
The form SHALL submit through a normal page request and lead to its confirmation page, so it works for visitors whose browser does not run scripts.

#### Scenario: Submission with scripts disabled
- **WHEN** a visitor with JavaScript disabled submits a valid form
- **THEN** the submission is accepted and the visitor lands on the confirmation page

### Requirement: Input rules enforced before sending
The form SHALL declare its input rules so the browser blocks submission until they are met. The rules are: required fields filled, a well-formed email address, and a message length of 10 to 5,000 characters. Entries are kept while the visitor corrects them.

#### Scenario: Invalid email
- **WHEN** a visitor tries to submit with an email address that is not well formed
- **THEN** the form is not submitted, the email field is identified as the problem, and everything the visitor typed is still in the form

#### Scenario: Message too short
- **WHEN** a visitor tries to submit a message shorter than 10 characters
- **THEN** the form is not submitted and the message field is identified as the problem

### Requirement: Spam protection without a visitor challenge
The form SHALL screen out automated submissions without asking human visitors to solve a challenge. Submissions that fail screening MUST NOT notify the owner.

#### Scenario: Hidden field filled
- **WHEN** a submission arrives with the hidden trap field filled in
- **THEN** the submission is discarded and the owner is not notified

#### Scenario: Classified as spam
- **WHEN** the spam filter classifies a submission as spam
- **THEN** the owner is not notified, and the submission is kept apart from genuine submissions where the owner can review it

### Requirement: Delivery to the owner's inbox
Every submission that passes spam screening SHALL send an email notification to the owner's configured inbox with every field included. Replying to it addresses the visitor, and its subject identifies it as a website inquiry.

#### Scenario: Successful delivery
- **WHEN** a genuine submission is received
- **THEN** one email reaches the owner's inbox with all submitted fields, replying to it addresses the visitor's email, and the subject identifies it as an inquiry from the Elevation Code Works website

### Requirement: No message is lost
Every submission that passes spam screening SHALL be kept in the owner's form inbox, whether or not the email notification arrives. The Contact page SHALL always show the owner's email address as plain text as an alternative to the form.

#### Scenario: Notification email missing
- **WHEN** a genuine submission's notification email is not received
- **THEN** the submission is still available in the owner's form inbox

#### Scenario: Visitor prefers email
- **WHEN** a visitor opens the Contact page
- **THEN** the owner's email address is shown as plain text near the form

### Requirement: Confirmation sets expectations
After submitting, the visitor SHALL land on a confirmation page that thanks them and says the owner replies within 48 hours. The confirmation page is excluded from search and the sitemap.

#### Scenario: Confirmation shown
- **WHEN** a submission is accepted
- **THEN** the visitor sees the confirmation page saying they will get a reply within 48 hours, with a link back to Home, and the page has a `noindex` robots meta tag and is absent from the sitemap

### Requirement: Minimal data handling
Submission data SHALL be used only to respond to the visitor. It is kept only in the host's form inbox and is not shared with third parties beyond the host and its spam filter. The Contact page says this in one plain sentence.

#### Scenario: Data-use statement
- **WHEN** a visitor opens the Contact page
- **THEN** a plain sentence near the form says the message is used only to reply, is stored with the site's host, and is never shared for marketing
