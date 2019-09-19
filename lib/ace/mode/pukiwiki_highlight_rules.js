define(function (require, exports, module) {
    "use strict";

    var modes = require("../config").$modes;

    var oop = require('ace/lib/oop');
    var TextHighlightRules = require('ace/mode/text_highlight_rules').TextHighlightRules;
    var LatexHighlightRules = require("ace/mode/latex_highlight_rules").LatexHighlightRules;

    var PukiwikiHighlightRules = function () {
        var codeBlockStartRule = {
            token: "support.function",
            regex: /^#highlight\(\w+\)\s*{{+/,
            onMatch: function (value, state, stack, line) {
                var m = value.match(/^#highlight\((\w+)\)({{+)/);
                var language = /[\w-\/]+/.exec(m[1])[0];
                // TODO lazy-load modes
                if (!modes[language])
                    language = "";
                stack.unshift("githubblock", [], [m[1], '}'.repeat(m[2].length), language], state);
                return this.token;
            },
            next: "githubblock"
        };
        var codeBlockRules = [{
            token: "support.function",
            regex: ".*",
            onMatch: function (value, state, stack, line) {
                var embedState = stack[1];
                var indent = stack[2][0];
                var endMarker = stack[2][1];
                var language = stack[2][2];

                var m = /^(}}+)$/.exec(value);
                if (
                    m
                    && m[1].length >= endMarker.length && m[1][0] === endMarker[0]
                ) {
                    stack.splice(0, 3);
                    this.next = stack.shift();
                    return this.token;
                }
                this.next = "";
                if (language && modes[language]) {
                    var data = modes[language].getTokenizer().getLineTokens(value, embedState.slice(0));
                    stack[1] = data.state;
                    return data.tokens;
                }
                return this.token;
            }
        }];
        this.$rules = {
            'start': [
                {
                    token: "comment",
                    regex: /\(.*\)/
                }, {
                    token: "keyword",
                    regex: /\$\$/,
                    next: "latex-start"
                }, {
                    token: "keyword",
                    regex: /\$/,
                    next: "latex-inline-start"
                },{
                    token: "markup.raw",
                    regex: /^\s.*$/
                }, {
                    token: ["keyword", "invalid"],
                    regex: /^(----)(.*)$/
                }, {
                    token: "comment",
                    regex: /^\/\/.*$/
                }, {
                    token: ["keyword", "text"],
                    regex: /^(LEFT|CENTER|RIGHT)(:)/
                }, {
                    token: function (head) {
                        return "markup.heading." + head.length;
                    },
                    regex: /^(\*{1,4})/
                },{
                    token: ["keyword"],
                    regex: /~/
                },{
                    token: ["markup.list", "text"],
                    regex: /^([-+]{1,4})([^-+]|$)/
                },{
                    token: ["markup.quote", "text"],
                    regex: /^([><]{1,4})([^><]|$)/
                },
                codeBlockStartRule
            ],
            'githubblock': codeBlockRules
        }
        ;
        this.embedRules(LatexHighlightRules, "latex-", [{
            token: "keyword",
            regex: /\$\$/,
            next: "start"
        }]);
        this.embedRules(LatexHighlightRules, "latex-inline-", [{
            token: "keyword",
            regex: /\$/,
            next: "start"
        }]);
    };

    oop.inherits(PukiwikiHighlightRules, TextHighlightRules);

    exports.PukiwikiHighlightRules = PukiwikiHighlightRules;
});
