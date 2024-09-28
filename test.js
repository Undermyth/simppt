const { JSDOM } = require('jsdom');
const {marked} = require('marked');

// 示例HTML片段
const htmlFragment = `
<div class="content" id="page-3">
    <h2>divide by divs</h2>
    <div style="display: flex; width: 100%;">
        <div style="width: 50%;">
            - 这是左半边
        </div>
        <div style="width: 50%;">
            - 这是右半边
        </div>
    </div>
</div>
`;

// 使用JSDOM解析HTML片段
const dom = new JSDOM(htmlFragment, { contentType: 'text/html' });
const document = dom.window.document;

// 定义一个函数来处理文本节点
function processTextNode(node, document) {
    if (node.nodeType === 3) { // Node.TEXT_NODE 的值是 3
        // 使用marked将纯文本转换为HTML
        const markdownHtml = marked(node.nodeValue.trim());
        // 创建一个新的div元素来包含转换后的HTML
        const div = document.createElement('div');
        div.innerHTML = markdownHtml;
        // 用新创建的div替换原有的文本节点
        node.parentNode.replaceChild(div, node);
    }
}

// 遍历DOM树中的所有节点
function traverseNodes(node, document) {
    for (let child of node.childNodes) {
        processTextNode(child, document); // 处理文本节点
        traverseNodes(child, document); // 递归遍历子节点
    }
}

// 开始遍历文档中的根节点
traverseNodes(document.body.firstChild, document);

// 获取修改后的HTML字符串
const modifiedHtml = document.body.innerHTML;

console.log('Final modified HTML:');
console.log(modifiedHtml);