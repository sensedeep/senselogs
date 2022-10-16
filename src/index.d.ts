/*
    SenseLogs TypeScript definitions
*/

type Context<T = any> = Record<string, T>

type Destination = {
    write: (log: SenseLogs, context: Context) => void
};

type Format = string | ((context: Context) => void);

type ConstructorOptions = {
    destination?: string | Destination
    filter?: string | string[]
    flag?: string | {}
    format?: Format
    name?: string
    redact?: (context: {}) => void
    timestamp?: boolean
};

type MetricUnit = 'Seconds' | 'Microseconds' | 'Milliseconds' | 'Bytes' | 'Kilobytes' | 'Megabytes' | 'Gigabytes' | 'Terabytes' | 'Bits' | 'Kilobits' | 'Megabits' | 'Gigabits' | 'Terabits' | 'Percent' | 'Count' | 'Bytes/Second' | 'Kilobytes/Second' | 'Megabytes/Second' | 'Gigabytes/Second' | 'Terabytes/Second' | 'Bits/Second' | 'Kilobits/Second' | 'Megabits/Second' | 'Gigabits/Second' | 'Terabits/Second' | 'Count/Second' | 'None'
type MetricUnits<K extends string> = Record<K, MetricUnit>

interface LambdaEvent {
    requestContext: Context
    headers: Record<string, string>
    extendedRequestId: string
    detail: Record<string, string>
}

interface LambdaContext {
    awsRequestId: string
}

export default class SenseLogs {
    context: {};
    constructor(options?: ConstructorOptions, context?: Context);
    addContext(contexts: Context | Context[]): SenseLogs;
    addDestination(dest: Destination, format?: Format): SenseLogs;
    addFilter(filter?: string | string[]): SenseLogs;
    addTraceIds(event: LambdaEvent, context: LambdaContext): SenseLogs;
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
    data(message: string | Error, context?: Context): void;
    debug(message: string | Error, context?: Context): void;
    error(message: string | Error, context?: Context): void;
    fatal(message: string | Error, context?: Context): void;
    info(message: string | Error, context?: Context): void;
    silent(message: string | Error, context?: Context): void;
    trace(message: string | Error, context?: Context): void;
    warn(message: string | Error, context?: Context): void;

    //  Custom channels
    emit(chan: string, message: string, context?: Context): void;

    assert(truthy: any, message?: string | Error, context?: Context): void;
    metrics(chan: string, message: string, namespace: string, values: Context, dimensions?: string[], units?: MetricUnits, properties?: Context): void;
}
