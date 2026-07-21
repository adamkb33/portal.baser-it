import * as React from 'react';
import { Outlet, useOutletContext } from 'react-router';
import type { RootOutletContext } from '../root.layout';

export default function BookingLayout() {
  const context = useOutletContext<RootOutletContext | undefined>();
  return (
    <>
      <Outlet context={context} />
    </>
  );
}
