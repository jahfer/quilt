import {usePerformanceNavigation} from '@quilted/quilt';

import {trpc} from '~/shared/trpc.ts';

import styles from './Start.module.css';

export default function Start() {
  const [data] = trpc.message.useSuspenseQuery('world');

  // This hook indicates that the page has loaded. It is used as part of Quilt’s
  // navigation performance tracking feature. If you have disabled this feature,
  // you can remove this hook.
  usePerformanceNavigation();

  return <div className={styles.Start}>{data}</div>;
}
