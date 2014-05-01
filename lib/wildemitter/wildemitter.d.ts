declare module "wildemitter" {
    class WildEmitter {
        constructor();
        public on(event: string, groupOrFn?: any, fnOrGroup?: any): WildEmitter;
        public once(event: string, groupOrFn?: any, fnOrGroup?: any): WildEmitter;
        public releaseGroup(groupName: string): WildEmitter;
        public off(event: string, fn?: Function): WildEmitter;
        public emit(event: string, ...args: any[]): WildEmitter;
        private getWildcardCallbacks(eventName: string): any[];
    }
    export = WildEmitter;
}