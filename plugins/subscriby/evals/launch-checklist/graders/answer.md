---
type: llm
---

PASS if the reply reports, from the tool results, that the Stripe payment method is not active yet (its onboarding is pending), that the Pro plan is still a draft that has not been published, and that the portal design has an unpublished draft, and presents these as the steps left (finish connecting or activate the payment method, publish the plan, publish the portal). It may also say that the Studio Lab Channel is linked and healthy and that the Telegram bot is connected.
FAIL if it claims the project is ready to sell, lists generic steps without reading the project's state, or invents a problem the results do not show (for example that no place is linked or the bot is disconnected).
