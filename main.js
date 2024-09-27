const puppeteer = require('puppeteer');
const fs = require('fs')
const { Marked } = require('marked');
const markedKatex = require("marked-katex-extension");
const { markedHighlight } = require("marked-highlight");
const hljs = require('highlight.js');

function extractMarkdownContent(fileContent) {
    // 使用正则表达式匹配 YAML 前置元数据（包括空的情况）和 Markdown 内容
    const pattern = /(---\n(.*?)(\n)?---\n)((?:(?!---\n).)*)/gs;
    const matches = fileContent.matchAll(pattern);

    const pages = [];
    for (const match of matches) {
        const yamlContent = match[2] ? match[2].trim() : '';
        const markdownContent = match[4] ? match[4].trim() : '';

        // 如果 YAML 内容为空，保留 Markdown 内容
        if (!yamlContent && markdownContent) {
            pages.push({ config: '', content: markdownContent });
        } else if (markdownContent) {
            pages.push({ config: yamlContent, content: markdownContent });
        }
    }

    return pages;
}

async function generatePDF(html, path) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 设置页面内容
    await page.setContent(html);

    // 生成PDF
    await page.pdf({
        path,
        width: '33.87cm',
        height: '19.05cm',
        printBackground: true,
        margin: {
            top: '0.5cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
        }
    });

    // 关闭浏览器
    await browser.close();
}

const fileContent = fs.readFileSync('main.md', 'utf-8');
const pages = extractMarkdownContent(fileContent);

const options = {
    throwOnError: false
};

const marked = new Marked(
    markedKatex(options),
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);
for (var i = 0; i < pages.length; ++i) {
    pages[i].content = marked.parse(pages[i].content);
}

var html_content = ""
for (var i = 0; i < pages.length; ++i) {
    html_content += pages[i].content;
    if (i != pages.length - 1) {
        html_content += "\n<p style=\"page-break-before: always\" ></p>\n"
    }
}
html_content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossorigin="anonymous">
    <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/default.min.css">
    </head>
    <body>
    ${html_content}
    </body>
    </html>
`

// 调用函数生成PDF
generatePDF(html_content, 'output.pdf').then(() => {
    console.log('PDF generated successfully.');
}).catch(err => {
    console.error('Error generating PDF:', err);
});
console.log(pages);