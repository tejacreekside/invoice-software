# Copilot instructions

Always follow this workflow for non-trivial coding tasks:
1. Analysis
2. Plan
3. Implementation
4. Code Review
5. QA Tests
6. Final Code
7. Summary

Coding rules:
- Keep diffs minimal
- Preserve backward compatibility
- Reuse existing utilities and patterns
- Ensure null safety
- Avoid unnecessary abstractions
- Optimize for readability and performance
- Put invoice business rules in invoiceRules
- Put totals logic in invoiceCalculator
- Include tests and edge cases