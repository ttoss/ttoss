import * as React from 'react';
import {
  PreloadedQuery,
  graphql,
  usePreloadedQuery,
  useQueryLoader,
} from 'react-relay';

import { Button } from '@ttoss/ui';
import { FarmWrongPaginationQuery } from './__generated__/FarmWrongPaginationQuery.graphql';

const farmQuery = graphql`
  query FarmWrongPaginationQuery($first: Int!) {
    farms(first: $first) {
      edges {
        node {
          name
        }
      }
    }
  }
`;

const FarmWrongPaginationList = ({
  farmQuery,
}: {
  farmQuery: PreloadedQuery<FarmWrongPaginationQuery>;
}) => {
  const data2 = usePreloadedQuery<FarmWrongPaginationQuery>(
    farmQuery,
    farmQuery
  );

  return (
    <React.Suspense fallback="Loading...">
      <ul>
        {data2?.farms?.edges?.map((obj) => {
          return <li key={obj?.node?.name}>{obj?.node?.name}</li>;
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

  // React.useEffect(() => {
  //   loadQuery({ first });
  // }, [first]);

  return (
    <React.Suspense fallback="Loading...">
      {!farmQueryRef && (
        <Button
          onClick={() => {
            return loadQuery({ first });
          }}
        >
          First Load
        </Button>
      )}

      {!!farmQueryRef && (
        <>
          <Button
            onClick={() => {
              setFirst((prev) => {
                return prev + 1;
              });
              loadQuery({ first });
            }}
          >
            Load More
          </Button>
          <FarmWrongPaginationList farmQuery={farmQueryRef} />
        </>
      )}
    </React.Suspense>
  );
};
