import * as React from 'react';
import { Button, Heading, HelpText } from '@ttoss/ui';
import { FarmWrongPaginationQuery } from './__generated__/FarmWrongPaginationQuery.graphql';
import {
  PreloadedQuery,
  graphql,
  usePreloadedQuery,
  useQueryLoader,
} from 'react-relay';

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

      <HelpText>
        The combined use of useQueryLoader and usePreloadedQuery in Relay can
        lead to unnecessary re-renders due to their operation and interaction
        with React state. When you use useQueryLoader, it loads a GraphQL query
        and returns a reference to this query. If you are using React states to
        control pagination (like the number of items to be loaded), any change
        in this state (such as clicking a button to load more items) will
        trigger a re-render of the component. This happens because the change in
        state leads to a new call of useQueryLoader to reload the query with new
        parameters, and usePreloadedQuery then accesses the updated data. This
        sequence of events results in multiple re-renders, especially if the
        component is complex or has many children, since each update to the
        pagination state initiates a new render cycle for the entire component.
      </HelpText>

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
