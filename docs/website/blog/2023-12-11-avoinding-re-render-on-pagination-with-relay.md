---
title: 'Avoiding Re-render on Pagination with Relay'
description: One of the challenges in implementing pagination in web applications is avoiding unnecessary re-renders, which can harm performance. Relay, with its advanced state management and caching techniques, offers elegant solutions to this problem, ensuring that only the affected components are updated when new data is loaded. This is especially important in pagination scenarios, where new data is frequently requested and added to the user interface
authors:
  - rayza
tags:
  - relay
  - graphql
  - react
  - pagination
---

## Introduction to Relay

In a world where efficiency and performance of web applications are crucial, Relay emerges as a powerful solution for data management in React applications. Developed by Facebook, Relay is a JavaScript library that provides a robust abstraction layer over GraphQL, a popular data query language. The main goal of Relay is to facilitate the construction of client applications that interact with GraphQL APIs in an efficient and scalable manner.

### What is Relay?

Relay is a state and data management library for React applications that use GraphQL as a data query language. Unlike other state management approaches, Relay specifically focuses on optimizing interactions with GraphQL APIs, ensuring that data is loaded and manipulated efficiently.

### What is Relay Used For?

Relay serves several fundamental purposes in modern React applications:

- **Data and Component Colocation:** Relay allows developers to define a component's data needs directly in its code, close to the component itself. This improves maintainability and scalability of the application, as data dependencies are explicitly declared and managed.

- **Query Optimization:** One of the biggest advantages of Relay is its ability to optimize GraphQL queries. It automatically aggregates and optimizes multiple queries into a single network request, reducing communication overhead and improving performance.

- **Application State Management:** Relay manages the application's state, including data storage, updates, and cache handling. This relieves developers from the complexity of managing dynamic and related data states.

- **Pagination and Fragment Management:** Relay provides advanced features for handling pagination and data fragments, allowing applications to load large data sets incrementally and efficiently.

## Pagination with Relay

One of the challenges in implementing pagination in web applications is avoiding unnecessary re-renders, which can harm performance. Relay, with its advanced state management and caching techniques, offers elegant solutions to this problem, ensuring that only the affected components are updated when new data is loaded. This is especially important in pagination scenarios, where new data is frequently requested and added to the user interface.

### Approach with `useQueryLoader` + `usePreloadedQuery` + `useState`

This approach involves using `useQueryLoader` to load the query, `usePreloadedQuery` to access the loaded data, and React states to control pagination.

**Advantages:**

1. **Control Flexibility:** Offers granular control over data loading and rendering, allowing customization of pagination behavior as per the specific needs of the application.

2. **Explicit State Management:** Facilitates the implementation of complex state logics, such as resetting the list, applying filters, or performing operations beyond simple pagination.

**Disadvantages:**

1. **Implementation Complexity:** Requires manual management of pagination state, increasing the complexity of the code.

2. **Risk of Unnecessary Re-renders:** Can lead to unnecessary re-renders of the entire component, affecting performance.

3. **Pagination State Maintenance:** Keeping the pagination state synchronized with the loaded data can be challenging and error-prone.

**Code Example:**

