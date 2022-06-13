# Testing Guide - Triângulos Tecnologia

## Summary

In the development of tests, an aggregated pattern of good practices must be maintained, which must be reflected by the entire target project in which the tests will be implemented. Tests must be clear, direct and masterfully take advantage of all the features of the language to promote good readability and maintainability, as well as being true, that is, not breaking with internal changes in the code that DO NOT BREAK THE CODE.

## Folders

It is necessary to maintain a rational structure of test folders, use generic and intelligent factors to avoid creating confusion - which will, in the future, end up creating problems such as equal test cases being created, conflicts, unnecessary tests and other possible problems that may appear. Beside, we have a bad example made for a Java project where each small keyword is separated into an entire folder, this is above all quite unnecessary and dangerous, especially in large scale projects.

At Triângulos, the adoption of the folder system in **integration** tests was given by: `/tests/integration/[constsFile[.ts]|otherFiles[.test.ts]`. This arrangement promotes a quick view of the objective of the tests present and quickly passes the necessary information to know that each test is organized in a rational structure within that folder.

<!-- TODO: implement folder information about unit tests -->

## Jest and settings

We use Jest for the creation, maintenance and execution of tests: both unit and integration tests, currently the tool is able to satisfy our needs and (almost) we never had problems with it. **Have a feedback?** Just get in touch and this can be discussed. Currently, for automation reasons, we use the powerful combination of Babel + Jest from the [pre-made configuration offered by TTOS](https://modules.ttoss.dev/docs/core/test-utils), which has tools that can be used both in the back-end and in the front-end, in addition to some extensions interesting for **React** tests.

## Conventions

### Summary

- [Naming the tests](#naming-the-tests)
- [Describing the tests](#describing-the-tests)
- [Single Responsibility Principle](#single-responsibility-principle)
- [Using Data-Operation-Assert](#using-data-operation-assert)
- [Data reliability](#data-reliability)

### Naming the tests

Choose solid and straightforward names, nothing too big, especially in integration tests, tests with too big names can become a tangle of things that can cause confusion and should be corrected to present a shortened name that manages to maintain the logic of your objective.

### Describing the tests

The `describe` method should only be used when it is strictly necessary to have a detailed description about a specific test, in addition, it is important that it is avoided in integration tests unless it is a specific edge case where there is a strict need. Descriptions, if present, should be simple and straightforward, as are the names discussed in the previous topic.

### Single Responsibility Principle

No, this is not **SOLID** in its literal sense, although it implements an interesting rule for developing tests - whether they are unit or integration tests. "The single-responsibility principle (SRP) is a computer-programming principle that states that every module, class or function in a computer program should have responsibility over a single part of that program's functionality, and it should encapsulate that part." - this means that, when implementing tests, the same logic must be used: direct tests, which test only one thing - this includes encompassing specific rules that must be handled in detail.

```js
//Wrong

it("should send the profile data to the API and update the profile view properly", () => {
  // expect(...)to(...);
  // expect(...)to(...);
});
```
```js
//Correct

it("should send the profile data to the API", () => {
  // expect(...)to(...);
});

it("should update the profile view properly", () => {
  // expect(...)to(...);
});
```

### Using Data-Operation-Assert

Organization means efficiency, that's why we use Data-Operation-Assert to organize the data in a visible way, making the test more reliable and interesting in the eyes of new developers who are going to do periodic maintenance or future changes.

> Note: This section is a direct abstraction of [Arrange-Act-Assert pattern](https://github.com/mawrkus/js-unit-testing-guide#-use-the-arrange-act-assert-pattern)

Example:
```js
test("Do anything", () => {
  //=> DATA
  const test = 1;

  //=> OPERATION
  test++;

  //=> ASSERT
  expect(test).toBe(2);
});
```

### Data reliability

- Do not use `.not.toBeNull()`, instead use `toBeTruthy()`. It will be turn the tests more robust and reliable.
- In case of testing various different values with the exact same `expect`, store the items into an array before.
