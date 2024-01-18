import { Button, Flex, Text } from '@ttoss/ui';
import {
  FormSequenceFormFields,
  FormSequenceFormFieldsProps,
} from './FormSequenceFormFields';

type FormSequenceQuestionProps = {
  question: string;
  fields: FormSequenceFormFieldsProps[];
  onNext: () => void;
};

export const FormSequenceQuestion = ({
  fields,
  question,
  onNext,
}: FormSequenceQuestionProps) => {
  return (
    <Flex sx={{ flexDirection: 'column' }}>
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

      <Button
        sx={{ justifyContent: 'center', marginTop: '2xl' }}
        rightIcon="arrow-right"
        onClick={onNext}
      >
        Continuar
      </Button>
    </Flex>
  );
};
