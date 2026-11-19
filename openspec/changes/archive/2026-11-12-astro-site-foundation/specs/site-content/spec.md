# Spec Delta

## Purpose

Defines what the Elevation Code Works site says and how it is organized: the pages, the service offer and its scope boundary, the case studies, and the rules for how the founder's background and past employers are described.

## ADDED Requirements

### Requirement: Page inventory
The site SHALL consist of these pages:
- Home `/`
- Services `/services`
- One page per service at `/services/<slug>`
- Work `/work`
- One case study per project at `/work/<slug>`
- About `/about`
- Contact `/contact`
- A not-found page

#### Scenario: Every page reachable
- **WHEN** a visitor starts at Home and follows only on-site links
- **THEN** they can reach every page in the inventory

### Requirement: Consistent navigation and footer
Every page SHALL show primary navigation linking to Services, Work, About and Contact, plus a link to Home through the business name. Every page SHALL show a footer with the business name, "Denver, Colorado", the brand line and a link to Contact.

#### Scenario: Current page marked
- **WHEN** a visitor is on a page that appears in the primary navigation
- **THEN** that navigation link is marked as the current page for both sighted and assistive-technology users

### Requirement: Home states the offer in plain words
The Home H1 SHALL state, without slogan or wordplay, that the business builds custom software and websites for Denver small businesses. The brand line "AI-powered, human-driven" MUST NOT be the H1.

#### Scenario: First screen of Home
- **WHEN** a visitor opens Home on a phone-sized viewport
- **THEN** the first screen shows the plain-words H1, a sentence naming the founder and their background, and a call to action that leads to Contact

### Requirement: Home leads with the work
Home SHALL present the case studies before the list of services. Each case study preview links to its full case study and shows a screenshot of the project.

#### Scenario: Reading order
- **WHEN** the Home page content is read in document order
- **THEN** the case study previews come before the service list

### Requirement: First-person voice
Copy SHALL speak as the founder in the first person singular ("I", "me", "my"). The business MUST NOT be described as "we" or "our team".

#### Scenario: Copy review
- **WHEN** the content of any page is checked for first-person plural references to the business
- **THEN** none are found, apart from quotations attributed to someone else

### Requirement: Service catalog
The Services page SHALL list exactly these services, and each SHALL have its own page:
1. Websites that get found
2. Integrations
3. Custom web apps
4. AI features
5. Care and rescue
6. Tech checkup, presented as the low-commitment starting point

#### Scenario: Service page structure
- **WHEN** any service page is opened
- **THEN** it states who the service is for, what is included, what is not included, related case studies where they exist, and a call to action leading to Contact

#### Scenario: Integrations page
- **WHEN** the Integrations page is opened
- **THEN** it names payments (Stripe, Square), online stores (Shopify) and booking or scheduling tools as the kinds of systems connected into a business's site or app

### Requirement: Scope boundary
No page SHALL offer back-office, CRM or marketing services. Back office means accounting sync, inventory, staff scheduling, internal tools and internal dashboards. Marketing means campaigns, email or SMS marketing, ads, content marketing, ongoing SEO campaigns, Google Business Profile management and loyalty programs.

#### Scenario: Websites service wording
- **WHEN** the "Websites that get found" page describes search visibility
- **THEN** it describes building sites that search engines can read (speed, structure, structured data, indexability) and states that ongoing SEO campaigns and ads are not offered

#### Scenario: Out-of-scope tool not offered
- **WHEN** any page is checked for offers to integrate accounting software or CRM or email-marketing platforms
- **THEN** none are found

### Requirement: Case studies
The Work section SHALL contain one case study for each project: "What Can I Do?", "Condies" and "Uphill Ski CO". Each SHALL state what the project is, who it serves, the founder's role, and a link to the live project. Each SHALL include at least one screenshot.

#### Scenario: Case study fields
- **WHEN** any case study page is opened
- **THEN** it shows the project name, a one-sentence description, the audience, the founder's role, a working link to the live site that opens in the same tab, and at least one screenshot with descriptive alt text

#### Scenario: Client work labeled accurately
- **WHEN** the "What Can I Do?" case study is opened
- **THEN** it states that the founder was contracted by Important, Not Important to build the initial version and launch it to production, and it does not claim features added after that engagement

### Requirement: Outcome claims carry a source
Any outcome or metric stated in a case study SHALL include where it comes from and when it was measured. Unsourced metrics MUST NOT be published.

#### Scenario: Metric without source
- **WHEN** a case study's content includes a metric with no source or date
- **THEN** the site check fails and names the case study

### Requirement: Federal agencies are not presented as clients
Federal agencies the founder worked on SHALL be described only as earlier contract engineering work, done before founding the business, and never as clients of the business. No page shows their seals or logos, or uses "clients include" or "trusted by" framing for them.

#### Scenario: Federal agency work
- **WHEN** the About page mentions work on projects for the FDA, VA or Census Bureau
- **THEN** it describes that work as earlier contract engineering on federal projects, without naming the contracting employer, and no agency seal or logo appears on any page

### Requirement: Employers are never named
The founder's employers SHALL NOT be named anywhere on the site, including metadata and structured data. That applies to the current employer and the past contracting employer. Current work is described as enterprise software engineering and AI enablement. Details that would identify an employer, such as fleet sizes, payment volumes or internal product names, MUST NOT be published.

#### Scenario: Built site scanned
- **WHEN** every built file, including metadata and structured data, is scanned for the employer names and identifying terms on the private list
- **THEN** none are found

#### Scenario: Background described
- **WHEN** the About or Home page describes the founder's current work
- **THEN** it uses general enterprise wording, for example "14 years building and modernizing enterprise and federal government software", and contains no employer-identifying figures

### Requirement: About page introduces the founder
The About page SHALL present Tejen Shrestha as Founder & CEO, based in Denver. It SHALL include a photo, a summary of the founder's engineering background, and a plain-sentence statement that AI speeds up the work while the founder stays accountable for every decision and result.

#### Scenario: About page content
- **WHEN** the About page is opened
- **THEN** it shows the founder's name, title, photo with alt text, location, background summary, the plain-sentence statement on AI and accountability, and a call to action leading to Contact

### Requirement: Pending owner input is tracked
Content that still needs the owner's input SHALL be marked in a machine-readable way. Preview builds succeed with markers present. A release check fails while any marker remains and lists each one.

#### Scenario: Release check with open items
- **WHEN** the release check runs while a case study still has a pending-input marker
- **THEN** the check fails and lists the file and the question that needs an answer

#### Scenario: Preview build with open items
- **WHEN** a preview build runs while markers remain
- **THEN** the build succeeds and no marker text is visible on any page
