const { JSDOM } = require("jsdom");

/**
 * Validates the structure of generated SyncDoc HTML.
 *
 * Required structure:
 * - article element
 * - h1 document title
 * - at least one supported content element
 */
const validateHtmlStructure = (html) => {
    if (typeof html !== "string" || !html.trim()) {
        return {
            valid: false,
            errors: ["HTML output is empty."],
        };
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const errors = [];

    const article = document.querySelector("article");

    if (!article) {
        errors.push("Missing <article> element.");
    }

    const title = document.querySelector("article > h1");

    if (!title) {
        errors.push("Missing document title <h1> element.");
    }

    const contentElements = document.querySelector(
        "article h2, article p, article pre, article span, article section"
    );

    if (!contentElements) {
        errors.push("Document contains no supported content elements.");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateHtmlStructure,
};