export function on<K extends keyof GlobalEventHandlersEventMap>(element: Element | Document, name: K, selector: string, listener: (this: GlobalEventHandlers, ev: GlobalEventHandlersEventMap[K]) => any, options?: EventListenerOptions): void;
export function on(element: Element | Document, name: string, selector: string, listener: EventListener, options?: EventListenerOptions): void;
export function off(element: Element | Document, name: string, selector: string, listener: EventListener, options?: EventListenerOptions): void;
export function fire(target: EventTarget, name: string, detail?: any): boolean;
