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
