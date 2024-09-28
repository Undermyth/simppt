const puppeteer = require('puppeteer');
const fs = require('fs')

const MdParser = require('./mdparser');

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
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
        }
    });

    // 关闭浏览器
    await browser.close();
}

const fileContent = fs.readFileSync('main.md', 'utf-8');
const parser = new MdParser()
var pages = parser.splitPages(fileContent);
pages = parser.MarkdownToHTML(pages);
pages = parser.ImageToBase64(pages);
const baseCSS = parser.YAMLToCSS(pages);

var html_content = ""
for (var i = 0; i < pages.length; ++i) {
    html_content += pages[i].content;
    if (i != pages.length - 1) {
        html_content += "\n<div style=\"page-break-before: always\" ></div>\n"
    }
}

// const baseCss = fs.readFileSync('base.css', 'utf-8');
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
        <style>
            ${baseCSS}
        </style>
    </html>
    `

// 调用函数生成PDF
generatePDF(html_content, 'output.pdf').then(() => {
    console.log('PDF generated successfully.');
}).catch(err => {
    console.error('Error generating PDF:', err);
});
// console.log(pages);


fs.writeFile('output.html', html_content, (err) => {
    if (err) {
        console.error('写入 HTML 文件时出错:', err);
    } else {
        console.log('HTML 文件已成功生成为 output.html');
    }
});