```tsx
const farmQuery = graphql`
  query FarmWrongPaginationQuery($first: Int!) {
    farms(first: $first) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const FarmWrongPaginationList = ({
  farmQueryRef,
}: {
  farmQueryRef: PreloadedQuery<FarmWrongPaginationQuery>;
}) => {
  const data = usePreloadedQuery<FarmWrongPaginationQuery>(
    farmQuery,
    farmQueryRef
  );

  return (
    <React.Suspense fallback="Loading...">
      <ul>
        {data.farms?.edges?.map((obj) => {
          return <li key={obj.node.id}>{obj.node.name}</li>;
        })}
      </ul>
    </React.Suspense>
  );
};

export const FarmWrongPagination = () => {
  const [farmQueryRef, loadQuery, dispose] =
    useQueryLoader<FarmWrongPaginationQuery>(farmQuery);

  React.useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  const [first, setFirst] = React.useState(2);

  React.useEffect(() => {
    loadQuery({ first });
  }, [first]);

  return (
    <React.Suspense fallback="Loading...">
      <Heading variant="h3">FarmWrongPagination</Heading>
      <HelpText>Description why is wrong</HelpText>

      {!!farmQueryRef && (
        <FarmWrongPaginationList farmQueryRef={farmQueryRef} />
      )}

      <Button
        onClick={() => {
          setFirst((prev) => {
            return prev + 1;
          });
        }}
      >
        Load More
      </Button>
    </React.Suspense>
  );
};
```

In the example above, the entire component re-renders when pagination occurs. See:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i28z1dyip3i172dsy6a1.gif)

## Why does this happen?

First, we need to understand how **`useQueryLoader`** and **`usePreloadedQuery`** work.

1. **`useQueryLoader`:** This hook is used to load a GraphQL query and returns a reference to the loaded query (queryReference). When the parameters of the query change (for example, when changing pagination parameters), `useQueryLoader` needs to be called again to reload the query with the new parameters.

2. **`usePreloadedQuery`:** This hook uses the queryReference provided by `useQueryLoader` to access the loaded data. When a new query is loaded with `useQueryLoader`, `usePreloadedQuery` accesses the updated data.

**Using React States for Pagination**
When you combine these hooks with React states to control pagination (for example, using a state to store the value of first or offset), the component needs to be updated every time the state changes. This happens for a few reasons:

1. **State Update:** When clicking a "Load more" button, you probably update a state (like first or offset). This triggers an update of the component.

2. **Query Reloading:** After the state update, `useQueryLoader` is called again to reload the query with the new pagination parameters. This also triggers an update of the component.

3. **Data Update:** Finally, `usePreloadedQuery` accesses the new data from the reloaded query, which once again updates the component.

**Result: Chain of Re-renders**
This chain of updates can lead to multiple re-renders of the component, especially if it is complex or has many children. Each time the pagination state is updated, the entire component goes through a rendering cycle, which can be inefficient, especially if only a small part of the data or UI changes (like adding more items to the list).

## How to Optimize

To optimize, you can separate the components in such a way that only the part of the UI that displays the paginated data is updated, instead of re-rendering the entire component. The use of `usePaginationFragment` is a more efficient approach in this sense, as it handles the data update optimally and minimizes re-renders when adding new items to the list.

### Understanding `usePaginationFragment`

**`usePaginationFragment`** is a Relay hook designed to work with paginated data following the GraphQL connection pattern. When it receives a command to load more data (for example, items from a list), `usePaginationFragment` operates intelligently: it generates a new GraphQL query based on the name you defined with the `@refetchable` attribute in your fragment.

The new query generated by `usePaginationFragment` automatically includes the correct parameters for pagination, such as `after`, `before`, `first`, and `last`. This means that instead of redoing the entire query or re-rendering the entire component, `usePaginationFragment` efficiently loads the additional data and integrates it into the existing data set. Thus, only the new items are added and rendered, maintaining the performance and fluidity of the application.

### How `usePaginationFragment` Avoids Unnecessary Re-renders

1. **Incremental Updates:** When you load more items using `usePaginationFragment`, Relay adds these new items to the existing data set incrementally. Instead of replacing all the data and causing a complete re-render, it simply appends the new data. This means that only components displaying the new items need to be updated.

2. **Efficient Data State Management:** Relay maintains a normalized and optimized data store. When new data is loaded through loadNext or loadPrevious, Relay updates only the relevant parts of the store. This leads to more efficient UI updates, as only the components that depend on the updated data are re-rendered.

3. **Intelligent Caching and Data Reuse:** Relay uses a sophisticated caching system that allows reusing data between different components and queries. This means that if part of the data has already been loaded previously, Relay can reuse it without causing unnecessary re-renders.

4. **Rendering Optimization with Suspense:** Relay integrates with React Suspense, allowing you to define suspension points in your application for data loading. This means that Relay can "wait" until all necessary data is available before rendering the component, avoiding partial or incomplete re-renders.

### Important to know before work with pagination using `usePaginationFragment` on relay

To determine if the API you're using supports the `usePaginationFragment` from Relay, you should check several key aspects of the API's structure, particularly how it handles pagination. The `usePaginationFragment` is designed to work with the GraphQL connection pattern, which includes specific elements. Here's what to look for:

1. **GraphQL Connection Pattern**: Check if the API uses the GraphQL connection pattern. This means the API should implement a system of "edges" and "nodes" for lists of data, along with "pageInfo" fields that include "endCursor" and "hasNextPage".

2. **Cursor-based Pagination Support**: The `usePaginationFragment` works well with APIs that support cursor-based pagination. This means the API should allow you to query by specifying a cursor (usually an ID or a token) and a number of items to fetch. Cursors are used to incrementally load subsequent data.

3. **Refetchable Query**: To use `usePaginationFragment`, the GraphQL query needs to be "refetchable". This means it should be structured in a way that Relay can easily redo the query to fetch more data based on the current cursor.

4. **API Documentation**: Review the API documentation for any mention of cursor-based pagination or connection patterns support. Often, the documentation will clearly explain how the API handles pagination and whether it is compatible with Relay's requirements.

5. **Testing with GraphQL Tools**: You can use GraphQL tools like GraphiQL or Apollo Studio to test the API. Try making a pagination query using cursors to see if the API responds as expected.

If the API meets these criteria, it is likely to support `usePaginationFragment`. If not, you may need to adopt an alternative approach to pagination or even contact the API maintainers for more information about its pagination capabilities.

### Practical Example

Let's consider a component that lists "Farms" using **`usePaginationFragment`**:

```tsx
const farmCorrectPaginationQuery = graphql`
  query FarmCorrectPaginationQuery {
    ...FarmCorrectPaginationFragment_query
  }
`;

const farmCorrectPaginationFragment = graphql`
  fragment FarmCorrectPaginationFragment_query on Query
  @refetchable(queryName: "FarmCorrectPagQuery")
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 5 }
  ) {
    farms(first: $count, after: $cursor)
      @connection(key: "FarmCorrectPagination_farms") {
      edges {
        node {
          name
        }
      }
    }
  }
`;

const FarmCorrectPaginationList = ({
  farmQueryRef,
}: {
  farmQueryRef: PreloadedQuery<FarmCorrectPaginationQuery>;
}) => {
  const farmsPreloadedQuery = usePreloadedQuery<FarmCorrectPaginationQuery>(
    farmCorrectPaginationQuery,
    farmQueryRef
  );

  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<
    FarmCorrectPaginationQuery,
    FarmCorrectPaginationFragment_query$key
  >(farmCorrectPaginationFragment, farmsPreloadedQuery);

  return (
    <React.Suspense>
      <Flex sx={{ flexDirection: 'column', gap: 'md', alignItems: 'start' }}>
        <ul>
          {data.farms?.edges?.map((obj) => {
            return <li key={obj?.node?.name}>{obj?.node?.name}</li>;
          })}
          {isLoadingNext && <li key="loading">Loading...</li>}
        </ul>

        {hasNext && (
          <Button
            disabled={isLoadingNext}
            loading={isLoadingNext}
            onClick={() => {
              return loadNext(1);
            }}
          >
            Load More
          </Button>
        )}
      </Flex>
    </React.Suspense>
  );
};

export const FarmCorrectPagination = () => {
  const [farmQueryRef, loadQuery, dispose] =
    useQueryLoader<FarmCorrectPaginationQuery>(farmCorrectPaginationQuery);

  React.useEffect(() => {
    loadQuery({});

    return () => {
      dispose();
    };
  }, []);

  return (
    <React.Suspense fallback="Loading...">
      <Heading variant="h3">FarmCorrectPagination</Heading>

      {!!farmQueryRef && (
        <FarmCorrectPaginationList farmQueryRef={farmQueryRef} />
      )}
    </React.Suspense>
  );
};
```

In this example, when the user clicks to load more, **`loadNext`** is called. Relay manages the addition of these new "Farms" to the existing data optimally, without causing unnecessary re-renders in the component. Now see the result:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fu796od6fxlhpqc4n935.gif)

## Conclusion

Using **`usePaginationFragment`** in Relay offers a more declarative and optimized approach to managing paginated data in React applications. By dealing with the complexities of incremental data updates and intelligent caching, Relay facilitates the creation of responsive and efficient user interfaces, even when dealing with large sets of data and pagination operations.
