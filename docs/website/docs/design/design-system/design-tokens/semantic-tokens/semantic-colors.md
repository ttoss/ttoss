---
id: colorsSemanticTokens
title: Semantic Colors
slug: /design/semantic-tokens/colors
---

Our token structure is organized into three main categories: Context, Nature, and State. This structure ensures clarity, consistency, and flexibility across various UI components.

> Name Pattern: `colors.{ux}.{context}.{nature}`

## Semantic Structure of Design Color Tokens

### UX Tokens

| UX token     | Description                                                                                      | Elements examples                                                                                                                                             |
| :----------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `navigation` | Elements that allow users to explore and find content within the interface.                      | - Navigation Menus: Main menus, secondary menus, and hamburger menus.<br>- Breadcrumbs: Navigation paths.<br>- Footer Links: Additional navigation.           |
| `input`      | Elements that allow user data entry or selection.                                                | - Forms: Text fields, checkboxes, radio buttons.<br>- File Upload: Tools for uploading files.<br>- Date/Time Picker: Calendars and clocks.                    |
| `action`     | Elements that trigger user-driven actions or changes.                                            | - Buttons: Click to execute actions.<br>- Switches and Toggles: Activate/deactivate options.<br>- Dropdowns: Select options.                                  |
| `feedback`   | Elements that communicate the status, results of actions, outcomes, or instructions to the user. | - Error/Success Messages: Validation and confirmation of actions.<br>- Notifications: Alerts and important information.<br>- Tooltips: Tips and instructions. |
| `display`    | Elements that present content or information to the user.                                        | - Texts: Articles, descriptions.<br>- Images and Videos: Multimedia content.<br>- Charts and Tables: Data presentation.                                       |

### Context

The Context defines where the color will be applied within the interface.

| Name         | Description              |
| :----------- | :----------------------- |
| `background` | General backgrounds.     |
| `text`       | Text elements.           |
| `border`     | Borders around elements. |

### Nature

Nature specifies the type or intent of the color, such as the importance or status of the element.

| Name        | Description                                                                                                      |
| :---------- | :--------------------------------------------------------------------------------------------------------------- |
| `primary`   | Primary color.                                                                                                   |
| `secondary` | A secondary color for alternative styling.                                                                       |
| `accent`    | A contrast color for emphasizing UI.                                                                             |
| `muted`     | A faint color for backgrounds, borders, and accents that do not require high contrast with the background color. |
| `negative`  | Cores associated with errors, failures or critical states.                                                       |
| `caution`   | Colors that indicate attention or caution.                                                                       |
| `positive`  | Colors associated with success, confirmation or ideal states.                                                    |

## Extended

### State

The State differentiates between different conditions or interactions of the components.

| Name       | Description                                                                                                                           |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `default`  | The default state of the component when no interaction or user input occurs.                                                          |
| `hover`    | The state when a user hovers over the component with a pointer device.                                                                |
| `active`   | The state of the component when it is actively clicked or engaged.                                                                    |
| `disabled` | The state when the component is unavailable for interaction or input.                                                                 |
| `focused`  | The state when the component is selected or highlighted for interaction, typically via keyboard navigation or assistive technologies. |
| `selected` | The state when the component represents a user choice or is marked as chosen.                                                         |

## Mode

For theme change, like dark mode and light mode we create another theme and do not change by token.
