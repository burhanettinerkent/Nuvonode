# Nuvonode UI/UX direction

## Goal

Nuvonode must feel simple on first contact.
A person with no technical background should open the site and quickly understand:
- what Nuvonode does
- what they can do here
- what to click first

The product should not feel like internal tooling, crypto software, or GPU hobbyist software.
It should feel calm, modern, direct, and easy to act on.

## Core product story

Nuvonode has two simple user jobs:
1. Use open AI models through one API.
2. Run a node and earn credits that can be spent on model usage.

This story must be visible in the landing page, onboarding, dashboard home, API area, and node area.

## First impression rules

Within 5 seconds, a new visitor should understand:
1. This is a place to use open AI models.
2. They can get started with one API key.
3. They can also run a node later if they want.

If the page leads with technical architecture, role selection, dashboards, tables, IDs, or warnings before the product value is clear, the page is wrong.

## Design principles

### 1. One obvious next step
Every screen must have one visually dominant action.

Examples:
- Landing: Get API Key
- Register: Create account
- First dashboard: Copy API request
- Empty nodes page: Create Node
- Balance page: View recent activity

### 2. Explain outcomes, not internals
Lead with what the user gets.
Do not lead with how the system is built.

Good:
- Call open models with one API
- Track your usage
- Run a node and earn credits

Bad:
- Inspect provider advertisements
- Manage wallet ledger
- Review control-plane state

### 3. Simple language everywhere
Use product language, not backend language.

Prefer:
- Node
- Balance
- Activity
- App
- Key
- Request
- Model

Avoid in user-facing UI unless absolutely necessary:
- Provider
- Wallet
- Ledger
- Public ID
- Moderation queue
- Trust level
- Advertisement
- Runtime mapping
- Control plane

### 4. Every empty page must guide
No dead ends.
Every empty state must include:
- what is missing
- why it matters
- what to do next
- one action button when possible

### 5. Calm visual style
The product should feel serious and modern.
Not loud.
Not toy-like.
Not overly glassy.
Not overloaded with gradients.

## Page direction

## Landing page

### Purpose
Help a first-time visitor understand the product and choose a path.

### Must show
- one-line product promise
- short supporting explanation
- primary action: Get API Key
- secondary action: Run a Node
- one simple proof block such as a curl example or short feature strip

### Must not do
- no persona maze
- no long technical explanation
- no dense card grid above the fold
- no warning wall before the value proposition

## Register and login

### Purpose
Get the user into the product quickly.

### Rules
- only ask for required information
- keep form length short
- show clear submit buttons
- avoid side content that distracts from completion

## First logged-in experience

### Purpose
Get the user to first success fast.

### Must show
- API key or immediate path to create it
- copyable example request
- one selected model example
- secondary link to node setup

A user should be able to copy, paste, and make a first request without exploring the rest of the app.

## Dashboard home

### Purpose
Act as guided onboarding plus current status.

### Must show
- what is ready
- what is missing
- the next recommended action
- recent activity summary
- balance summary

It should feel like a helpful starting page, not a dense admin console.

## API area

### Purpose
Let the user create a key and make a request with minimal friction.

### Must show
- key management
- copyable request example
- model list with plain descriptions
- the minimum settings needed to start

The user should not need to jump across multiple disconnected pages to do their first API call.

## Usage area

### Purpose
Help the user understand what happened.

### Prioritize
- date
- model
- app/project
- status
- cost

### De-emphasize or hide
- raw internal IDs
- backend implementation details
- columns that do not help a user make a decision

## Balance area

### Purpose
Show spendable balance and recent movement clearly.

### Must show
- spendable balance first
- recent activity second
- clear explanation that earned credits can be spent on usage

### Must avoid
- accounting-heavy wording
- confusing reserve fields in the main interface
- implementation vocabulary

## Node area

### Purpose
Turn node setup into a simple path.

### Must behave like a checklist
1. Create node
2. Copy node key once
3. Run command
4. See connection status
5. Understand whether approval is pending
6. See earnings added to balance

### Rules
- say Node, not Provider
- say Node key, not Provider token
- prefer one-command setup examples
- hide advanced options by default

## Admin area

### Purpose
Help admins review and act quickly.

### Rules
- separate from normal user navigation
- prioritize queues, statuses, and actions
- lead with human identifiers such as email and names
- show technical identifiers only where support work truly needs them

## Mobile rules

Mobile support is required.

### Rules
- primary action stays visible early
- wide tables must collapse or simplify
- no default horizontal scrolling for main workflows
- tap targets must be comfortable
- text must remain readable without zoom
- navigation must stay obvious on small screens

## Copy rules

### Good copy traits
- short
- direct
- friendly
- action-oriented
- non-technical

### Good examples
- Create your first key
- Copy this command
- Your node is offline
- Start a node to earn credits
- Spend earned credits on model usage

### Bad examples
- Configure provider runtime advertisement
- Review wallet ledger movement
- Inspect moderation metadata
- Manage control-plane entities

## Visual system direction

### Desired feel
- dark
- clean
- high contrast
- spacious
- restrained accent color
- serious but not cold

### Avoid
- heavy glassmorphism
- neon overload
- too many borders and badges
- decorative effects that reduce clarity

## State rules

Every important screen must cover:
- loading
- empty
- error
- success or settled state

The state message must help the user continue.
Not just report the condition.

## Acceptance checklist

The interface is correct only if these are true:
- a non-technical person can understand the product quickly
- each screen has one clear next step
- the site explains what Nuvonode does without jargon
- the first API call path is obvious
- the node path is understandable without docs
- empty states guide the user forward
- balance and activity are easy to read
- mobile users can complete core flows comfortably
- visual style supports clarity first

## Local Claude design skills to use

Project-local skills added for future UI work:
- `.claude/skills/frontend-design/SKILL.md`
- `.claude/skills/frontend-design-direction/SKILL.md`
- `.claude/skills/dashboard-builder/SKILL.md`
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/frontend-patterns/SKILL.md`
- `.claude/skills/motion-ui/SKILL.md`

Use this document as the product truth for UI simplification and user-facing design decisions.