const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Converts a transformed AST node into HTML.
 *
 * Supported node types:
 * - heading
 * - paragraph
 * - code
 * - text
 * - section
 */
const transformNodeToHtml = (node) => {
    if (!node || typeof node !== "object") {
        return "";
    }

    const type =
        typeof node.type === "string"
            ? node.type.trim().toLowerCase()
            : "";

    const content =
        typeof node.content === "string"
            ? node.content
            : "";

    const children = Array.isArray(node.children)
        ? node.children
            .map(transformNodeToHtml)
            .join("")
        : "";

    switch (type) {
        case "heading":
            return `<h2>${content}${children}</h2>`;

        case "paragraph":
            return `<p>${content}${children}</p>`;

        case "code":
            return `<pre><code>${content}</code></pre>`;

        case "text":
            return `<span>${content}${children}</span>`;

        case "section":
            return `<section>${content}${children}</section>`;

        default:
            return children;
    }
};

/**
 * Converts a transformed document into HTML.
 */
const transformDocumentToHtml = (document) => {
    if (!document || typeof document !== "object") {
        return "";
    }

    const title =
        typeof document.title === "string"
            ? document.title
            : "";

    const nodes = Array.isArray(document.nodes)
        ? document.nodes
            .map(transformNodeToHtml)
            .join("")
        : "";

    const html = `
        <article>
            <h1>${title}</h1>
            ${nodes}
        </article>
    `;

    return DOMPurify.sanitize(html);
};

module.exports = {
    transformNodeToHtml,
    transformDocumentToHtml,
};