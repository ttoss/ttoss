---
hide_title: true
---

<h1 align="center">
    Github ↔️ Clickup
</h1>

## 🗃 Clickup

### 1 - User Story

The project's Task starts in the **User Story** on the _Clickup_ platform.

### 2 - User Feedback

Within the main Task, there will be a **User Feedback** section dedicated to product feedbacks, which soon became a _subtasks_.

### 3 - SubTask

Once the **subtask** is created, the developer can work within it.

The **subtask** is divided into two parts, the first is the task description and the second is the chat, where the team can talk about the development of the work.

- Task description:

  - Title;
  - Detail description of what will be done in the task;
  - Evidence (images, GIF, videos etc);

- Chat:

  - Dialogue between team;
  - To tag the whole team at once, just put `@watcher` and leave a comment.

<br />

<h3 align="center">
      <img title="#clickupTask" width="100%" src="https://tt-sandbox-general-purpose.s3.amazonaws.com/Imagem-Clickup-Github.png"/>
<br />
</h3>

## 🗂 Github

### 4 - Link Clickup Task to Github

Before starting the task is necessary to link your **Clickup** task with the repository on **Github**, so that the code can be _stored_, _corrected_ and _merged_.

Following these steps:

- Link **branch** to _Github_;
- Copy the branch description: `Create & Checkout a new branch:`;
- At the paste in the terminal from the main branch;
- This way, push the new branch to _Github_, using this command in the terminal: `git push origin HEAD`.

<br />

<h3 align="center">
      <img title="#clickupTask" width="100%" src="https://tt-sandbox-general-purpose.s3.amazonaws.com/Clickup-Github.gif"/>
<br />
</h3>

### 5 - Doing task

As the _branch_ linked to **Clickup** and **Github**, development can be done and delivered.

Following these steps:

- Make the commits in the correct branch;
- To upload commits just put the command in the terminal: `git push origin HEAD` ;
- Then open _PR_ on **Github**, to check the team;
- Get the _staging_ link on **Carlin** and put it on the **Clickup** chat to share with the team;
- Finally, wait for the team's approval to _merge_;
