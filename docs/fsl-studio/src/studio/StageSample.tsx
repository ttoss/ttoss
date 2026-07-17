import { Button, Link, Separator, Switch } from '@ttoss/fsl-ui';

/**
 * Phase-0 stage content: a small sample of fsl-ui components proving the
 * theme pipeline end to end. Phase 2 replaces this with the component
 * catalog and full example pages (PRD F3.5).
 *
 * Internal to the Studio app — not part of any public package API.
 */
export const StageSample = () => {
  return (
    <div className="stage-sample">
      <div className="stage-sample-row">
        <Button evaluation="primary">Save</Button>
        <Button evaluation="secondary">Preview</Button>
        <Button evaluation="accent">Publish</Button>
        <Button evaluation="muted">Cancel</Button>
        <Button evaluation="negative" consequence="destructive">
          Delete
        </Button>
      </div>
      <Separator />
      <div className="stage-sample-row">
        <Switch defaultSelected>Notifications</Switch>
        <Link href="https://ttoss.dev/docs/design/design-system/fsl">
          FSL documentation
        </Link>
      </div>
    </div>
  );
};
