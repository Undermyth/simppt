
class YAMLConfig {

    constructor() {
        this.text_size = `25px`;
        this.code_size = `18px`;
        this.math_size = `25px`;
        this.content_title_size = `50px`;
        this.cover_title_size = `60px`;
        this.cover_subtitle_size = `25px`;
    }

    parseGlobalYAML(config) {
        if ('text_size' in config) {
            this.text_size = config.text_size;
        }
        if ('code_size' in config) {
            this.code_size = config.code_size;
        }
        if ('math_size' in config) {
            this.math_size = config.math_size;
        }
        if ('content_title_size' in config) {
            this.content_title_size = config.content_title_size;
        }
        if ('cover_title_size' in config) {
            this.cover_title_size = config.cover_title_size;
        }
        if ('cover_subtitle_size' in config) {
            this.cover_subtitle_size = config.cover_subtitle_size;
        }
        var basecss = `
            body {
                margin: 0;
            }

            .cover {

                /* put text in center of coverpage */
                /* cover page is assume to be fully markdown, so there is a wrapper div */
                div {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }

                /* adjust the font */
                h1 {
                    font-size: ${this.cover_title_size};
                    margin-bottom: 10px;
                }
                h2 {
                    font-size: ${this.cover_subtitle_size};
                    margin: 5px;
                }
            }

            .content {
                h2 {
                    font-size: ${this.content_title_size};
                    margin-top: 20px;
                    border-bottom: 1px solid #000; /* 添加下划线 */
                    padding-bottom: 10px; /* 为下划线和文本之间添加一些间距 */
                }
                /* font sizes */
                p, li {
                    font-size: ${this.text_size};
                }
                code {
                    font-size: ${this.code_size};
                }
                .katex {
                    font-size: ${this.math_size};
                }
            }
        `
        return basecss;
    }

    parsePageYAML(container_id, config) {

        var page_config = []
        page_config.text_size = this.text_size;
        page_config.code_size = this.code_size;
        page_config.math_size = this.math_size;
        page_config.title_size = this.content_title_size;

        if ('text_size' in config) {
            page_config.text_size = config.text_size;
        }
        if ('code_size' in config) {
            page_config.code_size = config.code_size;
        }
        if ('math_size' in config) {
            page_config.math_size = config.math_size;
        }
        if ('title_size' in config) {
            page_config.title_size = config.title_size;
        }

        var pagecss = `
            .content#${container_id} {
                h2 {
                    font-size: ${page_config.title_size};
                    margin-top: 20px;
                    border-bottom: 1px solid #000; /* 添加下划线 */
                    padding-bottom: 10px; /* 为下划线和文本之间添加一些间距 */
                }
                /* font sizes */
                p, li {
                    font-size: ${page_config.text_size};
                }
                code {
                    font-size: ${page_config.code_size};
                }
                .katex {
                    font-size: ${page_config.math_size};
                }
            }
        `

        return pagecss;
    }
}

module.exports = YAMLConfig;
