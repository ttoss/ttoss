import { Flex, Text } from '@ttoss/ui';
import {
  MultistepFormFields,
  MultistepFormFieldsProps,
} from './MultistepFormFields';

type MultistepQuestionProps = {
  question: string;
  fields: MultistepFormFieldsProps[];
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

      <Flex sx={{ flexDirection: 'column', gap: 'xl' }}>
        {fields.map((field) => {
          return (
            <MultistepFormFields
              key={`field-${field.variant}-${field.fieldName}`}
              {...field}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};
