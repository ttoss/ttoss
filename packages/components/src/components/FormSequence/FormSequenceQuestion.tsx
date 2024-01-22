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
        paddingY: 'xl',
        paddingX: '2xl',
      }}
    >
      <Text sx={{ textAlign: 'center', fontSize: 'lg' }}>{question}</Text>

      <Flex sx={{ flexDirection: 'column' }}>
        {fields.map((field) => {
          return (
            <FormSequenceFormFields
              key={`field-${field.type}-${field.fieldName}`}
              {...field}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};
