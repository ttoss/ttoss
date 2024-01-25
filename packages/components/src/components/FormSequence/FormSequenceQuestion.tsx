import { Flex, Text } from '@ttoss/ui';
import {
  FormSequenceFormFields,
  FormSequenceFormFieldsProps,
} from './FormSequenceFormFields';

type FormSequenceQuestionProps = {
  question: string;
  fields: FormSequenceFormFieldsProps[];
};

export const FormSequenceQuestion = ({
  fields,
  question,
}: FormSequenceQuestionProps) => {
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
            <FormSequenceFormFields
              key={`field-${field.variant}-${field.fieldName}`}
              {...field}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};
