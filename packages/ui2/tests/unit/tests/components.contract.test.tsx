/**
 * Universal component contract tests for @ttoss/ui2.
 *
 * Every public ui2 primitive is registered here. testComponentContract()
 * generates 4–5 invariant tests per component that verify the architectural
 * bridge: ComponentExpression → resolveTokens() → scoped CSS vars → DOM.
 *
 * Each component uses `defineComponent()` which auto-generates a `contractConfig`.
 * Registration here is a single `testComponentContract(config)` call — no manual
 * duplication of scope, responsibility, evaluation, or wrapper facts.
 *
 * Note: ValidationMessage is NOT registered here — it requires a Field.Root
 * with invalid=true to render, making standalone contract tests impractical.
 * It is tested through TextField.test.tsx instead.
 *
 * Note: TextField is NOT registered here — it is a composite without its own
 * resolveTokens() call. It is tested through TextField.test.tsx.
 */
import { buttonContractConfig } from 'src/components/Button/Button';
import { helperTextContractConfig } from 'src/components/HelperText/HelperText';
import { inputContractConfig } from 'src/components/Input/Input';
import { labelContractConfig } from 'src/components/Label/Label';

import { testComponentContract } from '../helpers/componentContract';

testComponentContract(buttonContractConfig);
testComponentContract(inputContractConfig);
testComponentContract(labelContractConfig);
testComponentContract(helperTextContractConfig);

