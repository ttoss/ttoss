---
title: Engineering Development Process
---

# Engineering Development Process

This document describes the engineering development process, focused on technical implementation and software delivery. For the product development process (strategy, discovery, and feature definition), see the [product workflow](/docs/product/workflow).

## Overview

Our engineering development process is based on agility and velocity, following the principles described in [First, We Aim for Velocity](/blog/2024/12/17/first-we-aim-for-velocity-driving-fast-and-adaptive-product-development). We use **Trunk-Based Development** as our branching model to ensure continuous integration and rapid deliveries.

<!-- truncate -->

## Development Process

### 1. Task Assignment

The developer receives a task that was previously defined in the [product workflow](/docs/product/workflow), already containing:

- Defined technical requirements
- Clear acceptance criteria
- Established prioritization

### 2. Local Development

#### Trunk-Based Development

We follow the [Trunk-Based Development](https://trunkbaseddevelopment.com/) model, where:

- **Main branch (`main`)**: Always contains stable code ready for production
- **Feature branches**: Short-lived branches (maximum 1-2 days) created from `main`
- **Frequent integration**: Small and frequent commits to the main branch

#### Creating Pull Request

1. **Create branch** from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/feature-name
   ```

2. **Develop** following our [coding practices](/docs/engineering/guidelines)

3. **Create Pull Request** on GitHub when the feature is ready

### 3. Ephemeral Deploy

Automatically, our CI/CD system creates an **ephemeral deploy** for each Pull Request:

- Temporary environment with PR changes
- Unique URL for testing and review
- Allows validation before merge

### 4. Code Review

- **Mandatory approval** from at least one team member
- Code review focusing on:
  - Code quality and maintainability
  - Adherence to established practices
  - Adequate testing
  - Documentation when necessary

### 5. Squash Merge

After approval:

- **Squash merge** to maintain clean history
- Automatic deletion of feature branch
- Integration of changes into `main`

## Deployment Pipeline

### Staging Deploy

1. **Automatic trigger**: Any change to the `main` branch triggers staging deployment
2. **Staging environment**: Production replica for final testing
3. **Validation**: Automated and manual tests are executed
4. **Tag creation**: If staging deployment is successful, a tag is automatically created

### Production Deploy

1. **Tag trigger**: Tag creation triggers production deployment
2. **Automated deployment**: CI/CD system executes deployment without manual intervention
3. **Monitoring**: Monitoring system tracks the application

## Developer Responsibilities

### Post-Deploy Monitoring

**It is the developer's responsibility** to monitor their application in production after deployment to:

- **Verify functionality**: Confirm that the feature is operating correctly
- **Monitor errors**: Observe logs and metrics for at least 30 minutes after deployment
- **Resolve issues**: Act quickly if problems are identified
- **Rollback if necessary**: Decide on rollback in critical cases

### Complete Responsibility Cycle

The developer is responsible for the **complete cycle** of the task:

1. Feature development
2. Testing and validation
3. Deployment and monitoring
4. Post-deployment support
5. Fixes and improvements when necessary

## Tools and Technologies

### CI/CD System

- **GitHub Actions**: Workflow automation
- **Ephemeral deploy**: Temporary environments for each PR
- **Automated deployment**: Staging and production

### Monitoring

- **Centralized logs**: Execution tracking
- **Application metrics**: Performance and availability
- **Alerts**: Automatic problem notifications

### Communication

- **Slack**: Deployment notifications and alerts
- **GitHub**: Code reviews and technical discussions
- **ClickUp**: Task tracking (integration with product)

## Fundamental Principles

### Velocity with Quality

- **Fast cycles**: Daily deployment or more frequent when necessary
- **Fast feedback**: Continuous validation through automated testing
- **Small batches**: Incremental and testable changes

### Shared Responsibility

- **Autonomy**: Developers have autonomy to make technical decisions
- **Accountability**: Responsibility for code from start to finish
- **Collaboration**: Code review and mutual team support

### Continuous Improvement

- **Retrospectives**: Regular process analysis
- **Experimentation**: Testing new tools and practices
- **Adaptation**: Adjustments based on feedback and results

## Product Integration

This engineering workflow integrates with the [product workflow](/docs/product/workflow) at the following points:

- **Task assignment**: Tasks defined in the product process
- **Implementation feedback**: Technical feedback on feasibility and effort
- **Delivery validation**: Confirmation that product criteria have been met
- **Metrics monitoring**: Tracking of KPIs defined by product

For more details on how tasks are created and prioritized, see the [product documentation](/docs/product/workflow).
