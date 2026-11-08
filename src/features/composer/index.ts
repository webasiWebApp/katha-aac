// Public API of the composer feature. Other features import ONLY from here.
export {
  ChildButton,
  type ChildButtonKind,
  type ChildButtonProps,
  type ChildButtonState,
} from './ui/ChildButton';
export {
  MessageBar,
  type MessageBarProps,
  type MessageBarState,
  type MessageBarSymbol,
  type SentencePart,
} from './ui/MessageBar';
export { MessageChip, type MessageChipProps, type MessageChipState } from './ui/MessageChip';
export { TemplateSlot, type TemplateSlotProps, type TemplateSlotState } from './ui/TemplateSlot';
export {
  composerReducer,
  initialComposerState,
  buttonStates,
  SLOT,
  type ComposerState,
  type ComposerAction,
} from './domain/composer';
export { highlightSchedule } from './domain/highlight';
export { useComposer, labelOfId } from './ui/useComposer';
