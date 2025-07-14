---
title: Definitions
toc_min_heading_level: 2
toc_max_heading_level: 2
---

Some definitions for product development.

## Cost of Delay

Cost of delay refers to the negative impact on a business that results from postponing the release or completion of a product, feature, or project. It encompasses several dimensions:

**Revenue Loss**: The potential income that the company misses out on while the product is delayed. This can be especially significant if the product was intended to capitalize on a specific market opportunity or seasonal demand.

[**Opportunity Costs**](#opportunity-cost): The value of other potential opportunities that are lost because resources are tied up with the delayed project. This could include the chance to work on more profitable projects or to enter new markets.

**Competitive Disadvantage**: Delays can allow competitors to release similar products first, potentially capturing market share and reducing the impact of your offering when it eventually launches.

**Increased Costs**: Delays can lead to additional costs such as extended development time, additional labor, and higher expenses for maintaining project momentum or adapting to changing market conditions.

**Reputation Impact**: Persistent delays can harm the company's reputation with customers, investors, and partners, potentially affecting future business opportunities and relationships.

In essence, the cost of delay quantifies the broader impact of project delays on a company’s financial performance, market position, and strategic goals.

### Example

Imagine a technology company is developing a new software product with two potential features to add:

- **Feature A**: A complex new functionality that customers are excited about, but which will take 4 weeks to develop.
- **Feature B**: A simpler but still valuable functionality that can be completed in 2 weeks.

#### Data

- **Expected daily revenue increase with Feature A (after launch)**: $10,000.
- **Expected daily revenue increase with Feature B (after launch)**: $6,000.
- **Cost of delay**:
  - Feature A: \$10,000/day × 28 days (development time) = \$280,000.
  - Feature B: \$6,000/day × 14 days (development time) = \$84,000.

#### Analysis

1. **Feature A**:

   - Time to complete: 28 days.
   - Additional revenue per day: \$10,000.
   - Total cost of delay: \$280,000.

1. **Feature B**:

   - Time to complete: 14 days.
   - Additional revenue per day: \$6,000.
   - Total cost of delay: \$84,000.

#### Decision

- **Feature A** has a higher potential revenue impact but also comes with a higher cost of delay. If the company chooses Feature A, the delay costs them $280,000, and it will take longer to start earning additional revenue.
- **Feature B** has a lower cost of delay and can start generating additional revenue sooner, costing only $84,000 in delay.

#### Conclusion

If the company prioritizes immediate revenue and lower risk, **Feature B** might be the better choice despite the lower potential revenue. However, if the company can afford the delay and is focused on maximizing long-term revenue, **Feature A** might be more beneficial despite its higher cost of delay.

## Cycle Time

Cycle time is the amount of time it takes to complete one cycle of a process from start to finish. In the context of software development or manufacturing, cycle time refers to the time it takes to produce a single unit or complete a single task, from the moment work begins until the task is finished and ready for delivery.

### Key Aspects of Cycle Time

1. **Start to Finish**: It includes the entire process, from the initiation of a task or production step to its completion.

1. **Unit of Work**: In software development, a "unit of work" could be a user story, a feature, or even a bug fix. In manufacturing, it could be a single product or part.

1. **Efficiency Indicator**: Shorter cycle times typically indicate more efficient processes, as tasks are being completed quickly. However, overly short cycle times can also indicate rushed or low-quality work.

1. **Continuous Improvement**: Understanding and optimizing cycle time is key for improving processes, reducing waste, and increasing throughput.

### Example in Software Development

If a development team starts working on a new feature on Monday and completes it on Friday, the cycle time for that feature would be 5 days. The goal is often to reduce cycle time without compromising quality, allowing the team to deliver features faster and respond more quickly to market needs.

In agile methodologies, cycle time is closely monitored to ensure that the team is working efficiently and can quickly adjust to changing requirements.

## Lagging Indicators

Measure outcomes after an event has occurred or an activity has been completed. They are easier to measure because they rely on historical data and provide a clear view of what has already happened, making them useful for analyzing past performance.

### Examples

- Total revenue from last month.
- Quarterly profit.
- Customer churn rate.
- Number of closed sales.

## Leading Indicators

These are metrics that precede events and can predict or influence future outcomes. They are harder to measure as they involve forecasting behaviors or future trends. They help adjust strategies before actual results are achieved.

### Examples

- Number of qualified leads (can predict future sales).
- User engagement on a website or app (can indicate retention probability).
- Customer satisfaction (can predict retention rate).
- Click-through rates in marketing campaigns (can predict future conversions).

## Net Present Value (NPV)

Net Present Value (NPV) is a financial metric used to assess the profitability of an investment or project. It calculates the difference between the present value of cash inflows and the present value of cash outflows over a period of time. A positive NPV indicates that the projected earnings (in present currency) exceed the anticipated costs, making the investment or project potentially profitable. Conversely, a negative NPV suggests that the costs outweigh the benefits. NPV is commonly used in capital budgeting to evaluate the financial viability of long-term projects.

### Formula

The formula for calculating NPV is as follows:

$$
\text{NPV} = \sum_{t=0}^{n} \frac{R_t}{(1 + r)^t} - C_0
$$

Where:

- $\text{NPV}$ = Net Present Value
- $R_t$ = Net cash inflow during the period $t$
- $r$ = Discount rate
- $t$ = Time period
- $n$ = Total number of time periods
- $C_0$ = Initial investment or cost.

### Example

Imagine a company is considering investing in a new project that requires an initial investment of $100,000. The project is expected to generate the following cash inflows over the next three years:

- Year 1: $50,000
- Year 2: $60,000
- Year 3: $70,000

The company's cost of capital (discount rate) is 10% per year.

The NPV of the project can be calculated as follows:

$$
\text{NPV} = \frac{50,000}{(1 + 0.10)^1} + \frac{60,000}{(1 + 0.10)^2} + \frac{70,000}{(1 + 0.10)^3} - 100,000 = 47,633
$$

The positive NPV of $47,633 indicates that the project is expected to generate more value than the initial investment, making it a potentially profitable venture.

## Opportunity cost

Opportunity cost is the value of the next best alternative that you give up when making a decision. It's what you sacrifice in order to pursue a particular course of action.

For example, if you decide to spend time working on Project A instead of Project B, the opportunity cost is the potential benefits you would have gained from Project B. Opportunity cost can apply to decisions involving time, money, resources, or any other limited asset.

In essence, opportunity cost helps you evaluate the trade-offs involved in making choices, ensuring that you consider the potential benefits of the alternatives you are not choosing.

To calculate opportunity cost, follow these steps:

1. Identify the Options: determine the different choices or actions you have. For example, if you have to choose between investing in Project A or Project B, these are your options.

2. Estimate the Value of Each Option: assess the potential benefits, returns, or outcomes of each option. This could be measured in revenue, profit, utility, or any other relevant metric.

3. Calculate the Opportunity Cost: subtract the value of the chosen option from the value of the next best alternative. The opportunity cost is the difference between what you gain by choosing one option and what you would have gained from the next best alternative.

### Formula

$$
\text{Opportunity Cost} = \text{Value of Next Best Alternative} - \text{Value of Chosen Option}
$$

### Examples

#### 1. Opportunity Cost of Time

Imagine you have two job offers:

- **Job A**: Pays $50,000 per year.
- **Job B**: Pays $60,000 per year.

If you choose **Job A**, the opportunity cost is \$10,000 per year (\$60,000 - \$50,000). This is the value of the higher-paying job you are giving up by choosing **Job A**.

#### 2. Product Development Opportunity Cost

A software company has a team of developers and must decide between two potential projects:

- **Project A**: Develop a new feature for an existing product that is expected to generate \$500,000 in additional annual revenue.

- **Project B**: Develop a new standalone product that is expected to generate \$400,000 in annual revenue.

However, the company only has the resources to pursue one of these projects at a time.

If the company chooses **Project A**:

- Opportunity Cost = Value of **Project B** - Value of **Project A**
- Opportunity Cost = \$400,000 - \$500,000 = -\$100,000.

If the company chooses **Project B**:

- Opportunity Cost = Value of **Project A** - Value of **Project B**
- Opportunity Cost = \$500,000 - \$400,000 = \$100,000.

##### Interpretation

If the company chooses **Project A**, the opportunity cost is - \$100,000, indicating that the company gains an additional \$100,000 compared to if they had chosen **Project B**.

If the company chooses **Project B**, the opportunity cost is \$100,000, meaning the company foregoes \$100,000 in potential revenue that could have been earned with **Project A**.

##### Decision

The opportunity cost helps the company understand that choosing **Project B** would mean sacrificing $100,000 in potential revenue compared to **Project A**. Therefore, from a purely financial perspective, **Project A** would be the more beneficial choice.

This example illustrates how opportunity cost can guide decision-making by highlighting the financial impact of forgoing one option in favor of another.

## Proxy Variable

A proxy variable is a measurable metric used to represent or estimate another variable that is difficult or impossible to measure directly. In product development, proxy variables serve as substitutes for more complex economic outcomes, allowing teams to make decisions based on observable data rather than abstract concepts.

Proxy variables are interconnected because they often represent the same underlying economic factors from different perspectives. Changes in one proxy variable typically affect others, making it crucial to understand these relationships when making product decisions.

### Common Examples in Product Development

- **Velocity** (as a proxy for team productivity)
- **Code coverage** (as a proxy for software quality)
- **User engagement metrics** (as a proxy for product value)
- **Feature completion rate** (as a proxy for project progress)
- **Defect count** (as a proxy for technical debt)

### Key Considerations

- **Avoid proxy variable tunnel vision**: Don't optimize individual proxy variables without considering their economic impact
- **Transform to economic terms**: Convert proxy variables to life-cycle profit comparisons when possible
- **Understand interconnections**: Recognize how changes in one proxy variable affect others
- **Question the proxy**: Regularly evaluate whether the proxy variable still accurately represents the underlying economic factor

The goal is to use proxy variables as tools for better economic decision-making, not as ends in themselves.

## Queue Capacity

Queue capacity refers to the maximum number of items, tasks, or jobs that a queue can hold at any given time. It represents the limit beyond which new tasks cannot be added to the queue until space is made available, either by processing or removing existing tasks. Queue capacity is an important factor in managing workflow, as it influences system efficiency, wait times, and overall throughput.

In practical terms, a queue with a large capacity can hold more tasks but may lead to longer wait times if the processing speed is slow, while a queue with a smaller capacity can reduce waiting but may cause bottlenecks if too many tasks arrive at once. Managing queue capacity helps balance load and maintain smooth flow in processes like manufacturing, computing, or service systems.

## Round-Robin Scheduling

Round-Robin Scheduling is a time-sharing method where each task is given a fixed time slice (quantum) to execute. When the time expires, the task is placed back in the queue, and the next task begins. This process repeats in a cycle until all tasks are completed. It ensures that no task monopolizes resources and that shorter tasks finish more quickly, even when the duration of each task is unknown.
