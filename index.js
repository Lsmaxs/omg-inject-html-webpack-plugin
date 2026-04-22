const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const htmlTags = require( 'html-webpack-plugin/lib/html-tags' );
const { isString, isArray, isObject } = require( './lib/utils/typeof' );
const path = require( 'path' );
const fs = require( 'fs' );

const PLUGIN_NAME = 'omg-inject-html-webpack-plugin';

const cacheContent = {};

class OmgInjectHtmlWebpackPlugin {
    constructor ( options ) {
        const defaultOptions = {
            inject: false,
            htmlDir: '',
            templateParameters: {},
        };
        this.options = Object.assign( defaultOptions, options );
        if ( this.options.inject !== undefined && typeof this.options.inject !== 'boolean' ) {
            throw new Error( `[${PLUGIN_NAME}] options.inject must be a boolean` );
        }
        this.cwd = process.cwd();
        this.inlineFileContent = {};
    }

    createNewAssetsObject ( assets, item, xhtml ) {
        const tagName = item.tagName;
        const extName = tagName == 'link' ? path.extname( item.attributes.href ).replace( '.', '' ) : path.extname( item.attributes.src ).replace( '.', '' );
        const htmlStr = htmlTags.htmlTagObjectToString( item, xhtml );
        if ( !assets[extName] || !isArray( assets[extName] ) ) {
            assets[extName] = [htmlStr];
        } else {
            assets[extName].push( htmlStr )
        }
    }

    async createInlineStaticObject ( compilation ) {
        const entrys = compilation.options.entry;
        const regex = /\?__inline/;
        const { promises: fsp } = fs;

        if ( isObject( entrys ) ) {
            const entryKeys = Object.keys( entrys );
            for ( const entry of entryKeys ) {
                let target = entrys[entry];
                // webpack 5: entry 可能是 { import: [...] } 描述符对象
                if ( isObject( target ) && target.import ) {
                    target = isArray( target.import ) ? target.import[target.import.length - 1] : target.import;
                }
                target = isArray( target ) ? target[target.length - 1] : target;

                if ( isString( target ) && regex.test( target ) ) {
                    const [file] = target.split( '?' );
                    let filePath = '';
                    if ( file[0] != '/' && file[0] != '.' ) {
                        filePath = path.join( this.cwd, './node_modules', file );
                    } else {
                        filePath = path.join( this.cwd, file );
                    }

                    if ( cacheContent[filePath] ) {
                        this.inlineFileContent[entry] = `<script>${cacheContent[filePath]}</script>`;
                    } else {
                        try {
                            const content = await fsp.readFile( filePath, 'utf8' );
                            this.inlineFileContent[entry] = `<script>${content}</script>`;
                            cacheContent[filePath] = content;
                        } catch ( e ) {
                            // 文件不存在，静默跳过
                        }
                    }
                }
            }
        }
    }

    templateParametersGenerator ( compilation, assets, assetTags, options ) {
        const _self = this;
        options.inject = _self.options.inject;

        // 如果开启默认inject，那么将不会进行任何操作
        if ( options.inject ) {
            return {
                compilation: compilation,
                webpackConfig: compilation.options,
                htmlWebpackPlugin: {
                    tags: assetTags,
                    files: assets,
                    options: options
                }
            };
        }

        const xhtml = options.xhtml;
        const inject = options.inject;
        const crossOriginLoading = compilation.options.output.crossOriginLoading;

        const newAssets = {
            js: [],
            css: [],
            manifest: assets.manifest,
            favicon: assets.favicon,
        };

        // html-webpack-plugin v5: assetTags 是 { headTags: HtmlTagArray, bodyTags: HtmlTagArray }
        [ 'headTags', 'bodyTags' ].forEach( ( key ) => {
            const tags = assetTags[key];
            if ( tags ) {
                tags.forEach( ( item ) => {
                    item.attributes = !item.attributes ? {} : item.attributes;
                    if ( crossOriginLoading ) {
                        item.attributes.crossorigin = crossOriginLoading;
                    }
                    _self.createNewAssetsObject( newAssets, item, xhtml );
                } );
            }
        } );

        return {
            assets: newAssets,
            inline: { ...this.inlineFileContent },
            ..._self.options.templateParameters
        };
    }

    apply ( compiler ) {
        compiler.hooks.compilation.tap( PLUGIN_NAME, ( compilation ) => {
            const hooks = HtmlWebpackPlugin.getCompilationHooks ? HtmlWebpackPlugin.getCompilationHooks( compilation ) : HtmlWebpackPlugin.getHooks( compilation );
            hooks.beforeAssetTagGeneration.tapAsync( PLUGIN_NAME, async ( data, cb ) => {
                data.plugin.options.templateParameters = async ( compilation, assets, assetTags, options ) => {
                    await this.createInlineStaticObject( compilation );
                    return this.templateParametersGenerator( compilation, assets, assetTags, options );
                };
                cb( null, data );
            } );
        } );
    }
}

module.exports = OmgInjectHtmlWebpackPlugin;
