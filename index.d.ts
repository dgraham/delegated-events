type DelegatedEventListener = (this: Element, ev: CustomEvent & {currentTarget: Element}) => void

export function on<K extends keyof GlobalEventHandlersEventMap>(name: K, selector: string, listener: (this: GlobalEventHandlers & Element, ev: GlobalEventHandlersEventMap[K] & {currentTarget: Element}) => any, options?: EventListenerOptions): void;
export function on(name: string, selector: string, listener: DelegatedEventListener, options?: EventListenerOptions): void;
export function off(name: string, selector: string, listener: DelegatedEventListener, options?: EventListenerOptions): void;
export function fire(target: Document | Element, name: string, detail?: any): boolean;
