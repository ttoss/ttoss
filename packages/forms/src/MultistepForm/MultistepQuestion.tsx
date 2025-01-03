import { Flex, Text } from '@ttoss/ui';
import * as React from 'react';

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
        paddingTop: '5',
        paddingX: '6',
      }}
    >
      <Text sx={{ textAlign: 'center', fontSize: 'lg', marginBottom: '5' }}>
        {question}
      </Text>

      <Flex sx={{ flexDirection: 'column', gap: '4' }}>{fields}</Flex>
    </Flex>
  );
};
