import { Flex, Label } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';

export const FormWarningMessage = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  warning,
  warningMaxLines = 2,
}: {
  name: TName;
  warning?: string | React.ReactNode;
  warningMaxLines?: number;
}) => {
  const {
    formState: { errors },
  } = useFormContext();

  const hasError = !!errors[name];
  const warningRef = React.useRef<HTMLDivElement>(null);
  const [isWarningTruncated, setIsWarningTruncated] = React.useState(false);

  // Check if warning text is truncated based on max lines
  React.useEffect(() => {
    if (warningRef.current && warning) {
      const LINE_HEIGHT = 18; // Assuming line height of 18px
      const MAX_HEIGHT = LINE_HEIGHT * warningMaxLines;
      setIsWarningTruncated(warningRef.current.scrollHeight > MAX_HEIGHT);
    }
  }, [warning, warningMaxLines]);

  const warningLabel = React.useMemo(() => {
    if (warning && !hasError) {
      return (
        <Label
          sx={{
            fontSize: 'sm',
            color: 'feedback.text.caution.default',
          }}
          tooltip={
            isWarningTruncated
              ? {
                  render: (
                    <Flex
                      sx={{
                        width: '400px',
                        maxWidth: '400px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {warning}
                    </Flex>
                  ),
                  place: 'bottom',
                  clickable: true,
                }
              : undefined
          }
        >
          <div
            ref={warningRef}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: warningMaxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              width: 'full',
              fontSize: 'sm',
            }}
          >
            {warning}
          </div>
        </Label>
      );
    }
    return null;
  }, [isWarningTruncated, warning, warningMaxLines, hasError]);

  return warningLabel;
};
