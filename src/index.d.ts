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
    format?: Format
    levels?: string | string[]
    name?: string
    redact?: (context: {}) => void
    timestamp?
};

export default class SenseLogs {
    context: {};
    constructor(options?: ConstructorOptions, context?: {});
    addContext(contexts: {} | {}[]): SenseLogs;
    addDestination(dest: Destination, format?: Format): SenseLogs;
    addFilter(filter?: string | string[]): SenseLogs;
    child(context?: {}): SenseLogs;
    clearContext(): SenseLogs;
    flush(): {}[];
    getFilter(): string[];
    getSample(): {};
    getOverride(): {};
    metrics(namespace: string, values: {}, dimensions?: any[][]): void;
    setDestination(dest: Destination, format?: Format): SenseLogs;
    setFilter(filter?: string | string[]): SenseLogs;
    setOverride(filter?: string | string[], expire?: Date): SenseLogs;
    setSample(filter?: string | string[], rate?: number): SenseLogs;

    //  Default levels
    assert(message: string | Error, context?: {}): void;
    data(message: string | Error, context?: {}): void;
    debug(message: string | Error, context?: {}): void;
    error(message: string | Error, context?: {}): void;
    fatal(message: string | Error, context?: {}): void;
    info(message: string | Error, context?: {}): void;
    silent(message: string | Error, context?: {}): void;
    trace(message: string | Error, context?: {}): void;
    warn(message: string | Error, context?: {}): void;

    //  Custom levels
    emit(level: string, message: string, context?: {}): void;
}
