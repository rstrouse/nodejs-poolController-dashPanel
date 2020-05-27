import * as path from "path";

export class ApiError extends Error {
    constructor(message: string, code?: number, httpCode?: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code || 0;
        this.httpCode = httpCode || 400;
        let pos: any = {};
        if (typeof this.stack !== 'undefined') {
            try {
                // Another weirdo decision by NodeJS to not include the line numbers and source.  Only a text based stack trace.
                let lines = this.stack.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (line.trimLeft().startsWith('at ')) {
                        let lastParen = line.lastIndexOf(')');
                        let firstParen = line.indexOf('(');
                        if (lastParen >= 0 && firstParen >= 0) {
                            let p = line.substring(firstParen + 1, lastParen);
                            let m = /(\:\d+\:\d+)(?!.*\1)/g;
                            let matches = p.match(m);
                            let linecol = '';
                            let lastIndex = -1;
                            if (matches.length > 0) {
                                linecol = matches[matches.length - 1];
                                lastIndex = p.lastIndexOf(linecol);
                                p = p.substring(0, lastIndex);
                                if (linecol.startsWith(':')) linecol = linecol.substring(1);
                                let lastcolon = linecol.lastIndexOf(':');
                                if (lastcolon !== -1) {
                                    pos.column = parseInt(linecol.substring(lastcolon + 1), 10);
                                    pos.line = parseInt(linecol.substring(0, lastcolon), 10);
                                }
                            }
                            let po = path.parse(p);
                            pos.dir = po.dir;
                            pos.file = po.base;
                        }
                        break;
                    }
                }
            } catch (e) { }
        }
        this.position = pos;
    }
    public code: number = 0;
    public httpCode: number = 500;
    public position: any = {}
}