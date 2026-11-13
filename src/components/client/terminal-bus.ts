// Tiny bridge so the switcher button can open the terminal without shared React state.
const EVENT = 'terminal:toggle';
export const openTerminal = () => window.dispatchEvent(new Event(EVENT));
export const onTerminalToggle = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};
