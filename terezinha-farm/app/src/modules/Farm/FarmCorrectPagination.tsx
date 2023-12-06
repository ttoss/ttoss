import * as React from 'react';
import {
  PreloadedQuery,
  graphql,
  usePaginationFragment,
  usePreloadedQuery,
  useQueryLoader,
} from 'react-relay';

import { Button, Flex, Heading, HelpText } from '@ttoss/ui';
import { FarmCorrectPaginationFragment_query$key } from './__generated__/FarmCorrectPaginationFragment_query.graphql';
import { FarmCorrectPaginationQuery } from './__generated__/FarmCorrectPaginationQuery.graphql';

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

      <HelpText>Description why is correct</HelpText>

      {!!farmQueryRef && (
        <FarmCorrectPaginationList farmQueryRef={farmQueryRef} />
      )}
    </React.Suspense>
  );
};
