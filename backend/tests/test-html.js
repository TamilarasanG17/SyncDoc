const { validateHtmlStructure } = require("../src/utils/validateHtml");
const { transformDocumentToHtml } = require("../src/utils/htmlGenerator");

const html = transformDocumentToHtml({
    documentId: "test-2",
    title: "SyncDoc Test",
    nodes: [
        {
            type: "heading",
            content: "Introduction"
        },
        {
            type: "paragraph",
            content: "This is a paragraph."
        },
        {
            type: "code",
            content: "const x = 10;"
        },
        {
            type: "section",
            content: "Section content",
            children: [
                {
                    type: "paragraph",
                    content: "Nested paragraph."
                }
            ]
        }
    ]
});

console.log(html);
console.log(validateHtmlStructure(html));