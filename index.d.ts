export function on<K extends keyof GlobalEventHandlersEventMap>(name: K, selector: string, listener: (this: GlobalEventHandlers, ev: GlobalEventHandlersEventMap[K]) => any, options?: EventListenerOptions): void;
export function on(name: string, selector: string, listener: EventListener, options?: EventListenerOptions): void;
export function off(name: string, selector: string, listener: EventListener, options?: EventListenerOptions): void;
export function fire(target: EventTarget, name: string, detail?: any): boolean;
