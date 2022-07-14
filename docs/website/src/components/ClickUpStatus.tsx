import * as React from 'react';

const size = 12;

type Statuses =
  | 'Sorting'
  | 'Ready to Start'
  | 'Working'
  | 'Blocked'
  | 'Canceled'
  | 'Closed';

const colors: { [status in Statuses]: string } = {
  Sorting: 'rgb(181, 188, 194)',
  'Ready to Start': 'rgb(155, 89, 182)',
  Working: 'rgb(255, 120, 0)',
  Blocked: 'rgb(255, 64, 129)',
  Canceled: 'rgb(128, 0, 0)',
  Closed: 'rgb(107, 201, 80)',
};

export const ClickUpStatus = ({ status }: { status: Statuses }) => {
  return (
    <>
      <div
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: colors[status],
          marginRight: 8,
        }}
      />
      <span>{status}</span>
    </>
  );
};
