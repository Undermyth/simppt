const { Marked } = require('marked');
const { markedHighlight } = require("marked-highlight");
const { JSDOM } = require('jsdom');
const markedKatex = require("marked-katex-extension");
const hljs = require('highlight.js');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const YAMLConfig = require('./yamlconfig')

/**
 * MdParser 类用于解析和转换 Markdown 内容
 */
class MdParser {
    constructor() {
        this.marked = new Marked(
            markedKatex({
                throwOnError: false
            }),
            markedHighlight({
                langPrefix: 'hljs language-',
                highlight(code, lang, info) {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                }
            })
        );
        this.config_parser = new YAMLConfig();
    }

    /**
     * 从文件内容中提取Markdown内容和YAML配置
     * 
     * @param {string} fileContent - 包含YAML前置元数据和Markdown内容的文件内容
     * @returns {Array<Object>} 包含配置和内容的页面对象数组
     * @returns {string} returns[].config - YAML配置内容（如果存在）
     * @returns {string} returns[].content - Markdown内容
     * 
     * @description
     * 此方法使用正则表达式来匹配文件内容中的YAML前置元数据和Markdown内容。
     * 它可以处理以下情况：
     * 1. 有YAML配置和Markdown内容
     * 2. 只有Markdown内容，没有YAML配置
     * 3. 多个YAML-Markdown块
     * 
     * 每个匹配的块都会被解析为一个包含config和content属性的对象，
     * 并添加到返回的数组中。
     */
    splitPages(fileContent) {
        const pattern = /(---\n(.*?)(\n)?---\n)((?:(?!---\n).)*)/gs;
        const matches = fileContent.matchAll(pattern);

        const pages = [];
        for (const match of matches) {
            const yamlContent = match[2] ? match[2].trim() : '';
            const markdownContent = match[4] ? match[4].trim() : '';

            if (!yamlContent && markdownContent) {
                pages.push({ config: '', content: markdownContent });
            } else if (markdownContent) {
                pages.push({ config: yamlContent, content: markdownContent });
            }
        }

        return pages;
    }

    /**
     * 处理文本节点，将Markdown转换为HTML
     * @private
     */
    _processTextNode(node, document) {
        if (node.nodeType === 3) {
            console.log(`处理文本节点: ${node.nodeValue.trim()}`);
            const markdownHtml = this.marked.parse(node.nodeValue.trim());
            console.log(`转换为HTML: ${markdownHtml}`);
            const div = document.createElement('div');
            div.innerHTML = markdownHtml;
            node.parentNode.replaceChild(div, node);
            console.log(`替换节点: ${div.outerHTML}`);
        }
    }

    /**
     * 获取文件的MIME类型
     * @private
     * @param {string} filePath - 文件路径
     * @returns {string} - 文件的MIME类型
     */
    _getMimeType(filePath) {
        const path = require('path');
        const extension = path.extname(filePath).toLowerCase();
        
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };

        return mimeTypes[extension] || 'application/octet-stream';
    }
    _processImageNode(node, document) {
        if (node.nodeName.toLowerCase() === 'img') {
            console.log(`处理图片节点: ${node.outerHTML}`);
            const src = node.getAttribute('src');
            try {
                const imageData = fs.readFileSync(path.resolve(src));
                const base64Image = imageData.toString('base64');
                const mimeType = this._getMimeType(src);
                node.setAttribute('src', `data:${mimeType};base64,${base64Image}`);
                console.log(`图片已转换为base64格式`);
            } catch (error) {
                console.error(`读取或转换图片时出错: ${error.message}`);
            }
        }
    }

    /**
     * 遍历DOM树中的所有节点
     * @private
     */
    _traverseNodes(node, document, process_func) {
        for (let child of node.childNodes) {
            process_func.call(this, child, document);
            this._traverseNodes(child, document, process_func);
        }
    }

    /**
     * 将Markdown内容转换为HTML
     * 
     * 这个方法接收一个包含页面对象的数组，每个对象有config和content属性。
     * 它遍历每个页面的content，将Markdown内容转换为HTML。
     * 
     * 方法使用marked库进行Markdown到HTML的转换，并配置了以下功能：
     * 1. KaTeX支持：用于渲染数学公式
     * 2. 代码高亮：使用highlight.js进行代码语法高亮
     * 
     * @param {Array} pages - 包含页面对象的数组，每个对象有config和content属性
     * @returns {Array} - 返回处理后的页面数组，content属性中的Markdown已转换为HTML
     */
    MarkdownToHTML(pages) {
        for (let i = 0; i < pages.length; ++i) {
            const dom = new JSDOM(pages[i].content, { contentType: 'text/html' });
            const document = dom.window.document;
            this._traverseNodes(document.body, document, this._processTextNode);
            pages[i].content = document.body.innerHTML;
        }
        return pages;
    }

    ImageToBase64(pages) {
        for (let i = 0; i < pages.length; ++i) {
            const dom = new JSDOM(pages[i].content, { contentType: 'text/html' });
            const document = dom.window.document;
            this._traverseNodes(document.body, document, this._processImageNode);
            pages[i].content = document.body.innerHTML;
        }
        return pages;
    }

    YAMLToCSS(pages) {
        var css_list = [];
        for (let i = 0; i < pages.length; ++i) {

            // parse the page content in a wrapper div
            const dom = new JSDOM(pages[i].content);
            const document = dom.window.document;
            
            const coverDiv = document.createElement('div');
            if (pages[i].config != '') {
                const config = yaml.load(pages[i].config);
                if ('layout' in config)
                    coverDiv.className = config.layout;
                else
                    coverDiv.className = `content`;
            }
            else {
                coverDiv.className = `content`;
            }
            coverDiv.id = `page-${i}`;
                
            while (document.body.firstChild) {
                coverDiv.appendChild(document.body.firstChild);
            }
            
            document.body.appendChild(coverDiv);
            
            pages[i].content = document.body.innerHTML;

            // parse the css from yaml (if exists)
            if (pages[i].config != '') {
                const config = yaml.load(pages[i].config);
                if ('layout' in config && config.layout == 'cover') {
                    css_list.push(this.config_parser.parseGlobalYAML(config));
                }
                else {
                    css_list.push(this.config_parser.parsePageYAML(`page-${i}`, config));
                }
            }
        }
        // 将css_list中的所有CSS字符串连接成一个字符串
        const combinedCSS = css_list.join('\n');
        return combinedCSS;
    }
}

// 导出 MdParser 类
module.exports = MdParser;