# Spec Delta

## MODIFIED Requirements

### Requirement: Banned marketing words
Page copy SHALL NOT use these words in any form: elevate, unlock, seamless, supercharge, effortless, game-changer, cutting-edge, empower, leverage (as a verb), synergy. The exact brand name "Elevation Code Works" and its domain "elevationcode.works" (including in the contact email address) are allowed. Quotations attributed to someone else are exempt, because they are shown exactly as given.

#### Scenario: Pun on the brand name
- **WHEN** a page contains "elevate your business"
- **THEN** the check fails on the word "elevate"

#### Scenario: Brand name allowed
- **WHEN** a page contains "Elevation Code Works"
- **THEN** the check does not flag it

#### Scenario: Banned word in a client quote
- **WHEN** a case study's attributed quotation contains "seamlessly"
- **THEN** the check does not flag it

#### Scenario: Banned word in the attribution or the site's own copy
- **WHEN** the same word appears in a quote's attribution line or anywhere outside the quotation
- **THEN** the check fails on it
