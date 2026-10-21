name: Pull Request Template
description: Template for all pull requests
title: "[PR] "
labels: ["needs-review"]
body:
  - type: markdown
    attributes:
      value: |
        ## Description
        Please include a summary of the change and which issue is fixed. Include relevant motivation and context.

        Fixes # (issue number)

  - type: checkboxes
    id: checks
    attributes:
      label: Pre-submission Checklist
      options:
        - label: My code follows the style guidelines (ESLint, Prettier)
          required: true
        - label: I have performed a self-review of my code
          required: true
        - label: I have commented my code where necessary
          required: true
        - label: I have added tests that prove my fix/feature works
          required: true
        - label: New and existing unit tests pass locally
          required: true
        - label: Any dependent changes have been merged and published
          required: true

  - type: dropdown
    id: type
    attributes:
      label: Type of Change
      description: What type of change does this PR introduce?
      options:
        - Bug fix (non-breaking change which fixes an issue)
        - New feature (non-breaking change which adds functionality)
        - Breaking change (fix or feature that would cause existing functionality to not work as expected)
        - Documentation update
        - Refactoring (no functional changes)
        - Performance improvement
        - Security fix
      default: 0
    validations:
      required: true

  - type: textarea
    id: testing
    attributes:
      label: How Has This Been Tested?
      description: Please describe the tests you ran to verify your changes
      placeholder: |
        - Unit tests: `npm test`
        - Manual testing: described steps
        - Browser testing: Chrome, Firefox, Safari

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots/Videos (if applicable)
      description: Add screenshots or videos to demonstrate the changes
      placeholder: "Drag and drop images here"

  - type: textarea
    id: breaking
    attributes:
      label: Breaking Changes
      description: If this is a breaking change, describe the impact and migration path
      placeholder: "No breaking changes / This changes the API format from..."

  - type: checkboxes
    id: deploy
    attributes:
      label: Deployment Notes
      options:
        - label: This PR requires database migrations
        - label: This PR requires environment variable changes
        - label: This PR requires cache invalidation