import { Icon } from '@ttoss/react-icons';
import Link from 'next/link';

const Index = () => {
  return (
    <Link href="/app">
      <Icon icon="arrow-right" />
      Go to App
    </Link>
  );
};

export default Index;
