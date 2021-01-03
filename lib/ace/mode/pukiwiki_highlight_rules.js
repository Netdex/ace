define(function (require, exports, module) {
    "use strict";

    var modes = require("../config").$modes;

    var oop = require('ace/lib/oop');
    var TextHighlightRules = require('ace/mode/text_highlight_rules').TextHighlightRules;
    var LatexHighlightRules = require("ace/mode/latex_highlight_rules").LatexHighlightRules;

    var PukiwikiHighlightRules = function () {
        var codeBlockStartRule = {
            token: "support.function",
            regex: /^#([^\(\{]+)(?:\(([^\r]*)\))?(\{*)/,
            onMatch: function (value, state, stack, line) {
                var matchTokens = value.match(/^#([^\(\{]+)(?:\(([^\r]*)\))?(\{*)/);
                var divName = matchTokens[1];
                var args = matchTokens[2];
                var beginBrace = matchTokens[3];

                if (beginBrace.length < 2) {
                    this.next = "";
                } else {
                    var language = "";
                    this.next = "codeblock";

                    switch (divName) {
                        case 'highlight':
                            language = args;
                            break;
                        case 'graphviz':
                            language = "dot";
                            break;
                        default:
                            language = "text";
                            break;
                    }

                    if (!modes[language])
                        language = "text";

                    stack.unshift("codeblock", [], [matchTokens[1], '}'.repeat(matchTokens[3].length), language], state);
                }
                return this.token;
            }
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
                    token: "keyword",
                    regex: /\$\$/,
                    next: "latex-start"
                }, {
                    token: "keyword",
                    regex: /\$/,
                    next: "latex-inline-start"
                }, {
                    token: "markup.raw",
                    regex: /^\s.*$/
                }, {
                    token: ["keyword", "text"],
                    regex: /^(----+)(.*)$/
                }, {
                    token: "comment",
                    regex: /^\/\/.*$/
                }, {
                    token: ["keyword", "text"],
                    regex: /^(LEFT|CENTER|RIGHT)(:)/
                }, {
                    token: ["keyword", "text"],
                    regex: /(&\w+)((?:\((?:(?!\)[;{]).)*\))?(?:{(?:.|(?!};).)*})?;)/
                }, {
                    token: function (head) {
                        return "markup.heading." + head.length;
                    },
                    regex: /^(\*{1,4})/
                }, {
                    token: ["keyword"],
                    regex: /~/
                }, {
                    token: "markup.list",
                    regex: /^([-+]{1,4})(?![-+])/
                }, {
                    token: "markup.quote",
                    regex: /^([><]{1,4})(?![><])/
                }, {
                    token: "markup.bold",
                    regex: /''(?!')((?:(?!'').)*)''/
                }, {
                    token: "markup.italic",
                    regex: /'''(?!')((?:(?!''').)*)'''/
                }, {
                    token: ["keyword", "comment", "keyword"],
                    regex: /(\(\()((?:(?=\(\().|(?!\)\)).)*)(\)\))/
                }, {
                    token: ["keyword", "markup.italic", "keyword", "markup.underline", "keyword"],
                    regex: /(\[\[)((?:(?:(?!\]\]).)+))(>|:)((?:(?:https?|ftp|news):\/\/|mailto:)[\w\/\@\$()!?&%#:;.,~'=*+-]+)(\]\])/
                }, {
                    token: ["keyword", "markup.underline", "markup.italic", "keyword"],
                    regex: /(\[)((?:(?:https?|ftp|news):\/\/|\.\.?\/)[!~*'();\/?:\@&=+\$,%#\w.-]*)(\s[^\]]+)(\])/
                }, {
                    token: "markup.underline",
                    regex: /[\w.-]+@[\w-]+\.[\w.-]+/
                }, {
                    token: ["keyword", "markup.italic", "keyword", "markup.underline", "keyword"],
                    regex: /(\[\[)((?:(?!\]\]).)+)(>|:)([\w.-]+@[\w-]+\.[\w.-]+)(\]\])/
                },
                codeBlockStartRule
            ],
            'codeblock': codeBlockRules
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
        }, {
            token: "invalid",
            regex: /^.*/
        }]);
    };

    oop.inherits(PukiwikiHighlightRules, TextHighlightRules);

    exports.PukiwikiHighlightRules = PukiwikiHighlightRules;
});
