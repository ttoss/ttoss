---
title: Projects
---

## Creating a New Project

When creating a new project, you should create a folder with the project name inside the folder `projects/` of our [monorepo](/docs/engineering/proposals/accepted/22-08-24-monorepo). Every application that composes the project should be inside the project folder, and the package name should have the scope of the project name.

For example, if the project name is `my-project`, then you should create the folder `projects/my-project`. If it has an App, API, and a notification service, then you could create the folders `projects/my-project/app`, `projects/my-project/api` and `projects/my-project/notification-service`, whose package names would be `@my-project/app`, `@my-project/api` and `@my-project/notification-service` respectively.

:::info

The project and package names should be in `kebab-case`.

:::

## Packages Folder Structure

We separate our code by modules (features) and not by file type. This means we don't have a folder for `components`, `pages`, `hooks`, `models`, etc. Instead, we have a folder for each module, which contains all the files related to that module. [Colocation](https://kentcdodds.com/blog/colocation) is a good practice that we follow in this case.

For example, if we have a module called `User`, we would have a folder named `User` inside the `src` folder. This folder would contain all the files related to the user module, such as `User.tsx`, `UserForm.tsx`, `UserList.tsx`, `useUser.ts`, `useUserForm.ts`, `useUserList.ts`, `user.model.ts`, `user.service.ts`, etc. You can organize these files in subfolders, but it's unnecessary.

We can interpret a module as a part of the application that generates value for the customers.

:::info

The module folder names should be in `PascalCase`.

:::
