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
      <Button
        onClick={() => {
          setFirst((prev) => {
            return prev + 1;
          });
        }}
      >
        Load More
      </Button>

      {!!farmQueryRef && (
        <FarmWrongPaginationList farmQueryRef={farmQueryRef} />
      )}
    </React.Suspense>
  );
};
