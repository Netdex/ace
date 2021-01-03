define(function (require, exports, module) {
    "use strict";
    var oop = require('ace/lib/oop');
    var TextMode = require('ace/mode/text').Mode;
    var PukiwikiHighlightRules = require('ace/mode/pukiwiki_highlight_rules').PukiwikiHighlightRules;

    var Mode = function () {
        this.HighlightRules = PukiwikiHighlightRules;

        this.createModeDelegates({
            javascript: require("./javascript").Mode,
            html: require("./html").Mode,
            bash: require("./sh").Mode,
            sh: require("./sh").Mode,
            xml: require("./xml").Mode,
            css: require("./css").Mode,
            c_cpp: require("./c_cpp").Mode,
            python: require("./python").Mode,
            dot: require("./dot").Mode,
            latex: require("./latex").Mode
        });
        this.$behaviour = this.$defaultBehaviour;
    };

    oop.inherits(Mode, TextMode);

    (function () {
        this.$id = "ace/mode/pukiwiki";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
