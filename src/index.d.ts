/*
    SenseLogs TypeScript definitions
*/

import { MessageChannel } from "worker_threads";

type Destination = {
    write: (log: SenseLogs, context: {}) => void
};

type Format = string | ((context: {}) => void);

type ConstructorOptions = {
    destination?: string | Destination
    filter?: string | string[]
    flag?: string | {}
    format?: Format
    name?: string
    redact?: (context: {}) => void
    timestamp?: boolean
};

export default class SenseLogs {
    context: {};
    constructor(options?: ConstructorOptions, context?: {});
    addContext(contexts: {} | {}[]): SenseLogs;
    addDestination(dest: Destination, format?: Format): SenseLogs;
    addFilter(filter?: string | string[]): SenseLogs;
    enabled(chan: string): boolean
    child(context?: {}): SenseLogs;
    clearContext(): SenseLogs;
    flush(what?: string): {}[];
    getFilter(): string[];
    getSample(): {};
    getOverride(): {};
    setDestination(dest: Destination, format?: Format): SenseLogs;
    setFilter(filter?: string | string[]): SenseLogs;
    setOverride(filter?: string | string[], expire?: Date): SenseLogs;
    setSample(filter?: string | string[], rate?: number): SenseLogs;

    //  Default channels
    data(message: string | Error, context?: {}): void;
    debug(message: string | Error, context?: {}): void;
    error(message: string | Error, context?: {}): void;
    fatal(message: string | Error, context?: {}): void;
    info(message: string | Error, context?: {}): void;
    silent(message: string | Error, context?: {}): void;
    trace(message: string | Error, context?: {}): void;
    warn(message: string | Error, context?: {}): void;

    //  Custom channels
    emit(chan: string, message: string, context?: {}): void;

    assert(truthy: any, message?: string | Error, context?: {}): void;
    metrics(chan: string, namespace: string, values: {}, dimensions?: any[][]): void;
}
