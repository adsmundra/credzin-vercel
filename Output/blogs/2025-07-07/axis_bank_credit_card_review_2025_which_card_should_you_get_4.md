It appears that you have a list of credit card reviews in Markdown format. You can use the following code to parse and extract information from this data:

```markdown
---
title: Credit Card Reviews
date: 2023-02-20T14:30:00+08:00
tags:
  - Credit Cards
  - Reviews
---

{{#each reviews}}
* {{title}} ({{year}})
  * Fee: {{fee}}
  * Reward Rate: {{reward_rate}}
  * Benefits:
    {{#each benefits}}
    * {{benefit}}
    {{/each}}
  * {{#if link}}
  * [Apply Now]({{link}}){{/if}}
* {{#if link}}
* [Read Full Review]({{link}}){{/if}}
{{/each}}
```

This code uses Handlebars templating to iterate over the list of reviews and extract information such as title, year, fee, reward rate, benefits, and links. You can customize the output format to suit your needs.

Here is an example of how you could use this data in a web application:

```javascript
const creditCardReviews = [
  {
    "title": "Standard Chartered DigiSmart Credit Card",
    "year": 2023,
    "fee": "Monthly fee structure, with reversals after 90 days",
    "reward_rate": "Up to 25% on partner merchants",
    "benefits": [
      "Discounted forex markup of 2% + GST",
      "Rent payment surcharge of 1% + GST"
    ],
    "link": "https://www.technofino.in/standard-chartered-digismart-credit-card-review"
  },
  {
    "title": "Bank Of Baroda Eterna Credit Card",
    "year": 2023,
    "fee": "No annual fee, with a one-time fee reversal after 90 days",
    "reward_rate": "4.75% cashback on spending over ₹5L",
    "benefits": [
      "Discounted forex markup of 2% + GST",
      "5000 reward points capping on accelerated category"
    ],
    "link": "https://www.technofino.in/bank-of-baroda-eterna-credit-card-review"
  },
  // Add more reviews here...
];

const output = creditCardReviews.map((review) => {
  return `
* ${review.title} (${review.year})
  * Fee: ${review.fee}
  * Reward Rate: ${review.reward_rate}
  * Benefits:
    ${review.benefits.map((benefit) => `* ${benefit}`).join("\n")}
  * [Apply Now](${review.link || ""})
`;
}).join("\n");

console.log(output);
```

This code uses the `map` function to iterate over the list of reviews and generate a formatted string for each review. The resulting output can be displayed on a web page or used in other applications.