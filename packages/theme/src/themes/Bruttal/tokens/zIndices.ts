export const zIndices = {
  deep: -9999,
  behind: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  /**
   * Sticky is a CSS property that can be applied to an element to make it
   * "stick" or remain fixed in a specific position relative to the viewport
   * as the user scrolls the page. When an element is set as sticky, it will
   * initially behave like a normal element but once the user scrolls past a
   * certain threshold, it will stick to the designated position.
   */
  sticky: 100,
  /**
   * An overlay is a graphical element used in user interfaces to cover or
   * partially obscure the underlying content. It is typically a
   * semi-transparent or opaque layer that is positioned above other elements
   * on the screen. Overlays are commonly employed to provide visual effects,
   * create modal or pop-up dialogs, highlight or focus user attention, or
   * serve as a background for elements such as tooltips, modals, or dropdown
   * menus. They are often used to add depth, dimension, and visual hierarchy
   * to the interface by visually separating or layering content.
   */
  overlay: 1000,
  /**
   * A modal is a user interface component that appears as a dialog or window
   * overlay on top of the main content, temporarily interrupting the user's
   * interaction flow. It is commonly used to display additional information,
   * request user input, or confirm an action. Modals typically have a higher
   * z-index value than other elements on the page to ensure they are visually
   * prominent and receive the user's full attention. They often feature a
   * close button or an overlay click outside the modal to dismiss them and
   * return to the underlying content. Modals help to focus user attention and
   * provide a context-specific interaction within a larger interface.
   */
  modal: 2000,
  /**
   * A dropdown is a user interface component that presents a list of
   * selectable options when triggered by a user action, such as clicking on a
   * dropdown button or input field. When activated, a dropdown expands
   * vertically to reveal a list of choices, allowing the user to select a
   * single option. The selected option is then displayed in the closed state
   * of the dropdown. Dropdowns are commonly used to conserve space on a page
   * or provide a convenient way to choose from a predefined set of options.
   * They can be found in various contexts, such as navigation menus, form
   * inputs, or filter controls. Dropdowns enhance user interaction by
   * providing a compact and organized selection mechanism within the interface.
   */
  dropdown: 3000,
  /**
   * A popover is a user interface component that provides contextual
   * information or options when triggered by a user action, such as hovering
   * over an element or clicking a button. It typically appears as a small
   * overlay near the triggering element, offering additional details, actions,
   * or related content. Popovers are designed to be non-intrusive and provide
   * concise information or quick actions without requiring the user to
   * navigate to a different page or screen. They are often used to enhance the
   * user's understanding or provide supplementary functionality within a
   * specific context. Popovers are commonly positioned above other elements in
   * the interface to ensure visibility and accessibility.
   */
  popover: 4000,
  /**
   * A tooltip is a small, informative message or hint that appears when a user
   * hovers over or interacts with an element, such as a button, link, or icon.
   * It is typically displayed as a brief, contextual text or label that
   * provides additional information or clarifies the purpose of the element.
   * Tooltips are used to improve the user's understanding of interface
   * elements and enhance usability. They are generally positioned near the
   * associated element, often appearing as a small box or bubble that pops up
   * temporarily and disappears when the user moves the cursor away from the
   * element. Tooltips are designed to be unobtrusive and provide helpful
   * guidance or supplementary details without requiring the user to take any
   * additional actions.
   */
  tooltip: 5000,
  /**
   * A toast is a brief, temporary notification or message that appears on the
   *  screen to provide important information or alerts to the user. It
   * typically appears as a small box or banner positioned in a non-intrusive
   * area of the interface, such as the top or bottom of the screen. Toasts are
   * used to communicate updates, notifications, or status messages that may
   * require the user's attention but do not require immediate action. They are
   *  designed to be unobtrusive and automatically disappear after a short
   * period, often with a fade-out animation. Toasts are commonly used in web
   * and mobile applications to provide timely feedback or inform the user
   * about completed actions, errors, or system updates.
   */
  toast: 6000,
};
