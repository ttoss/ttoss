import * as React from 'react';
import { Flex, Text } from '@ttoss/ui';

type MultistepQuestionProps = {
  question: string;
  fields: React.ReactNode | React.ReactNode[];
};

export const MultistepQuestion = ({
  fields,
  question,
}: MultistepQuestionProps) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        paddingTop: 'xl',
        paddingX: '2xl',
      }}
    >
      <Text sx={{ textAlign: 'center', fontSize: 'lg', marginBottom: 'xl' }}>
        {question}
      </Text>

      <Flex sx={{ flexDirection: 'column', gap: 'xl' }}>{fields}</Flex>
    </Flex>
  );
};
