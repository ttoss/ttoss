---
title: Kanban
---

We use the [Kanban](https://arantespp.com/zettel/kanban) framework to manage our workflow and ensure that we deliver high-quality products to our customers on time and on budget. Kanban is a visual and flexible approach to task management that enables us to optimize our workflow, reduce waste, and increase efficiency.

In this document, we'll provide an overview of the Kanban framework and explain how we use it to manage our workflow. We'll also describe the [Statuses](#statuses) that tasks can go through, as well as provide tips and best practices for using Kanban effectively.

## Statuses

In this section, we'll provide an overview of the different Kanban statuses and their descriptions.

| Status         | Description                                                                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BACKLOG        | This status represents a list of tasks or items awaiting execution in the future. Tasks in the backlog are prioritized based on their importance, urgency, and dependencies. They serve as a reservoir of work to be pulled into active development as capacity allows.                                                        |
| READY TO START | Indicating tasks that have been planned and are prepared for immediate execution. Tasks in this status are prioritized and ready to be picked up by team members for implementation. They are typically ordered based on business value, dependencies, or other criteria determined by the team.                               |
| WORKING        | Tasks in this status are actively being worked on by team members. This includes implementation, review, and testing activities. Work progresses through this stage until it is completed or encounters a blocking issue.                                                                                                      |
| BLOCKED        | When a task encounters an impediment that prevents progress, it is moved into the BLOCKED status. This may occur due to dependencies, resource constraints, or unresolved issues. Team members actively seek resolutions to unblock tasks, often involving collaboration with external stakeholders or subject matter experts. |
| CANCELED       | This status indicates that a task has been terminated or abandoned for various reasons. The decision to cancel a task may stem from changes in priorities, feasibility concerns, or shifting business requirements. The reason for cancellation is typically documented for reference and future analysis.                     |
| COMPLETED      | Tasks in this status have been successfully executed and delivered to the customer or end-user. They have passed all quality checks and meet the specified criteria for completion. Completed tasks may undergo further evaluation or feedback gathering to inform future iterations or improvements.                          |

## FAQ

### How to handle tasks that the team have deployed in production and are waiting for feedback?

Tasks that have been deployed to production and are awaiting feedback from customers or end-users should be moved to the BLOCKED status. This indicates that the task is not yet complete and is pending further validation or acceptance. Once feedback is received and any necessary adjustments are made, the task can be moved to the COMPLETED status.

### What to do when a task is blocked?

When a task is blocked, team members should actively seek to resolve the impediment. This may involve collaborating with other team members, seeking assistance from external stakeholders, or escalating the issue to management. The goal is to unblock the task as quickly as possible to minimize delays and maintain a steady workflow. **It's more important to unblock a task than to start a new one.**
